const { getOne, getAll, run } = require('../database/db');

// GET /api/availability
async function getAvailability(req, res) {
  try {
    const user = await getOne('SELECT id FROM users WHERE username = $1', ['john']);
    const availabilities = await getAll('SELECT * FROM availability WHERE user_id = $1 ORDER BY is_default DESC, id', [user.id]);

    const result = [];
    for (const av of availabilities) {
      const schedules = await getAll('SELECT * FROM availability_schedules WHERE availability_id = $1 ORDER BY day_of_week', [av.id]);
      const overrides = await getAll('SELECT * FROM date_overrides WHERE availability_id = $1 ORDER BY date', [av.id]);
      result.push({ ...av, schedules, overrides });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/availability
async function updateAvailability(req, res) {
  try {
    const user = await getOne('SELECT id FROM users WHERE username = $1', ['john']);
    const { timezone, schedules, overrides, name } = req.body;

    let availability = await getOne('SELECT * FROM availability WHERE user_id = $1 AND is_default = true', [user.id]);

    if (!availability) {
      const r = await run('INSERT INTO availability (user_id, name, timezone, is_default) VALUES ($1,$2,$3,$4) RETURNING *',
        [user.id, name || 'Working Hours', timezone || 'America/New_York', true]);
      availability = r.rows[0];
    } else {
      await run('UPDATE availability SET timezone=$1, name=$2 WHERE id=$3',
        [timezone || availability.timezone, name || availability.name, availability.id]);
    }

    if (schedules && Array.isArray(schedules)) {
      await run('DELETE FROM availability_schedules WHERE availability_id = $1', [availability.id]);
      for (const s of schedules) {
        await run('INSERT INTO availability_schedules (availability_id, day_of_week, start_time, end_time, is_active) VALUES ($1,$2,$3,$4,$5)',
          [availability.id, s.day_of_week, s.start_time, s.end_time, s.is_active || false]);
      }
    }

    if (overrides !== undefined && Array.isArray(overrides)) {
      await run('DELETE FROM date_overrides WHERE availability_id = $1', [availability.id]);
      for (const o of overrides) {
        await run('INSERT INTO date_overrides (availability_id, date, start_time, end_time, is_blocked, reason) VALUES ($1,$2,$3,$4,$5,$6)',
          [availability.id, o.date, o.start_time || null, o.end_time || null, o.is_blocked || false, o.reason || null]);
      }
    }

    const updated = await getOne('SELECT * FROM availability WHERE id = $1', [availability.id]);
    const updatedSchedules = await getAll('SELECT * FROM availability_schedules WHERE availability_id = $1 ORDER BY day_of_week', [availability.id]);
    const updatedOverrides = await getAll('SELECT * FROM date_overrides WHERE availability_id = $1 ORDER BY date', [availability.id]);

    res.json({ success: true, data: { ...updated, schedules: updatedSchedules, overrides: updatedOverrides } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/availability
async function createAvailability(req, res) {
  try {
    const user = await getOne('SELECT id FROM users WHERE username = $1', ['john']);
    const { name, timezone, schedules, is_default } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });

    if (is_default) {
      await run('UPDATE availability SET is_default = false WHERE user_id = $1', [user.id]);
    }

    const r = await run('INSERT INTO availability (user_id, name, timezone, is_default) VALUES ($1,$2,$3,$4) RETURNING *',
      [user.id, name, timezone || 'America/New_York', is_default || false]);
    const av = r.rows[0];

    if (schedules && Array.isArray(schedules)) {
      for (const s of schedules) {
        await run('INSERT INTO availability_schedules (availability_id, day_of_week, start_time, end_time, is_active) VALUES ($1,$2,$3,$4,$5)',
          [av.id, s.day_of_week, s.start_time, s.end_time, s.is_active || false]);
      }
    }

    const savedSchedules = await getAll('SELECT * FROM availability_schedules WHERE availability_id = $1 ORDER BY day_of_week', [av.id]);
    res.status(201).json({ success: true, data: { ...av, schedules: savedSchedules, overrides: [] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/availability/:id
async function deleteAvailability(req, res) {
  try {
    const user = await getOne('SELECT id FROM users WHERE username = $1', ['john']);
    const av = await getOne('SELECT * FROM availability WHERE id = $1 AND user_id = $2', [req.params.id, user.id]);
    if (!av) return res.status(404).json({ success: false, error: 'Schedule not found' });
    if (av.is_default) return res.status(400).json({ success: false, error: 'Cannot delete the default schedule' });
    await run('DELETE FROM availability WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getAvailability, updateAvailability, createAvailability, deleteAvailability };
