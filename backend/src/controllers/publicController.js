const { getOne, getAll, run } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { sendBookingConfirmation, sendCancellationEmail, sendRescheduleEmail } = require('../middleware/emailService');

// GET /api/public/:username/:slug
async function getPublicEventType(req, res) {
  try {
    const { username, slug } = req.params;
    const user = await getOne('SELECT id, name, username, bio, timezone FROM users WHERE username = $1', [username]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const eventType = await getOne('SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND is_active = true', [user.id, slug]);
    if (!eventType) return res.status(404).json({ success: false, error: 'Event type not found or inactive' });

    const questions = await getAll('SELECT * FROM booking_questions WHERE event_type_id = $1 ORDER BY sort_order, id', [eventType.id]);

    res.json({ success: true, data: { user, eventType, questions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/public/:username/:slug/available-dates?month=YYYY-MM
async function getAvailableDates(req, res) {
  try {
    const { username, slug } = req.params;
    const { month } = req.query;
    if (!month) return res.status(400).json({ success: false, error: 'month query param required (YYYY-MM)' });

    const user = await getOne('SELECT id, timezone FROM users WHERE username = $1', [username]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const eventType = await getOne('SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND is_active = true', [user.id, slug]);
    if (!eventType) return res.status(404).json({ success: false, error: 'Event type not found' });

    const availability = await getOne('SELECT * FROM availability WHERE user_id = $1 AND is_default = true', [user.id]);
    if (!availability) return res.json({ success: true, data: [] });

    const activeDays = (await getAll('SELECT day_of_week FROM availability_schedules WHERE availability_id = $1 AND is_active = true', [availability.id])).map(s => s.day_of_week);
    const blockedDates = (await getAll('SELECT date FROM date_overrides WHERE availability_id = $1 AND is_blocked = true', [availability.id])).map(o => o.date);

    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availableDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthNum - 1, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      if (date < today) continue;
      if (!activeDays.includes(dayOfWeek)) {
        // Check if there's a custom override for this date
        const customOverride = await getOne(
          'SELECT id FROM date_overrides WHERE availability_id = $1 AND date = $2 AND is_blocked = false',
          [availability.id, dateStr]
        );
        if (!customOverride) continue;
      }
      if (blockedDates.includes(dateStr)) continue;

      availableDates.push(dateStr);
    }

    res.json({ success: true, data: availableDates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/public/:username/:slug/slots?date=YYYY-MM-DD
async function getAvailableSlots(req, res) {
  try {
    const { username, slug } = req.params;
    const { date, excludeBookingId } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'date query param required' });

    const user = await getOne('SELECT id, timezone FROM users WHERE username = $1', [username]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const eventType = await getOne('SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND is_active = true', [user.id, slug]);
    if (!eventType) return res.status(404).json({ success: false, error: 'Event type not found' });

    const availability = await getOne('SELECT * FROM availability WHERE user_id = $1 AND is_default = true', [user.id]);
    if (!availability) return res.json({ success: true, data: [] });

    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    const override = await getOne('SELECT * FROM date_overrides WHERE availability_id = $1 AND date = $2', [availability.id, date]);

    if (override && override.is_blocked) {
      return res.json({ success: true, data: [] });
    }

    let startTime, endTime;
    if (override && !override.is_blocked) {
      startTime = override.start_time;
      endTime = override.end_time;
    } else {
      const schedule = await getOne(
        'SELECT * FROM availability_schedules WHERE availability_id = $1 AND day_of_week = $2 AND is_active = true',
        [availability.id, dayOfWeek]
      );
      if (!schedule) return res.json({ success: true, data: [] });
      startTime = schedule.start_time;
      endTime = schedule.end_time;
    }

    const slots = generateSlots(date, startTime, endTime, eventType.duration, eventType.buffer_before || 0, eventType.buffer_after || 0);

    // Get booked slots
    let bookedQuery = `
      SELECT start_time, end_time FROM bookings
      WHERE event_type_id = $1 AND status NOT IN ('cancelled', 'rescheduled')
        AND start_time::date = $2::date
    `;
    const queryParams = [eventType.id, date];

    if (excludeBookingId) {
      bookedQuery += ` AND uid != $3`;
      queryParams.push(excludeBookingId);
    }

    const bookedSlots = await getAll(bookedQuery, queryParams);

    const availableSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      return !bookedSlots.some(booked => {
        const bookedStart = new Date(booked.start_time);
        const bookedEnd = new Date(booked.end_time);
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });
    });

    const now = new Date();
    const futureSlots = availableSlots.filter(slot => new Date(slot.start) > now);

    res.json({ success: true, data: futureSlots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

function generateSlots(date, startTime, endTime, durationMinutes, bufferBefore, bufferAfter) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const slotStep = durationMinutes + bufferAfter;

  for (let current = startMinutes; current + durationMinutes <= endMinutes; current += slotStep) {
    const actualStart = current + bufferBefore;
    if (actualStart + durationMinutes > endMinutes) break;

    const startDate = new Date(`${date}T00:00:00`);
    startDate.setMinutes(actualStart);
    const endDate = new Date(`${date}T00:00:00`);
    endDate.setMinutes(actualStart + durationMinutes);

    slots.push({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startTime: formatTime(actualStart),
      endTime: formatTime(actualStart + durationMinutes),
    });
  }
  return slots;
}

function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

// POST /api/public/:username/:slug/book
async function createBooking(req, res) {
  try {
    const { username, slug } = req.params;
    const { name, email, startTime, endTime, notes, customAnswers } = req.body;

    if (!name || !email || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'name, email, startTime, and endTime are required' });
    }

    const user = await getOne('SELECT id, name, email FROM users WHERE username = $1', [username]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const eventType = await getOne('SELECT * FROM event_types WHERE user_id = $1 AND slug = $2 AND is_active = true', [user.id, slug]);
    if (!eventType) return res.status(404).json({ success: false, error: 'Event type not found' });

    // Double-booking check
    const conflict = await getOne(
      `SELECT id FROM bookings WHERE event_type_id = $1 AND status NOT IN ('cancelled', 'rescheduled') AND start_time < $2 AND end_time > $3`,
      [eventType.id, endTime, startTime]
    );
    if (conflict) return res.status(409).json({ success: false, error: 'This time slot is already booked.' });

    const uid = uuidv4();
    const title = `${eventType.title} with ${name}`;
    const status = eventType.requires_confirmation ? 'pending' : 'confirmed';

    const result = await run(`
      INSERT INTO bookings (event_type_id, uid, title, booker_name, booker_email,
        start_time, end_time, status, notes, location, custom_answers)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [eventType.id, uid, title, name, email, startTime, endTime, status, notes || '', eventType.location,
        customAnswers ? JSON.stringify(customAnswers) : null]);

    const booking = result.rows[0];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    sendBookingConfirmation({
      booking, eventType, hostName: user.name, hostEmail: user.email,
      rescheduleUrl: `${frontendUrl}/booking/${uid}/reschedule`,
      cancelUrl: `${frontendUrl}/booking/${uid}?action=cancel`,
    }).catch(console.error);

    res.status(201).json({ success: true, data: { ...booking, event_type: eventType, uid } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/public/booking/:uid/reschedule
async function rescheduleBooking(req, res) {
  try {
    const { uid } = req.params;
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) return res.status(400).json({ success: false, error: 'startTime and endTime are required' });

    const oldBooking = await getOne(`
      SELECT b.*, et.id as event_type_id_val, et.title as et_title, et.duration, et.location as et_location,
             et.color, et.slug, u.name as host_name, u.email as host_email, u.username
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.uid = $1
    `, [uid]);

    if (!oldBooking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (oldBooking.status === 'cancelled') return res.status(400).json({ success: false, error: 'Cannot reschedule a cancelled booking' });

    const conflict = await getOne(
      `SELECT id FROM bookings WHERE event_type_id = $1 AND status NOT IN ('cancelled', 'rescheduled') AND uid != $2 AND start_time < $3 AND end_time > $4`,
      [oldBooking.event_type_id, uid, endTime, startTime]
    );
    if (conflict) return res.status(409).json({ success: false, error: 'Time slot already booked.' });

    const oldStartTime = oldBooking.start_time;
    const newUid = uuidv4();

    await run(`UPDATE bookings SET status = 'rescheduled', updated_at = NOW() WHERE uid = $1`, [uid]);

    const result = await run(`
      INSERT INTO bookings (event_type_id, uid, title, booker_name, booker_email,
        start_time, end_time, status, notes, location, custom_answers, rescheduled_from)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed',$8,$9,$10,$11) RETURNING *
    `, [oldBooking.event_type_id, newUid, oldBooking.title, oldBooking.booker_name, oldBooking.booker_email,
        startTime, endTime, oldBooking.notes, oldBooking.location, oldBooking.custom_answers, uid]);

    const newBooking = result.rows[0];
    const eventType = await getOne('SELECT * FROM event_types WHERE id = $1', [oldBooking.event_type_id]);

    sendRescheduleEmail({ booking: newBooking, eventType, hostName: oldBooking.host_name, oldStartTime }).catch(console.error);

    res.json({ success: true, data: { ...newBooking, uid: newUid } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/public/booking/:uid
async function getBookingByUid(req, res) {
  try {
    const booking = await getOne(`
      SELECT b.*,
             et.title as event_type_title, et.color, et.duration, et.location as event_location, et.slug,
             u.name as host_name, u.email as host_email, u.username
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.uid = $1
    `, [req.params.uid]);

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getPublicEventType, getAvailableDates, getAvailableSlots,
  createBooking, rescheduleBooking, getBookingByUid,
};
