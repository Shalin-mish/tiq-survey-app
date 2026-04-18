const express   = require('express')
const jwt       = require('jsonwebtoken')
const bcrypt    = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const { v4: uuidv4 } = require('uuid')
const router    = express.Router()
const pool      = require('../db/pool')

const IS_PROD = process.env.NODE_ENV === 'production'

// [BLOCKER FIX] Throw at startup if JWT_SECRET missing in production
if (IS_PROD && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set in production.')
}
const JWT_SECRET = process.env.JWT_SECRET || 'tiqworld_dev_secret_change_in_prod'

/* ════════════════════════════════
   RATE LIMITER — login only
════════════════════════════════ */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again after 15 minutes.' },
})

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

// POST /api/admin/login — validate credentials, set HttpOnly cookie
router.post('/admin/login', loginLimiter, async (req, res) => {
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

    const jti   = uuidv4()
    const token = jwt.sign({ admin: true, jti }, JWT_SECRET, { expiresIn: '15d' })

    // CSRF risk acceptance: sameSite:'strict' prevents cross-origin cookie submission
    // in all modern browsers. An explicit CSRF token would be defence-in-depth but
    // is not implemented here given the single-admin, internal-tool threat model.
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in ms
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// Middleware — verify cookie token + blacklist check
async function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // [FIX] Reject pre-migration tokens that have no jti — they cannot be revoked
  if (!payload.jti) {
    return res.status(401).json({ error: 'Session expired. Please login again.' })
  }

  try {
    // Token blacklist check
    const revoked = await pool.query(
      'SELECT 1 FROM revoked_tokens WHERE jti = $1',
      [payload.jti]
    )
    if (revoked.rows.length > 0) {
      return res.status(401).json({ error: 'Token revoked. Please login again.' })
    }
  } catch (err) {
    // [FIX] DB errors surfaced as 500, not silently swallowed as 401
    console.error('requireAdmin DB error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }

  // [FIX] Store full admin context under req.admin (not loose req.jti)
  req.admin = payload
  next()
}

// GET /api/admin/verify — lightweight session check (no data payload)
router.get('/admin/verify', requireAdmin, (req, res) => {
  res.json({ ok: true })
})

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

// POST /api/admin/logout — revoke token in DB + clear cookie
router.post('/admin/logout', requireAdmin, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO revoked_tokens (jti) VALUES ($1) ON CONFLICT DO NOTHING',
      [req.admin.jti]
    )
  } catch (err) {
    console.error('Logout revoke error:', err.message)
    // [FIX] Tell client revocation failed so they can retry
    return res.status(500).json({ error: 'Logout failed. Please try again.' })
  }

  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
  })

  res.json({ message: 'Logged out' })
})

module.exports = router
