-- Cal.com Clone Database Schema (PostgreSQL)

-- Users table (default admin user)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event types table
CREATE TABLE IF NOT EXISTS event_types (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  color TEXT NOT NULL DEFAULT '#6d28d9',
  location TEXT DEFAULT 'Google Meet',
  buffer_before INTEGER DEFAULT 0,
  buffer_after INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Custom booking questions per event type
CREATE TABLE IF NOT EXISTS booking_questions (
  id SERIAL PRIMARY KEY,
  event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'textarea', 'select', 'checkbox', 'phone')),
  placeholder TEXT,
  options TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Availability schedules (multiple per user)
CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Working Hours',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly schedule (day_of_week: 0=Sun, 1=Mon, ..., 6=Sat)
CREATE TABLE IF NOT EXISTS availability_schedules (
  id SERIAL PRIMARY KEY,
  availability_id INTEGER NOT NULL REFERENCES availability(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '17:00',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Date overrides (block dates or set custom hours)
CREATE TABLE IF NOT EXISTS date_overrides (
  id SERIAL PRIMARY KEY,
  availability_id INTEGER NOT NULL REFERENCES availability(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  uid TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending', 'rescheduled')),
  notes TEXT,
  location TEXT,
  custom_answers TEXT,
  rescheduled_from TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_event_type ON bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_uid ON bookings(uid);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_types_user ON event_types(user_id);
CREATE INDEX IF NOT EXISTS idx_event_types_slug ON event_types(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_availability_user ON availability(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_schedules_avail ON availability_schedules(availability_id);
CREATE INDEX IF NOT EXISTS idx_date_overrides_avail ON date_overrides(availability_id);
CREATE INDEX IF NOT EXISTS idx_booking_questions_event ON booking_questions(event_type_id);
