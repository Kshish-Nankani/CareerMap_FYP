import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('_id isAdmin isTutor email')
    if (!user) return res.status(401).json({ error: 'User not found' })
    
    req.user = { 
      id: user._id, 
      isAdmin: user.isAdmin,
      isTutor: user.isTutor,
      email: user.email
    }
    next()
  } catch (e) {
    console.error('Auth error:', e.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}





