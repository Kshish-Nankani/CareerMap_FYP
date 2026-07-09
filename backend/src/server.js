import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import assessmentRoutes from './routes/assessment.js'
import careersRoutes from './routes/careers.js'
import adminRoutes from './routes/admin.js'
import universitiesRoutes from './routes/universities.js'
import tutorsRoutes from './routes/tutors.js'
import sellersRoutes from './routes/sellers.js'
import chatRoutes from './routes/chat.js'
import marketplaceRoutes from './routes/marketplace.js'
import ordersRoutes from './routes/orders.js'
import authenticate from './middleware/auth.js'
import { registerChatSocket } from './socket/chatSocket.js'  // chat socket handlers ko import kar rahe he taki socket.io ke events handle kar sake, jaise ki new message, typing indicator, etc.

dotenv.config()

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve static files from public/images folder
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend', env: process.env.NODE_ENV || 'development' })
})

app.use('/api/auth', authRoutes)
app.use('/api/assessment', assessmentRoutes)
app.use('/api/careers', careersRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/universities', universitiesRoutes)
app.use('/api/tutors', tutorsRoutes)
app.use('/api/sellers', sellersRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/chat', authenticate, chatRoutes)


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
// 1st we create this for socket.io
// 🔹 HTTP server create
    const httpServer = createServer(app)
    // 🔹 Socket.IO attach
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: true,
        methods: ['GET', 'POST']
      },
      maxHttpBufferSize: 15 * 1024 * 1024  // 15MB max message size for socket.io to allow large messages like images or files in chat
    })
    // 🔹 Store io in app (important)
    app.set('io', io)
    registerChatSocket(io)
// 2nd we start the server after mongoDB connection is successful, and socket.io is set up, so that we can use io in our routes and socket handlers without issues
    const server = httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please either:`)
        console.error(`1. Stop the process using port ${PORT}`)
        console.error(`2. Set a different PORT in your .env file`)
        console.error(`\nTo find and kill the process on Windows:`)
        console.error(`  netstat -ano | findstr :${PORT}`)
        console.error(`  taskkill /PID <PID> /F`)
      } else {
        console.error('Server error:', err)
      }
      process.exit(1)
    })
  } catch (err) {
    console.error('Failed to connect to MongoDB', err)
    process.exit(1)
  }
}

start()
