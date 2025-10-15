import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import authenticate from './middleware/auth.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend', env: process.env.NODE_ENV || 'development' })
})

app.use('/api/auth', authRoutes)

// Example protected route
app.get('/api/private', authenticate, (req, res) => {
  res.json({ ok: true, userId: req.user.id })
})

const PORT = process.env.PORT || 5000

async function start() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    console.error('Missing MONGODB_URI environment variable')
    process.exit(1)
  }
  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET environment variable')
    process.exit(1)
  }
  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to connect to MongoDB', err)
    process.exit(1)
  }
}

start()
