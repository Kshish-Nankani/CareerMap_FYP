import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export default async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if user exists
    const user = await User.findById(decoded.sub)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' })
    }

    req.user = { id: decoded.sub, isAdmin: decoded.isAdmin || user.isAdmin }
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
}
