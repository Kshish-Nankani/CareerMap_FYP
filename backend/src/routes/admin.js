import { Router } from 'express'
import User from '../models/User.js'
import CareerRecommendation from '../models/CareerRecommendation.js'
import University from '../models/University.js'
import TutorApplication from '../models/TutorApplication.js'
import LearningAgreement from '../models/LearningAgreement.js'
import Conversation from '../models/Conversation.js'
import Product from '../models/Product.js'
import adminAuth from '../middleware/adminAuth.js'

const router = Router()

const trimValue = (value) => (typeof value === 'string' ? value.trim() : '')

const normalizeTutorOffering = (offering = {}) => ({
  course: trimValue(offering.course),
  subject: trimValue(offering.subject),
  expertise: trimValue(offering.expertise)
})

const isValidOffering = (offering) =>
  Boolean(offering.course || offering.subject || offering.expertise)

const mergeTutorOfferings = (existingOfferings = [], additionalOfferings = []) => {
  const merged = []
  const seen = new Set()

  const addOffering = (offering) => {
    const normalized = normalizeTutorOffering(offering)
    if (!isValidOffering(normalized)) return

    const key = `${normalized.course.toLowerCase()}|${normalized.subject.toLowerCase()}|${normalized.expertise.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    merged.push(normalized)
  }

  existingOfferings.forEach(addOffering)
  additionalOfferings.forEach(addOffering)
  return merged
}

// Get all tutor applications (Admin only)
router.get('/tutor-applications', adminAuth, async (req, res) => {
  try {
    const applications = await TutorApplication.find({
      status: { $nin: ['payment_pending', 'payment_failed', 'payment_cancelled'] }
    })
      .populate('userId', 'fullName email profileImage')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })

    const orphanApplicationIds = applications
      .filter((application) => !application.userId)
      .map((application) => application._id)

    if (orphanApplicationIds.length > 0) {
      await TutorApplication.deleteMany({ _id: { $in: orphanApplicationIds } })
    }

    const validApplications = applications.filter((application) => application.userId)

    return res.json({
      success: true,
      applications: validApplications
    })
  } catch (err) {
    console.error('Get tutor applications error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Update tutor application status (Admin only)
router.put('/tutor-applications/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, reviewNotes } = req.body || {}

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be either Approved or Rejected'
      })
    }

    const application = await TutorApplication.findById(id)
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      })
    }

    application.status = status
    application.reviewedBy = req.user.id
    application.reviewedAt = new Date()
    application.reviewNotes = trimValue(reviewNotes)
    await application.save()

    if (status === 'Approved') {
      const user = await User.findById(application.userId)
      if (user) {
        const appOfferings = (application.subjects || []).map((subject) => ({
          course: '',
          subject: trimValue(subject),
          expertise: trimValue(application.specialization)
        }))

        user.isTutor = true
        user.tutorOfferings = mergeTutorOfferings(user.tutorOfferings || [], appOfferings)
        await user.save()
      }
    }

    return res.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      application
    })
  } catch (err) {
    console.error('Update tutor application status error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get all learning agreements (Admin only)
router.get('/learning-agreements', adminAuth, async (req, res) => {
  try {
    const agreements = await LearningAgreement.find()
      .populate('createdBy', 'fullName email')
      .populate('conversationId', '_id')
      .sort({ createdAt: -1 })

    const orphanAgreementIds = agreements
      .filter((agreement) => !agreement.createdBy)
      .map((agreement) => agreement._id)

    if (orphanAgreementIds.length > 0) {
      await LearningAgreement.deleteMany({ _id: { $in: orphanAgreementIds } })
    }

    const validAgreements = agreements.filter((agreement) => agreement.createdBy)

    return res.json({
      success: true,
      agreements: validAgreements
    })
  } catch (err) {
    console.error('Get learning agreements error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.post('/users', adminAuth, async (req, res) => {
  try {
    const { name, fullName, email, password, emailVerified, isAdmin } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    const user = new User({
      fullName: fullName || name || '',
      email,
      password,
      emailVerified: emailVerified || false,
      isAdmin: isAdmin || false
    })

    await user.save()

    const newUser = await User.findById(user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil')

    return res.status(201).json(newUser)
  } catch (err) {
    console.error('Create user error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

//aDMIN WILL Get all users 
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query
    
    const query = search 
      ? { 
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {}

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))

    const total = await User.countDocuments(query)

    return res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    console.error('Get users error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get user by ID (Admin only)aq
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil')
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(user)
  } catch (err) {
    console.error('Get user error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get dashboard statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const verifiedUsers = await User.countDocuments({ emailVerified: true })
    const adminUsers = await User.countDocuments({ isAdmin: true })
    const totalCareerRecommendations = await CareerRecommendation.countDocuments()

    // Get users registered in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    })

    // Get profile completion statistics
    const usersWithCompleteProfile = await User.countDocuments({
      'careerPathStages.profileSetup': true
    })

    const usersWithAssessment = await User.countDocuments({
      'careerPathStages.careerAssessment': true
    })

    const totalUniversities = await University.countDocuments({ isActive: true })

    return res.json({
      totalUsers,
      verifiedUsers,
      adminUsers,
      newUsers,
      totalCareerRecommendations,
      usersWithCompleteProfile,
      usersWithAssessment,
      profileCompletionRate: totalUsers > 0 
        ? ((usersWithCompleteProfile / totalUsers) * 100).toFixed(2) 
        : 0,
      totalUniversities,
      totalTutors: 0 // TODO: Add Tutor model and count
    })
  } catch (err) {
    console.error('Get stats error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Delete user (Admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent deleting admin users
    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot delete admin users' })
    }

    // Remove all tutor applications created by this user so they no longer appear
    // in tutor lists and admin tutor-application views.
    const deletedTutorApplications = await TutorApplication.deleteMany({
      $or: [
        { userId: user._id },
        { userId: String(user._id) },
        { email: user.email }
      ]
    })

    const relatedConversations = await Conversation.find({
      participants: user._id
    }).select('_id')

    const relatedConversationIds = relatedConversations.map((conversation) => conversation._id)

    const deletedLearningAgreements = await LearningAgreement.deleteMany({
      $or: [
        { createdBy: user._id },
        { conversationId: { $in: relatedConversationIds } }
      ]
    })

    // Delete all products uploaded by this user to the marketplace
    const deletedProducts = await Product.deleteMany({
      seller: user._id
    })

    await User.findByIdAndDelete(req.params.id)
    
    return res.json({
      message: 'User deleted successfully',
      deletedTutorApplications: deletedTutorApplications.deletedCount || 0,
      deletedLearningAgreements: deletedLearningAgreements.deletedCount || 0,
      deletedProducts: deletedProducts.deletedCount || 0
    })
  } catch (err) {
    console.error('Delete user error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Update user (Admin only)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, fullName, emailVerified, isAdmin, password } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (fullName !== undefined || name !== undefined) {
      user.fullName = fullName || name
    }

    if (emailVerified !== undefined) {
      user.emailVerified = emailVerified
    }

    if (isAdmin !== undefined) {
      user.isAdmin = isAdmin
    }

    if (password !== undefined && password.trim() !== '') {
      user.password = password
    }

    await user.save()

    const updatedUser = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil')

    return res.json(updatedUser)
  } catch (err) {
    console.error('Update user error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get recent activity (Admin only)
router.get('/activity', adminAuth, async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('fullName email createdAt emailVerified')
      .sort({ createdAt: -1 })
      .limit(10)

    return res.json({ recentUsers })
  } catch (err) {
    console.error('Get activity error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Career Recommendations CRUD (Admin only)

// Create career recommendation
router.post('/careers', adminAuth, async (req, res) => {
  try {
    const { title, icon, salary, demand, description, skills, companies, growth } = req.body

    console.log('Received career data:', req.body)

    if (!title || !salary || !demand || !description) {
      return res.status(400).json({ error: 'Title, salary, demand, and description are required' })
    }

    const career = new CareerRecommendation({
      title,
      icon: icon || 'fa-solid fa-briefcase',
      salary,
      demand,
      description,
      growth: growth || '',
      skills: skills || [],
      companies: companies || []
    })

    await career.save()
    console.log('Career saved successfully:', career)
    return res.status(201).json(career)
  } catch (err) {
    console.error('Create career error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
})

// Update career recommendation
router.put('/careers/:id', adminAuth, async (req, res) => {
  try {
    const { title, icon, salary, demand, description, skills, companies, growth } = req.body
    
    const career = await CareerRecommendation.findById(req.params.id)
    if (!career) {
      return res.status(404).json({ error: 'Career not found' })
    }

    if (title !== undefined) career.title = title
    if (icon !== undefined) career.icon = icon
    if (salary !== undefined) career.salary = salary
    if (demand !== undefined) career.demand = demand
    if (description !== undefined) career.description = description
    if (growth !== undefined) career.growth = growth
    if (skills !== undefined) career.skills = skills
    if (companies !== undefined) career.companies = companies

    await career.save()
    return res.json(career)
  } catch (err) {
    console.error('Update career error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Delete career recommendation
router.delete('/careers/:id', adminAuth, async (req, res) => {
  try {
    const career = await CareerRecommendation.findById(req.params.id)
    
    if (!career) {
      return res.status(404).json({ error: 'Career not found' })
    }

    await CareerRecommendation.findByIdAndDelete(req.params.id)
    return res.json({ message: 'Career deleted successfully' })
  } catch (err) {
    console.error('Delete career error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get all sellers (Admin only)
router.get('/sellers', adminAuth, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query
    
    let query = {}
    if (search.trim()) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }
    }

    const skip = (Number(page) - 1) * Number(limit)
    
    const sellers = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      sellers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    console.error('Get sellers error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sellers',
      message: err.message
    })
  }
})

// Get single seller (Admin only)
router.get('/sellers/:id', adminAuth, async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil')

    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      })
    }

    res.json({
      success: true,
      seller
    })
  } catch (err) {
    console.error('Get seller error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seller',
      message: err.message
    })
  }
})

// Update seller profile (Admin only)
router.put('/sellers/:id', adminAuth, async (req, res) => {
  try {
    const { fullName, email, phone, city, gender, careerInterest, schoolUniversity, department } = req.body

    const seller = await User.findById(req.params.id)
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      })
    }

    // Update allowed fields
    if (fullName) seller.fullName = fullName.trim()
    if (email) seller.email = email.trim().toLowerCase()
    if (phone) seller.phone = phone.trim()
    if (city) seller.city = city.trim()
    if (gender) seller.gender = gender.trim()
    if (careerInterest) seller.careerInterest = careerInterest.trim()
    if (schoolUniversity) seller.schoolUniversity = schoolUniversity.trim()
    if (department) seller.department = department.trim()

    await seller.save()

    res.json({
      success: true,
      message: 'Seller updated successfully',
      seller: seller.toObject({ getters: true, virtuals: false, transform: () => {
        const obj = seller.toObject()
        delete obj.password
        delete obj.resetPasswordToken
        delete obj.resetPasswordExpires
        delete obj.otpCode
        delete obj.otpExpires
        delete obj.otpAttempts
        delete obj.otpLockedUntil
        return obj
      }})
    })
  } catch (err) {
    console.error('Update seller error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to update seller',
      message: err.message
    })
  }
})

// Delete seller (Admin only)
router.delete('/sellers/:id', adminAuth, async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      })
    }

    // Delete user and all related data
    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Seller deleted successfully'
    })
  } catch (err) {
    console.error('Delete seller error:', err)
    res.status(500).json({
      success: false,
      error: 'Failed to delete seller',
      message: err.message
    })
  }
})

export default router
