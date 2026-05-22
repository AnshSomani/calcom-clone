const { pool } = require('./db');

async function run() {
  console.log('Migrating database username from john to user_name...');
  const result = await pool.query("UPDATE users SET username = 'user_name' WHERE username = 'john'");
  console.log(`✅ Migration complete. Rows affected: ${result.rowCount}`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
