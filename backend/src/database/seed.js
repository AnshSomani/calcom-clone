const { getOne, getAll, run } = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  // Check if already seeded
  const existingUser = await getOne('SELECT id FROM users WHERE username = $1', ['user_name']);
  if (existingUser) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  // Insert default user
  const userResult = await run(
    `INSERT INTO users (name, username, email, timezone, bio)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['Ansh Somani', 'user_name', 'anshsomani05@gmail.com', 'America/New_York', 'Product designer & startup advisor. Book a call with me!']
  );
  const userId = userResult.rows[0].id;

  // Event types
  const eventTypes = [
    { title: '15 Min Quick Chat', slug: '15min', description: 'A brief 15-minute call to see how I can help you.', duration: 15, color: '#7c3aed', location: 'Google Meet', buffer_before: 0, buffer_after: 5 },
    { title: '30 Min Consultation', slug: '30min', description: 'A focused 30-minute session. Perfect for exploring ideas together.', duration: 30, color: '#0891b2', location: 'Google Meet', buffer_before: 5, buffer_after: 10 },
    { title: '60 Min Strategy Session', slug: '60min', description: 'A deep 60-minute strategy session to map out your goals and action plan.', duration: 60, color: '#059669', location: 'Zoom', buffer_before: 10, buffer_after: 15 },
  ];

  const eventTypeIds = [];
  for (const et of eventTypes) {
    const res = await run(
      `INSERT INTO event_types (user_id, title, slug, description, duration, color, location, buffer_before, buffer_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [userId, et.title, et.slug, et.description, et.duration, et.color, et.location, et.buffer_before, et.buffer_after]
    );
    eventTypeIds.push(res.rows[0].id);
  }

  // Custom questions on 30-min slot
  await run(
    'INSERT INTO booking_questions (event_type_id, label, type, placeholder, is_required, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
    [eventTypeIds[1], 'What would you like to discuss?', 'textarea', 'Briefly describe your topic or question...', true, 0]
  );
  await run(
    'INSERT INTO booking_questions (event_type_id, label, type, placeholder, is_required, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
    [eventTypeIds[1], 'How did you hear about me?', 'text', 'e.g. Twitter, referral, Google...', false, 1]
  );

  // Custom questions on 60-min slot
  await run(
    'INSERT INTO booking_questions (event_type_id, label, type, placeholder, is_required, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
    [eventTypeIds[2], 'What are your main goals for this session?', 'textarea', 'Tell me about your challenges and what success looks like...', true, 0]
  );
  await run(
    'INSERT INTO booking_questions (event_type_id, label, type, placeholder, is_required, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
    [eventTypeIds[2], 'Company / Project name', 'text', 'Optional', false, 1]
  );

  // Default availability (Working Hours)
  const avRes = await run(
    'INSERT INTO availability (user_id, name, timezone, is_default) VALUES ($1, $2, $3, $4) RETURNING id',
    [userId, 'Working Hours', 'America/New_York', true]
  );
  const avId = avRes.rows[0].id;

  for (const d of [1, 2, 3, 4, 5]) {
    await run('INSERT INTO availability_schedules (availability_id, day_of_week, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, $5)', [avId, d, '09:00', '17:00', true]);
  }
  for (const d of [0, 6]) {
    await run('INSERT INTO availability_schedules (availability_id, day_of_week, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, $5)', [avId, d, '09:00', '17:00', false]);
  }

  // Second availability schedule (Early Bird)
  const av2Res = await run(
    'INSERT INTO availability (user_id, name, timezone, is_default) VALUES ($1, $2, $3, $4) RETURNING id',
    [userId, 'Early Bird Hours', 'America/New_York', false]
  );
  const av2Id = av2Res.rows[0].id;
  for (const d of [1, 2, 3, 4, 5]) {
    await run('INSERT INTO availability_schedules (availability_id, day_of_week, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, $5)', [av2Id, d, '07:00', '12:00', true]);
  }
  for (const d of [0, 6]) {
    await run('INSERT INTO availability_schedules (availability_id, day_of_week, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, $5)', [av2Id, d, '07:00', '12:00', false]);
  }

  // Date overrides
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  await run('INSERT INTO date_overrides (availability_id, date, is_blocked, reason) VALUES ($1, $2, $3, $4)', [avId, tomorrowStr, true, 'Personal day off']);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  await run('INSERT INTO date_overrides (availability_id, date, start_time, end_time, is_blocked, reason) VALUES ($1, $2, $3, $4, $5, $6)', [avId, nextWeekStr, '10:00', '15:00', false, 'Shorter day - conference in afternoon']);

  // Sample bookings
  const now = new Date();
  const samples = [
    { etIdx: 0, name: 'Alice Johnson', email: 'alice@example.com', daysFromNow: 1, hour: 10, status: 'confirmed', notes: 'Looking forward to chatting!' },
    { etIdx: 1, name: 'Bob Smith', email: 'bob@example.com', daysFromNow: 2, hour: 14, status: 'confirmed', notes: 'Want to discuss the enterprise plan.' },
    { etIdx: 2, name: 'Carol Davis', email: 'carol@example.com', daysFromNow: 5, hour: 9, status: 'confirmed', notes: 'Need help with product roadmap Q3.' },
    { etIdx: 0, name: 'Daniel Lee', email: 'daniel@example.com', daysFromNow: 7, hour: 11, status: 'confirmed', notes: '' },
    { etIdx: 0, name: 'David Wilson', email: 'david@example.com', daysFromNow: -3, hour: 11, status: 'confirmed', notes: '' },
    { etIdx: 1, name: 'Emma Brown', email: 'emma@example.com', daysFromNow: -7, hour: 15, status: 'cancelled', notes: 'Had a conflict, will rebook.' },
    { etIdx: 2, name: 'Frank Garcia', email: 'frank@example.com', daysFromNow: -14, hour: 10, status: 'confirmed', notes: 'Very productive session!' },
    { etIdx: 1, name: 'Grace Kim', email: 'grace@example.com', daysFromNow: -21, hour: 9, status: 'confirmed', notes: '' },
  ];

  for (const s of samples) {
    const etId = eventTypeIds[s.etIdx];
    const et = eventTypes[s.etIdx];
    const start = new Date(now);
    start.setDate(start.getDate() + s.daysFromNow);
    start.setHours(s.hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + et.duration);
    await run(
      `INSERT INTO bookings (event_type_id, uid, title, booker_name, booker_email, start_time, end_time, status, notes, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [etId, uuidv4(), `${et.title} with ${s.name}`, s.name, s.email, start.toISOString(), end.toISOString(), s.status, s.notes, et.location]
    );
  }

  console.log('✅ Database seeded:');
  console.log('   - 1 user (user_name / anshsomani05@gmail.com)');
  console.log(`   - ${eventTypes.length} event types with custom questions`);
  console.log('   - 2 availability schedules (Working Hours + Early Bird)');
  console.log('   - Date overrides: 1 blocked day, 1 custom hours day');
  console.log(`   - ${samples.length} sample bookings (upcoming + past + cancelled)`);
}

module.exports = { seed };
