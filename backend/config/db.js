const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'astromaps_db',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.message);
  } else {
    console.log(`✅ Connected to database: ${process.env.DB_NAME}`);
    release();
  }
});

module.exports = pool;