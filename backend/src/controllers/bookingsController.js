const { getOne, getAll, run } = require('../database/db');
const { sendCancellationEmail } = require('../middleware/emailService');

// GET /api/bookings?status=upcoming|past|cancelled
async function listBookings(req, res) {
  try {
    const user = await getOne('SELECT id FROM users WHERE username = $1', ['john']);
    const { status } = req.query;
    const now = new Date().toISOString();

    let query = `
      SELECT b.*, et.title as event_type_title, et.color, et.duration, et.slug
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE et.user_id = $1
    `;
    const params = [user.id];
    let paramIdx = 2;

    if (status === 'upcoming') {
      query += ` AND b.start_time >= $${paramIdx} AND b.status NOT IN ('cancelled', 'rescheduled')`;
      params.push(now);
      paramIdx++;
    } else if (status === 'past') {
      query += ` AND b.end_time < $${paramIdx} AND b.status NOT IN ('cancelled', 'rescheduled')`;
      params.push(now);
      paramIdx++;
    } else if (status === 'cancelled') {
      query += ` AND b.status = 'cancelled'`;
    }

    query += ` ORDER BY b.start_time ${status === 'past' ? 'DESC' : 'ASC'}`;

    const bookings = await getAll(query, params);
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/bookings/:id
async function getBooking(req, res) {
  try {
    const booking = await getOne(`
      SELECT b.*, et.title as event_type_title, et.color, et.duration, et.slug,
             u.name as host_name, u.email as host_email, u.username
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/bookings/:id/cancel
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await getOne(`
      SELECT b.*, et.title as et_title, et.color, et.duration, et.location as et_location,
             u.name as host_name, u.email as host_email
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.id = $1
    `, [id]);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ success: false, error: 'Already cancelled' });

    const result = await run(
      `UPDATE bookings SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [reason || null, id]
    );

    const eventType = await getOne('SELECT * FROM event_types WHERE id = $1', [booking.event_type_id]);

    sendCancellationEmail({
      booking: result.rows[0],
      eventType,
      hostName: booking.host_name,
      reason,
    }).catch(console.error);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { listBookings, getBooking, cancelBooking };
