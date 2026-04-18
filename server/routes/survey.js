const express  = require('express')
const jwt      = require('jsonwebtoken')
const bcrypt   = require('bcryptjs')
const router   = express.Router()
const pool     = require('../db/pool')

const JWT_SECRET = process.env.JWT_SECRET || 'tiqworld_dev_secret_change_in_prod'

/* ════════════════════════════════
   PUBLIC ROUTES
════════════════════════════════ */

// POST /api/submit — save survey response (blocks duplicate emails)
router.post('/submit', async (req, res) => {
  const { identity, pain_1, pain_2, name, email, phone, organisation } = req.body

  if (!identity || !pain_1 || !name || !email || !phone || !organisation) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Duplicate guard — same email can only submit once
    const existing = await pool.query(
      'SELECT id FROM survey_responses WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already submitted' })
    }

    await pool.query(
      `INSERT INTO survey_responses (identity, pain_1, pain_2, name, email, phone, organisation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [identity, pain_1, pain_2 || null, name, email, phone, organisation]
    )
    res.status(201).json({ message: 'Saved' })
  } catch (err) {
    console.error('Submit error:', err.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/view?email=... — return latest entry for that email
router.get('/view', async (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).json({ error: 'Email required' })

  try {
    const result = await pool.query(
      `SELECT email, created_at
       FROM   survey_responses
       WHERE  LOWER(email) = LOWER($1)
       ORDER  BY created_at DESC
       LIMIT  1`,
      [email]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('View error:', err.message)
    res.status(500).json({ error: 'Database error' })
  }
})

/* ════════════════════════════════
   ADMIN ROUTES
════════════════════════════════ */

// POST /api/admin/login — validate credentials from DB, return signed JWT
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM admin_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email.trim()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, result.rows[0].password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '15d' })
    res.json({ token })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// Middleware — verify JWT on protected routes
function requireAdmin(req, res, next) {
  const auth  = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '').trim()

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// GET /api/admin/responses — all survey responses (admin only)
router.get('/admin/responses', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, identity, pain_1, pain_2, phone, organisation, created_at
       FROM   survey_responses
       ORDER  BY created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Admin fetch error:', err.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// POST /api/admin/logout — JWT is stateless; client discards token
router.post('/admin/logout', requireAdmin, (req, res) => {
  res.json({ message: 'Logged out' })
})

module.exports = router
