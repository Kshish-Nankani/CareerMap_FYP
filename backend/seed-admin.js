import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'

dotenv.config()

const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = 'admin1234'
const ADMIN_NAME = 'Admin'

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      console.error('Missing MONGODB_URI environment variable')
      process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL })
    
    if (existingAdmin) {
      console.log('Admin user already exists with email:', ADMIN_EMAIL)
      
      // Update to ensure isAdmin flag is set
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true
        existingAdmin.emailVerified = true
        await existingAdmin.save()
        console.log('Updated existing user to admin')
      }
    } else {
      // Create new admin user
      const admin = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        emailVerified: true,
        isAdmin: true
      })

      await admin.save()
      console.log('Admin user created successfully!')
      console.log('Email:', ADMIN_EMAIL)
      console.log('Password:', ADMIN_PASSWORD)
    }

    await mongoose.connection.close()
    console.log('MongoDB connection closed')
    process.exit(0)
  } catch (err) {
    console.error('Error seeding admin:', err)
    process.exit(1)
  }
}

seedAdmin()
