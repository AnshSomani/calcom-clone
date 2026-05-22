require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeSchema } = require('./database/db');
const { seed } = require('./database/seed');

// Routes
const eventTypesRouter = require('./routes/eventTypes');
const availabilityRouter = require('./routes/availability');
const bookingsRouter = require('./routes/bookings');
const publicRouter = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin dynamically to prevent CORS preflight blocks (Failed to fetch) in production
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/event-types', eventTypesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/public', publicRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Initialize database and start server
async function start() {
  try {
    await initializeSchema();
    await seed();
    app.listen(PORT, () => {
      console.log(`\n🚀 Cal.com Clone API running at http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database: PostgreSQL (${process.env.PG_DATABASE || 'calcom_clone'})\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('\nMake sure PostgreSQL is running and the database exists.');
    console.error('Run: createdb calcom_clone');
    process.exit(1);
  }
}

start();
