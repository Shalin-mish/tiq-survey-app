const { Pool } = require('pg')
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'feedback_db',
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD || '',
})

pool.on('error', (err) => console.error('PostgreSQL error:', err.message))

module.exports = pool
