const express = require('express')
const crypto  = require('crypto')
const router  = express.Router()
const pool    = require('../db/pool')

/* ── Active admin sessions (in-memory, cleared on restart) ── */
const activeSessions = new Set()

/* ════════════════════════════════
   PUBLIC ROUTES
════════════════════════════════ */

// POST /api/submit — save survey response
router.post('/submit', async (req, res) => {
  const { identity, pain_1, pain_2, name, email, phone, organisation } = req.body

  if (!identity || !pain_1 || !name || !email || !phone || !organisation) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
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

// GET /api/view?email=... — return latest entry for that email (email + timestamp only)
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

// POST /api/admin/login — validate credentials from .env
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body

  const adminEmail    = process.env.ADMIN_EMAIL    || ''
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const emailMatch    = email.toLowerCase().trim() === adminEmail.toLowerCase().trim()
  const passwordMatch = password === adminPassword

  if (!emailMatch || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Generate session token
  const token = crypto.randomUUID()
  activeSessions.add(token)

  // Auto-expire token after 8 hours
  setTimeout(() => activeSessions.delete(token), 8 * 60 * 60 * 1000)

  res.json({ token })
})

// Middleware — verify admin token
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '').trim()

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
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

// POST /api/admin/logout — invalidate token
router.post('/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization.replace('Bearer ', '').trim()
  activeSessions.delete(token)
  res.json({ message: 'Logged out' })
})

module.exports = router
