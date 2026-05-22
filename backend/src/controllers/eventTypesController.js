const { getOne, getAll, run } = require('../database/db');

// GET /api/event-types
async function listEventTypes(req, res) {
  try {
    const eventTypes = await getAll(`
      SELECT et.*, u.username, u.name as user_name,
        (SELECT COUNT(*)::int FROM booking_questions bq WHERE bq.event_type_id = et.id) as question_count
      FROM event_types et
      JOIN users u ON et.user_id = u.id
      WHERE et.user_id = (SELECT id FROM users WHERE username = 'john')
      ORDER BY et.created_at DESC
    `);
    res.json({ success: true, data: eventTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/event-types/:id
async function getEventType(req, res) {
  try {
    const eventType = await getOne(`
      SELECT et.*, u.username, u.name as user_name
      FROM event_types et JOIN users u ON et.user_id = u.id
      WHERE et.id = $1
    `, [req.params.id]);
    if (!eventType) return res.status(404).json({ success: false, error: 'Event type not found' });

    const questions = await getAll(
      'SELECT * FROM booking_questions WHERE event_type_id = $1 ORDER BY sort_order, id', [eventType.id]
    );
    res.json({ success: true, data: { ...eventType, questions } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/event-types
async function createEventType(req, res) {
  try {
    const user = await getOne('SELECT id FROM users WHERE username = $1', ['john']);
    const { title, slug, description, duration, color, location, buffer_before, buffer_after, questions, requires_confirmation } = req.body;

    if (!title || !slug || !duration) {
      return res.status(400).json({ success: false, error: 'title, slug, and duration are required' });
    }

    const existing = await getOne('SELECT id FROM event_types WHERE user_id = $1 AND slug = $2', [user.id, slug]);
    if (existing) return res.status(409).json({ success: false, error: 'Slug already in use.' });

    const result = await run(`
      INSERT INTO event_types (user_id, title, slug, description, duration, color, location, buffer_before, buffer_after, requires_confirmation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [user.id, title, slug, description || '', duration, color || '#6d28d9', location || 'Google Meet',
        buffer_before || 0, buffer_after || 0, requires_confirmation || false]);

    const newET = result.rows[0];

    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await run(
          'INSERT INTO booking_questions (event_type_id, label, type, placeholder, options, is_required, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [newET.id, q.label, q.type || 'text', q.placeholder || '', q.options ? JSON.stringify(q.options) : null, q.is_required || false, i]
        );
      }
    }

    const savedQ = await getAll('SELECT * FROM booking_questions WHERE event_type_id = $1 ORDER BY sort_order', [newET.id]);
    res.status(201).json({ success: true, data: { ...newET, questions: savedQ } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/event-types/:id
async function updateEventType(req, res) {
  try {
    const { id } = req.params;
    const { title, slug, description, duration, color, location, buffer_before, buffer_after, is_active, questions, requires_confirmation } = req.body;

    const existing = await getOne('SELECT * FROM event_types WHERE id = $1', [id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Event type not found' });

    if (slug && slug !== existing.slug) {
      const conflict = await getOne('SELECT id FROM event_types WHERE user_id = $1 AND slug = $2 AND id != $3', [existing.user_id, slug, id]);
      if (conflict) return res.status(409).json({ success: false, error: 'Slug already in use.' });
    }

    const result = await run(`
      UPDATE event_types
      SET title=$1, slug=$2, description=$3, duration=$4, color=$5, location=$6,
          buffer_before=$7, buffer_after=$8, is_active=$9, requires_confirmation=$10,
          updated_at=NOW()
      WHERE id=$11 RETURNING *
    `, [
      title ?? existing.title, slug ?? existing.slug, description ?? existing.description,
      duration ?? existing.duration, color ?? existing.color, location ?? existing.location,
      buffer_before ?? existing.buffer_before, buffer_after ?? existing.buffer_after,
      is_active !== undefined ? is_active : existing.is_active,
      requires_confirmation !== undefined ? requires_confirmation : existing.requires_confirmation,
      id
    ]);

    if (questions !== undefined && Array.isArray(questions)) {
      await run('DELETE FROM booking_questions WHERE event_type_id = $1', [id]);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await run(
          'INSERT INTO booking_questions (event_type_id, label, type, placeholder, options, is_required, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [id, q.label, q.type || 'text', q.placeholder || '', q.options ? JSON.stringify(q.options) : null, q.is_required || false, i]
        );
      }
    }

    const savedQ = await getAll('SELECT * FROM booking_questions WHERE event_type_id = $1 ORDER BY sort_order', [id]);
    res.json({ success: true, data: { ...result.rows[0], questions: savedQ } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/event-types/:id
async function deleteEventType(req, res) {
  try {
    const existing = await getOne('SELECT id FROM event_types WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Event type not found' });
    await run('DELETE FROM event_types WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Event type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/event-types/:id/toggle
async function toggleEventType(req, res) {
  try {
    const existing = await getOne('SELECT * FROM event_types WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Event type not found' });
    const result = await run(
      'UPDATE event_types SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { listEventTypes, getEventType, createEventType, updateEventType, deleteEventType, toggleEventType };
