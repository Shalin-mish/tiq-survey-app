// Run once: node db/seed_admin.js
// Creates admin_users table and inserts the default admin account

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const bcrypt = require('bcryptjs')
const pool   = require('./pool')

async function seed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            SERIAL PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const email    = 'admin@tiqworld.com'
  const password = 'Admin@567'
  const hash     = await bcrypt.hash(password, 10)

  await pool.query(
    `INSERT INTO admin_users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [email, hash]
  )

  console.log('Admin user seeded successfully.')
  await pool.end()
}

seed().catch(err => { console.error(err.message); process.exit(1) })
