const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'calcom_clone',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '12345',
      }
);

// Log connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

async function initializeSchema() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await pool.query(schema);
  console.log('✅ Schema initialized');
}

async function query(text, params) {
  return pool.query(text, params);
}

async function getOne(text, params) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

async function getAll(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function run(text, params) {
  const result = await pool.query(text, params);
  return result;
}

module.exports = { pool, initializeSchema, query, getOne, getAll, run };
