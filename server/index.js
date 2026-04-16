require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors    = require('cors')
const routes  = require('./routes/survey')

const app  = express()
const PORT = process.env.PORT || 4000

// CORS — allow frontend dev server + production domain
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://survey.tiqworld.com',
]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

app.use(express.json())

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// All API routes
app.use('/api', routes)

// 404 handler
app.use((_, res) => res.status(404).json({ error: 'Not found' }))

// Error handler
app.use((err, _, res, __) => {
  console.error(err.message)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n  Server running on http://localhost:${PORT}`)
  console.log(`  Health: http://localhost:${PORT}/health\n`)
})
