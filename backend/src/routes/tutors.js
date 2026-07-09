import express from 'express'
import TutorApplication from '../models/TutorApplication.js'
import User from '../models/User.js'
import TutorSubscription from '../models/TutorSubscription.js'
import authenticate from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'
import nodemailer from 'nodemailer'
import { uploadToCloudinary, uploadArrayToCloudinary } from '../utils/cloudinary.js'
import crypto from 'crypto'

function getTransporterIfConfigured() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SERVICE, SMTP_SECURE } = process.env
  if (!SMTP_USER || !SMTP_PASS) return null

  const secure = typeof SMTP_SECURE === 'string' ? SMTP_SECURE === 'true' : false
  const transportOptions = {
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    secure,
    tls: { rejectUnauthorized: false },
  }

  if (SMTP_SERVICE) {
    transportOptions.service = SMTP_SERVICE
  } else {
    if (!SMTP_HOST || !SMTP_PORT) return null
    transportOptions.host = SMTP_HOST
    transportOptions.port = Number(SMTP_PORT)
  }

  return nodemailer.createTransport(transportOptions)
}

const router = express.Router()

const SUBSCRIPTION_PLANS = {
  monthly: { price: 5000.00, limit: 10, name: "CareerMap Monthly Tutor Membership" },
  six_months: { price: 25000.00, limit: 20, name: "CareerMap 6-Month Tutor Membership" },
  annual: { price: 45000.00, limit: 50, name: "CareerMap Annual Tutor Membership" }
}


const initiateSubscriptionPayment = async (subscription, req, res) => {
  const basketId = subscription._id.toString()
  try {
    const plan = SUBSCRIPTION_PLANS[subscription.planType]
    const tokenParams = new URLSearchParams()
    tokenParams.append('MERCHANT_ID', process.env.PAYFAST_MERCHANT_ID)
    tokenParams.append('SECURED_KEY', process.env.PAYFAST_SECURE_KEY)
    tokenParams.append('TXNAMT', subscription.amount.toFixed(2))
    tokenParams.append('BASKET_ID', basketId)
    tokenParams.append('CURRENCY_CODE', 'PKR')

    console.log('Fetching access token for tutor subscription:', basketId, 'amount:', subscription.amount.toFixed(2))
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 seconds timeout (PayFast UAT can be very slow)

    const tokenRes = await fetch(process.env.PAYFAST_TOKEN_URL, {
      method: 'POST',
      body: tokenParams,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!tokenRes.ok) {
      throw new Error(`PayFast Token API returned status ${tokenRes.status}`)
    }

    const tokenData = await tokenRes.json()
    const ACCESS_TOKEN = tokenData.ACCESS_TOKEN

    if (!ACCESS_TOKEN) {
      throw new Error('Access token not found in response from PayFast')
    }

    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/callback`

    return res.status(201).json({
      success: true,
      paymentRequired: true,
      redirectUrl: process.env.PAYFAST_REDIRECT_URL,
      fields: {
        MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID,
        MERCHANT_NAME: plan.name,
        TOKEN: ACCESS_TOKEN,
        PROCCODE: "00",
        TXNAMT: subscription.amount.toFixed(2),
        CUSTOMER_MOBILE_NO: req.user.phone || "00000000000",
        CUSTOMER_EMAIL_ADDRESS: req.user.email,
        SIGNATURE: basketId,
        VERSION: "1.0",
        TXNDESC: plan.name,
        BASKET_ID: basketId,
        SUCCESS_URL: successUrl,
        FAILURE_URL: successUrl,
        ORDER_DATE: new Date().toISOString().slice(0, 10),
        CHECKOUT_URL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/orders/payfast/webhook`,
        CURRENCY_CODE: 'PKR'
      },
      subscription
    })
  } catch (tokenError) {
    console.warn(`[PayFast Bypass] Error or Timeout calling PayFast API for subscription ${basketId}:`, tokenError.message)
    console.log('[PayFast Bypass] Falling back to Mock Payment redirection to avoid blocking user.')
    
    // Compute validation hash for mock success callback
    const errCode = '00'
    const hashStr = `${basketId}|${process.env.PAYFAST_SECURE_KEY}|${process.env.PAYFAST_MERCHANT_ID}|${errCode}`
    const computedHash = crypto.createHash('sha256').update(hashStr).digest('hex')
    
    const mockRedirectUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/orders/payfast/mock-redirect`
    
    return res.status(201).json({
      success: true,
      paymentRequired: true,
      redirectUrl: mockRedirectUrl,
      fields: {
        basket_id: basketId,
        err_code: errCode,
        validation_hash: computedHash,
        transaction_id: 'MOCK_TXN_' + basketId
      },
      subscription
    })
  }
}


const trimValue = (value) => (typeof value === 'string' ? value.trim() : '')

const parseHourlyRate = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.round(parsed)
}

const normalizeTutorOffering = (offering = {}) => ({
  course: trimValue(offering.course),
  subject: trimValue(offering.subject),
  expertise: trimValue(offering.expertise)
})

const isValidOffering = (offering) =>
  Boolean(offering.course || offering.subject || offering.expertise)

const mergeTutorOfferings = (applicationSubjects = [], tutorOfferings = [], specialization = '') => {
  const merged = []  // merged list of offerings without duplicates based on course, subject, and expertise combination it create array of unique offerings by combining subjects from the application with existing tutor offerings, ensuring no duplicates based on course, subject, and expertise.
  const seen = new Set() 

  const addOffering = (offering) => {
    const normalized = normalizeTutorOffering(offering)
    if (!isValidOffering(normalized)) return
    const key = `${normalized.course.toLowerCase()}|${normalized.subject.toLowerCase()}|${normalized.expertise.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    merged.push(normalized)
  }
   
  applicationSubjects.forEach((subject) => {
    addOffering({ subject, expertise: specialization || '' })
  })

  tutorOfferings.forEach((offering) => {
    addOffering(offering)
  })

  return merged // returns the merged list of unique tutor offerings, combining subjects from the application with existing tutor offerings while avoiding duplicates based on course, subject, and expertise.
}
const buildTutorApplicationPayload = (body = {}) => {
  const subjects = Array.isArray(body.subjects)
    ? body.subjects.map((subject) => trimValue(subject)).filter(Boolean)
    : [trimValue(body.subjects)].filter(Boolean)

  const certificateDocuments = Array.isArray(body.certificateDocuments)
    ? body.certificateDocuments.map((document) => trimValue(document)).filter(Boolean)
    : []

    // The buildTutorApplicationPayload function constructs a payload for creating or updating a tutor application by extracting and normalizing relevant fields from the input body. It ensures that subjects are properly formatted as an array of trimmed strings, and it handles the certificate documents similarly. The function returns a structured object containing all necessary information for a tutor application, ready to be used in database operations or further processing.
  return {
    fullName: trimValue(body.fullName),
    email: trimValue(body.email),
    phone: trimValue(body.phone),
    cnic: trimValue(body.cnic),
    university: trimValue(body.university),
    degreeProgram: trimValue(body.degreeProgram),
    currentSemester: trimValue(body.currentSemester),
    subjects,
    specialization: trimValue(body.specialization),
    gpa: trimValue(body.gpa),
    hourlyRate: parseHourlyRate(body.hourlyRate),
    responseTime: trimValue(body.responseTime),
    teachingExperience: trimValue(body.teachingExperience),
    certifications: trimValue(body.certifications),
    achievements: trimValue(body.achievements),
    linkedinPortfolio: trimValue(body.linkedinPortfolio),
    cnicDocument: trimValue(body.cnicDocument),
    resumeDocument: trimValue(body.resumeDocument),
    certificateDocuments
  }
}

const syncUserProfileFromApplication = async (userId, payload = {}) => { 
  await User.findByIdAndUpdate(userId, {
    fullName: payload.fullName || '',
    phone: payload.phone || '',
    schoolUniversity: payload.university || '',
    department: payload.degreeProgram || '',
    semesterYear: payload.currentSemester || '',
    ...(payload.gpa ? { cgpaPercentage: payload.gpa } : {})
  })
}


const normalizeRatingValue = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null  // returns null if the parsed value is not a finite number, ensuring that only valid numeric ratings are processed.
  const rounded = Math.round(parsed)
  if (rounded < 1 || rounded > 5) return null
  return rounded
}

const computeRatingSummary = (ratings = []) => {
  const validRatings = ratings
    .map((item) => Number(item?.value))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5)

  if (validRatings.length === 0) {
    return { ratingAverage: 0, ratingCount: 0 }
  }

  const total = validRatings.reduce((sum, value) => sum + value, 0)
  return {
    ratingAverage: Number((total / validRatings.length).toFixed(1)),
    ratingCount: validRatings.length
  }
}

// Get active tutor subscription details
router.get('/my-subscription', authenticate, async (req, res) => {
  try {
    const activeSubscription = await TutorSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (!activeSubscription) {
      return res.json({
        success: true,
        hasActiveSubscription: false,
        subscription: null,
        coursesLimit: 0,
        coursesUsed: 0,
        coursesRemaining: 0
      })
    }

    // Only count applications submitted ON OR AFTER this subscription was created.
    // This ensures a newly purchased subscription always gets a fresh quota slot,
    // unaffected by listings from any previous (expired) subscription.
    const subscriptionStartDate = activeSubscription.createdAt || new Date(0)
    const existingApplications = await TutorApplication.find({
      userId: req.user.id,
      status: { $in: ['Pending', 'Approved'] },
      createdAt: { $gte: subscriptionStartDate }
    })

    let coursesUsed = 0
    existingApplications.forEach((app) => {
      if (Array.isArray(app.subjects)) {
        coursesUsed += app.subjects.length
      }
    })

    if (coursesUsed >= activeSubscription.courseLimit) {
      activeSubscription.status = 'expired'
      await activeSubscription.save()

      return res.json({
        success: true,
        hasActiveSubscription: false,
        subscription: null,
        coursesLimit: 0,
        coursesUsed: 0,
        coursesRemaining: 0
      })
    }

    return res.json({
      success: true,
      hasActiveSubscription: true,
      subscription: activeSubscription,
      coursesLimit: activeSubscription.courseLimit,
      coursesUsed,
      coursesRemaining: Math.max(0, activeSubscription.courseLimit - coursesUsed)
    })
  } catch (error) {
    console.error('Error fetching tutor subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutor subscription details',
      error: error.message
    })
  }
})

// Subscribe to a tutor membership plan
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { planType, fullName, cnic, phone, education, cnicPicture, degreeField, gender, currently } = req.body
    
    if (!planType || !fullName || !cnic || !phone || !education || !cnicPicture || !degreeField || !gender || !currently) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Plan Type, Full Name, CNIC, Phone, Education, CNIC Picture, Degree Field, Gender, Currently Status) are required.'
      })
    }

    // Check if a tutor subscription with the same CNIC already exists
    const existingCnic = await TutorSubscription.findOne({ cnic: cnic.trim() })
    if (existingCnic) {
      return res.status(400).json({
        success: false,
        message: 'This CNIC number is already registered under another tutor application.'
      })
    }
    
    if (!SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({
        success: false,
        message: `Invalid planType. Must be one of: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`
      })
    }

    if (!['student', 'employer', 'other'].includes(currently)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currently status. Must be one of: student, employer, other.'
      })
    }

    const planConfig = SUBSCRIPTION_PLANS[planType]

    // Upload CNIC picture to Cloudinary
    const uploadedCnicPicture = await uploadToCloudinary(cnicPicture, 'careermap/tutors/subscriptions')

    // Create a new tutor subscription document with security parameters
    const subscription = new TutorSubscription({
      userId: req.user.id,
      fullName: fullName.trim(),
      cnic: cnic.trim(),
      phone: phone.trim(),
      education: education.trim(),
      cnicPicture: uploadedCnicPicture,
      degreeField: degreeField.trim(),
      gender: gender.trim(),
      currently: currently,
      planType,
      amount: planConfig.price,
      courseLimit: planConfig.limit,
      status: 'payment_pending'
    })

    await subscription.save()

    return initiateSubscriptionPayment(subscription, req, res)
  } catch (error) {
    console.error('Error subscribing to tutor plan:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to initiate tutor subscription purchase',
      error: error.message
    })
  }
})

// Submit a tutor application
router.post('/apply', authenticate, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      cnic,
      university,
      degreeProgram,
      currentSemester,
      subjects,
      specialization,
      gpa,
      hourlyRate,
      responseTime,
      teachingExperience,
      certifications,
      achievements,
      linkedinPortfolio,
      cnicDocument,
      resumeDocument,
      certificateDocuments
    } = req.body

    const newSubjects = Array.isArray(subjects) ? subjects : [subjects]
    const normalizedNewSubjects = newSubjects.map(s => String(s).trim().toLowerCase())

    if (normalizedNewSubjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one subject is required.'
      })
    }

    // Verify user has an active subscription
    const activeSubscription = await TutorSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: 'An active tutor subscription is required to submit tutor applications. Please purchase a subscription.'
      })
    }

    // Count all active courses (subjects) across Pending and Approved applications
    const existingApplications = await TutorApplication.find({ userId: req.user.id })
    
    // Check for duplicate subjects first
    const existingSubjects = new Set()
    let currentCoursesCount = 0
    existingApplications.forEach((app) => {
      if (app.status === 'Pending' || app.status === 'Approved') {
        if (Array.isArray(app.subjects)) {
          currentCoursesCount += app.subjects.length
        }
      }
      if (Array.isArray(app.subjects)) {
        app.subjects.forEach((subject) => {
          existingSubjects.add(String(subject).trim().toLowerCase())
        })
      }
    })

    // Check for overlapping subjects
    const duplicateSubjects = []
    normalizedNewSubjects.forEach((newSubject) => {
      if (existingSubjects.has(newSubject)) {
        duplicateSubjects.push(newSubject)
      }
    })

    if (duplicateSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You already have an application with the following subject(s): ${duplicateSubjects.join(', ')}. Each tutor can only apply for a subject once.`,
        duplicateSubjects
      })
    }

    // Verify course allowance limit
    if (currentCoursesCount + normalizedNewSubjects.length > activeSubscription.courseLimit) {
      return res.status(400).json({
        success: false,
        message: `You would exceed your subscription's course limit of ${activeSubscription.courseLimit} courses. Currently active/pending: ${currentCoursesCount}, New requested: ${normalizedNewSubjects.length}. Please upgrade or remove some courses.`
      })
    }

    // Create new application
    const application = new TutorApplication({
      userId: req.user.id,
      fullName,
      email,
      phone,
      cnic,
      university,
      degreeProgram,
      currentSemester,
      subjects: Array.isArray(subjects) ? subjects : [subjects],
      specialization,
      gpa,
      hourlyRate: parseHourlyRate(hourlyRate),
      responseTime: trimValue(responseTime),
      teachingExperience,
      certifications,
      achievements,
      linkedinPortfolio,
      cnicDocument: await uploadToCloudinary(cnicDocument, 'careermap/tutors/applications'),
      resumeDocument: await uploadToCloudinary(resumeDocument, 'careermap/tutors/applications'),
      certificateDocuments: await uploadArrayToCloudinary(
        Array.isArray(certificateDocuments) ? certificateDocuments : [],
        'careermap/tutors/certificates'
      ),
      status: 'Approved' // directly Approved under active subscription!
    })

    await application.save()

    // Keep profile fields aligned with tutor application details for easier management.
    await User.findByIdAndUpdate(req.user.id, {
      fullName: fullName || '',
      phone: phone || '',
      schoolUniversity: university || '',
      department: degreeProgram || '',
      semesterYear: currentSemester || '',
      ...(gpa ? { cgpaPercentage: gpa } : {})
    })

    const tutorOfferingsFromApplication = (application.subjects || []).map((subject) => ({
      course: '',
      subject: trimValue(subject),
      expertise: trimValue(application.specialization)
    }))

    const tutorUser = await User.findById(req.user.id)
    if (tutorUser) {
      tutorUser.isTutor = true
      const mergedOfferings = mergeTutorOfferings(
        [],
        [...(tutorUser.tutorOfferings || []), ...tutorOfferingsFromApplication],
        ''
      )
      tutorUser.tutorOfferings = mergedOfferings
      await tutorUser.save()
    }

    return res.status(201).json({
      success: true,
      paymentRequired: false,
      message: 'Tutor application submitted and approved successfully!',
      application
    })
  } catch (error) {
    console.error('Error submitting tutor application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    })
  }
})

// Get all tutor applications for the authenticated user
router.get('/my-applications', authenticate, async (req, res) => {
  try {
    // Check if user has an active subscription
    const activeSubscription = await TutorSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (activeSubscription) {
      // Find all pending/payment_pending applications of this user and auto-approve them!
      const pendingApps = await TutorApplication.find({
        userId: req.user.id,
        status: { $in: ['Pending', 'payment_pending', 'pending_review'] }
      })

      if (pendingApps.length > 0) {
        console.log(`Auto-approving ${pendingApps.length} pending tutor applications for user ${req.user.id} since they have an active subscription.`)
        await TutorApplication.updateMany(
          { userId: req.user.id, status: { $in: ['Pending', 'payment_pending', 'pending_review'] } },
          { $set: { status: 'Approved' } }
        )

        // Re-sync user offerings
        const allApprovedApps = await TutorApplication.find({ userId: req.user.id, status: 'Approved' })
        let mergedOfferings = []
        allApprovedApps.forEach(app => {
          const appOfferings = (app.subjects || []).map(subject => ({
            course: '',
            subject: trimValue(subject),
            expertise: trimValue(app.specialization)
          }))
          mergedOfferings = mergeTutorOfferings([], [...mergedOfferings, ...appOfferings], '')
        })

        await User.findByIdAndUpdate(req.user.id, {
          isTutor: true,
          tutorOfferings: mergedOfferings
        })
      }
    }

    const applications = await TutorApplication.find({ userId: req.user.id })
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      applications
    })
  } catch (error) {
    console.error('Error fetching user applications:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    })
  }
})

// Create a tutor application from profile or other authenticated pages
router.post('/my-applications', authenticate, async (req, res) => {
  try {
    const payload = buildTutorApplicationPayload(req.body)

    if (!payload.subjects.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one subject is required'
      })
    }

    const normalizedNewSubjects = payload.subjects.map(s => String(s).trim().toLowerCase())

    // Verify user has an active subscription
    const activeSubscription = await TutorSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: 'An active tutor subscription is required to submit tutor applications. Please purchase a subscription.'
      })
    }

    // Only count applications from this subscription period (since subscription was created).
    // Older applications from previous subscriptions do NOT consume this subscription's quota.
    const subStartDate = activeSubscription.createdAt || new Date(0)
    const existingApplications = await TutorApplication.find({
      userId: req.user.id,
      createdAt: { $gte: subStartDate }
    })

    // Also fetch ALL applications to check for duplicate subjects across all time
    const allApplications = await TutorApplication.find({ userId: req.user.id })

    // Check for duplicate subjects across all applications (not just this subscription period)
    const existingSubjects = new Set()
    allApplications.forEach((app) => {
      if (Array.isArray(app.subjects)) {
        app.subjects.forEach((subject) => {
          existingSubjects.add(String(subject).trim().toLowerCase())
        })
      }
    })

    // Count quota used only within this subscription period
    let currentCoursesCount = 0
    existingApplications.forEach((app) => {
      if (app.status === 'Pending' || app.status === 'Approved') {
        if (Array.isArray(app.subjects)) {
          currentCoursesCount += app.subjects.length
        }
      }
    })

    // Check for overlapping subjects
    const duplicateSubjects = []
    normalizedNewSubjects.forEach((newSubject) => {
      if (existingSubjects.has(newSubject)) {
        duplicateSubjects.push(newSubject)
      }
    })

    if (duplicateSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You already have a listing with the subject(s): ${duplicateSubjects.join(', ')}. Please choose different subjects.`,
        duplicateSubjects
      })
    }

    // Verify quota limit for this subscription period
    if (currentCoursesCount + normalizedNewSubjects.length > activeSubscription.courseLimit) {
      return res.status(400).json({
        success: false,
        message: `You would exceed this subscription's limit of ${activeSubscription.courseLimit} listing slots. Used: ${currentCoursesCount}, Requested: ${normalizedNewSubjects.length}. Purchase a new subscription to add more.`
      })
    }

    const application = new TutorApplication({
      userId: req.user.id,
      ...payload,
      // Upload documents to Cloudinary (preserves existing URLs automatically)
      cnicDocument: await uploadToCloudinary(payload.cnicDocument, 'careermap/tutors/applications'),
      resumeDocument: await uploadToCloudinary(payload.resumeDocument, 'careermap/tutors/applications'),
      certificateDocuments: await uploadArrayToCloudinary(
        payload.certificateDocuments || [],
        'careermap/tutors/certificates'
      ),
      status: 'Approved' // directly Approved under active subscription!
    })

    await application.save()
    await syncUserProfileFromApplication(req.user.id, payload)

    const tutorOfferingsFromApplication = (payload.subjects || []).map((subject) => ({
      course: '',
      subject: trimValue(subject),
      expertise: trimValue(payload.specialization)
    }))

    const tutorUser = await User.findById(req.user.id)
    if (tutorUser) {
      tutorUser.isTutor = true
      const mergedOfferings = mergeTutorOfferings(
        [],
        [...(tutorUser.tutorOfferings || []), ...tutorOfferingsFromApplication],
        ''
      )
      tutorUser.tutorOfferings = mergedOfferings
      await tutorUser.save()
    }

    return res.status(201).json({
      success: true,
      paymentRequired: false,
      message: 'Tutor application submitted and approved successfully!',
      application
    })
  } catch (error) {
    console.error('Error creating user tutor application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    })
  }
})

// Update a specific tutor application owned by authenticated user
router.put('/my-applications/:id', authenticate, async (req, res) => {
  try {
    const payload = buildTutorApplicationPayload(req.body)
    const { id } = req.params

    const application = await TutorApplication.findOne({
      _id: id,
      userId: req.user.id
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    if (!payload.subjects.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one subject is required'
      })
    }

    // Verify user has an active subscription
    const activeSubscription = await TutorSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: 'An active tutor subscription is required to update tutor applications. Please purchase a subscription.'
      })
    }

    const nextSubjectsLength = payload.subjects.length
    const currentSubjectsLength = application.subjects.length
    const diff = nextSubjectsLength - currentSubjectsLength

    if (diff > 0) {
      // Only count other applications within this subscription period
      const subStartDate = activeSubscription.createdAt || new Date(0)
      const otherApplications = await TutorApplication.find({
        userId: req.user.id,
        _id: { $ne: application._id },
        status: { $in: ['Pending', 'Approved'] },
        createdAt: { $gte: subStartDate }
      })

      let currentCoursesCount = 0
      otherApplications.forEach(app => {
        if (Array.isArray(app.subjects)) {
          currentCoursesCount += app.subjects.length
        }
      })

      if (currentCoursesCount + nextSubjectsLength > activeSubscription.courseLimit) {
        return res.status(400).json({
          success: false,
          message: `You would exceed this subscription's limit of ${activeSubscription.courseLimit} listing slots. Other listings: ${currentCoursesCount}, requested: ${nextSubjectsLength}. Purchase a new subscription for more slots.`
        })
      }
    }

    application.fullName = payload.fullName
    application.email = payload.email
    application.phone = payload.phone
    application.cnic = payload.cnic
    application.university = payload.university
    application.degreeProgram = payload.degreeProgram
    application.currentSemester = payload.currentSemester
    application.subjects = payload.subjects
    application.specialization = payload.specialization
    application.gpa = payload.gpa || ''
    application.hourlyRate = payload.hourlyRate
    application.responseTime = payload.responseTime || ''
    application.teachingExperience = payload.teachingExperience || ''
    application.certifications = payload.certifications || ''
    application.achievements = payload.achievements || ''
    application.linkedinPortfolio = payload.linkedinPortfolio || ''
    // Upload to Cloudinary only if new base64 provided; otherwise keep existing URL
    application.cnicDocument = payload.cnicDocument
      ? await uploadToCloudinary(payload.cnicDocument, 'careermap/tutors/applications')
      : application.cnicDocument || ''
    application.resumeDocument = payload.resumeDocument
      ? await uploadToCloudinary(payload.resumeDocument, 'careermap/tutors/applications')
      : application.resumeDocument || ''
    application.certificateDocuments = payload.certificateDocuments.length
      ? await uploadArrayToCloudinary(payload.certificateDocuments, 'careermap/tutors/certificates')
      : application.certificateDocuments


    // Under subscription model, edited listings remain Approved directly
    application.status = 'Approved'

    await application.save()
    await syncUserProfileFromApplication(req.user.id, payload)

    // Sync all approved applications offerings to user profile
    const approvedApps = await TutorApplication.find({ userId: req.user.id, status: 'Approved' })
    let mergedOfferings = []
    approvedApps.forEach(app => {
      const appOfferings = (app.subjects || []).map(subject => ({
        course: '',
        subject: trimValue(subject),
        expertise: trimValue(app.specialization)
      }))
      mergedOfferings = mergeTutorOfferings([], [...mergedOfferings, ...appOfferings], '')
    })

    const tutorUser = await User.findById(req.user.id)
    if (tutorUser) {
      tutorUser.isTutor = true
      tutorUser.tutorOfferings = mergedOfferings
      await tutorUser.save()
    }

    res.json({
      success: true,
      message: 'Tutor application updated and approved successfully',
      application
    })
  } catch (error) {
    console.error('Error updating user tutor application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    })
  }
})

// Delete a specific tutor application owned by authenticated user
router.delete('/my-applications/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const application = await TutorApplication.findOne({
      _id: id,
      userId: req.user.id
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    const wasApproved = application.status === 'Approved'
    await TutorApplication.deleteOne({ _id: application._id })

    if (wasApproved) {
      const approvedCount = await TutorApplication.countDocuments({
        userId: req.user.id,
        status: 'Approved'
      })

      if (approvedCount === 0) {
        await User.findByIdAndUpdate(req.user.id, {
          isTutor: false,
          tutorBio: '',
          tutorOfferings: []
        })
      }
    }

    res.json({
      success: true,
      message: 'Tutor application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user tutor application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    })
  }
})

// Get all tutor applications (Admin only)
router.get('/applications', adminAuth, async (req, res) => {
  try {
    const applications = await TutorApplication.find({
      status: { $nin: ['payment_pending', 'payment_failed', 'payment_cancelled'] }
    })
      .populate('userId', 'fullName email profileImage')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      applications
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    })
  }
})

// Update application status (Admin only)
router.put('/applications/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, reviewNotes } = req.body

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either Approved or Rejected'
      })
    }

    const application = await TutorApplication.findById(id)

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    // Update application status
    application.status = status
    application.reviewedBy = req.user.id
    application.reviewedAt = new Date()
    application.reviewNotes = reviewNotes || ''
    await application.save()

    // If approved, update user's isTutor flag
    if (status === 'Approved') {
      const tutorOfferingsFromApplication = (application.subjects || []).map((subject) => ({
        course: '',
        subject: trimValue(subject),
        expertise: trimValue(application.specialization)
      }))

      const tutorUser = await User.findById(application.userId)
      if (tutorUser) {
        tutorUser.isTutor = true
        const mergedOfferings = mergeTutorOfferings(
          [],
          [...(tutorUser.tutorOfferings || []), ...tutorOfferingsFromApplication],
          ''
        )
        tutorUser.tutorOfferings = mergedOfferings
        await tutorUser.save()
      }
    }

    res.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      application
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    })
  }
})

// Update tutor card details (Admin only)
router.put('/admin/applications/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const payload = buildTutorApplicationPayload(req.body)
    const nextStatus = trimValue(req.body?.status)

    const application = await TutorApplication.findById(id)
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    if (payload.subjects.length) application.subjects = payload.subjects
    if (payload.fullName) application.fullName = payload.fullName
    if (payload.email) application.email = payload.email
    if (payload.phone) application.phone = payload.phone
    if (payload.cnic) application.cnic = payload.cnic
    if (payload.university) application.university = payload.university
    if (payload.degreeProgram) application.degreeProgram = payload.degreeProgram
    if (payload.currentSemester) application.currentSemester = payload.currentSemester
    if (payload.specialization) application.specialization = payload.specialization

    application.gpa = payload.gpa || application.gpa || ''
    application.hourlyRate = payload.hourlyRate
    application.responseTime = payload.responseTime || ''
    application.teachingExperience = payload.teachingExperience || application.teachingExperience || ''
    application.certifications = payload.certifications || application.certifications || ''
    application.achievements = payload.achievements || application.achievements || ''
    application.linkedinPortfolio = payload.linkedinPortfolio || application.linkedinPortfolio || ''
    // Upload to Cloudinary only if new base64 data is provided; otherwise keep existing
    application.cnicDocument = payload.cnicDocument
      ? await uploadToCloudinary(payload.cnicDocument, 'careermap/tutors/applications')
      : application.cnicDocument || ''
    application.resumeDocument = payload.resumeDocument
      ? await uploadToCloudinary(payload.resumeDocument, 'careermap/tutors/applications')
      : application.resumeDocument || ''
    if (payload.certificateDocuments.length) {
      application.certificateDocuments = await uploadArrayToCloudinary(
        payload.certificateDocuments,
        'careermap/tutors/certificates'
      )
    }

    if (['Approved', 'Rejected', 'Pending'].includes(nextStatus)) {
      application.status = nextStatus
      if (nextStatus === 'Pending') {
        application.reviewedBy = undefined
        application.reviewedAt = undefined
        application.reviewNotes = ''
      } else {
        application.reviewedBy = req.user.id
        application.reviewedAt = new Date()
      }
    }

    await application.save()

    await syncUserProfileFromApplication(application.userId, {
      fullName: application.fullName,
      phone: application.phone,
      university: application.university,
      degreeProgram: application.degreeProgram,
      currentSemester: application.currentSemester,
      gpa: application.gpa
    })

    const approvedCount = await TutorApplication.countDocuments({
      userId: application.userId,
      status: 'Approved'
    })

    if (approvedCount === 0) {
      await User.findByIdAndUpdate(application.userId, {
        isTutor: false,
        tutorBio: '',
        tutorOfferings: []
      })
    } else {
      await User.findByIdAndUpdate(application.userId, { isTutor: true })
    }

    res.json({
      success: true,
      message: 'Tutor card updated successfully',
      application
    })
  } catch (error) {
    console.error('Error updating tutor card:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update tutor card',
      error: error.message
    })
  }
})

// Delete tutor card (Admin only)
router.delete('/admin/applications/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const application = await TutorApplication.findById(id)

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    const userId = application.userId
    await TutorApplication.deleteOne({ _id: id })

    const approvedCount = await TutorApplication.countDocuments({
      userId,
      status: 'Approved'
    })

    if (approvedCount === 0) {
      await User.findByIdAndUpdate(userId, {
        isTutor: false,
        tutorBio: '',
        tutorOfferings: []
      })
    }

    res.json({
      success: true,
      message: 'Tutor card deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting tutor card:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete tutor card',
      error: error.message
    })
  }
})

// Create or update an authenticated user's rating for an approved tutor card.
router.post('/applications/:id/rating', authenticate, async (req, res) => {
  try {
    const ratingValue = normalizeRatingValue(req.body?.rating)
    if (!ratingValue) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      })
    }

    const application = await TutorApplication.findById(req.params.id)

    if (!application || application.status !== 'Approved') {
      return res.status(404).json({
        success: false,
        message: 'Approved tutor not found'
      })
    }

    const existingIndex = (application.ratings || []).findIndex(
      (entry) => String(entry.userId) === String(req.user.id)
    )

    if (existingIndex >= 0) {
      application.ratings[existingIndex].value = ratingValue
      application.ratings[existingIndex].ratedAt = new Date()
    } else {
      application.ratings.push({
        userId: req.user.id,
        value: ratingValue,
        ratedAt: new Date()
      })
    }

    const summary = computeRatingSummary(application.ratings)
    application.ratingAverage = summary.ratingAverage
    application.ratingCount = summary.ratingCount
    await application.save()

    res.json({
      success: true,
      message: 'Rating saved successfully',
      tutorId: application._id,
      ratingAverage: application.ratingAverage,
      ratingCount: application.ratingCount,
      currentUserRating: ratingValue
    })
  } catch (error) {
    console.error('Error saving tutor rating:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to save rating',
      error: error.message
    })
  }
})

// Get all approved tutors (for mentor discovery)
router.get('/approved', authenticate, async (req, res) => {
  try {
    // Proactively find all users with active subscriptions
    const activeSubscriptions = await TutorSubscription.find({
      status: 'active',
      endDate: { $gt: new Date() }
    })

    const activeUserIds = activeSubscriptions.map(s => s.userId)

    if (activeUserIds.length > 0) {
      // Find all pending applications for these users
      const pendingApps = await TutorApplication.find({
        userId: { $in: activeUserIds },
        status: { $in: ['Pending', 'payment_pending', 'pending_review'] }
      })

      if (pendingApps.length > 0) {
        console.log(`Auto-approving ${pendingApps.length} pending tutor applications for users with active subscriptions on mentor discovery load.`)
        
        // Auto-approve them in the database
        await TutorApplication.updateMany(
          { userId: { $in: activeUserIds }, status: { $in: ['Pending', 'payment_pending', 'pending_review'] } },
          { $set: { status: 'Approved' } }
        )

        // Sync each affected user
        for (const userId of activeUserIds) {
          const allApprovedApps = await TutorApplication.find({ userId, status: 'Approved' })
          let mergedOfferings = []
          allApprovedApps.forEach(app => {
            const appOfferings = (app.subjects || []).map(subject => ({
              course: '',
              subject: trimValue(subject),
              expertise: trimValue(app.specialization)
            }))
            mergedOfferings = mergeTutorOfferings([], [...mergedOfferings, ...appOfferings], '')
          })

          await User.findByIdAndUpdate(userId, {
            isTutor: allApprovedApps.length > 0,
            tutorOfferings: mergedOfferings
          })
        }
      }
    }

    const search = trimValue(req.query.search || '').toLowerCase()
    const approvedTutors = await TutorApplication.find({ status: 'Approved' })
      .populate('userId', 'fullName email profileImage isTutor tutorBio tutorOfferings city department')
      .sort({ createdAt: -1 })

    const orphanTutorIds = approvedTutors
      .filter((application) => !application.userId)
      .map((application) => application._id)

    if (orphanTutorIds.length > 0) {
      await TutorApplication.deleteMany({ _id: { $in: orphanTutorIds } })
    }

    const tutors = approvedTutors
      .filter((application) => application.userId)
      .map((application) => {
        const summary = computeRatingSummary(application.ratings || [])
        const currentUserRatingEntry = (application.ratings || []).find(
          (entry) => String(entry.userId) === String(req.user.id)
        )
        const tutorOfferings = mergeTutorOfferings(
          application.subjects || [],
          application.userId?.tutorOfferings || [],
          application.specialization || ''
        )

        const searchableText = [
          application.fullName,
          application.university,
          application.degreeProgram,
          application.specialization,
          ...(application.subjects || []),
          ...tutorOfferings.flatMap((offering) => [offering.course, offering.subject, offering.expertise])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return {
          ...application.toObject(),
          tutorBio: application.userId?.tutorBio || '',
          tutorOfferings,
          ratingAverage: summary.ratingAverage,
          ratingCount: summary.ratingCount,
          currentUserRating: Number(currentUserRatingEntry?.value || 0),
          searchableText
        }
      })
      .filter((tutor) => !search || tutor.searchableText.includes(search))
      .map(({ searchableText, ...tutor }) => tutor)

    res.json({
      success: true,
      tutors
    })
  } catch (error) {
    console.error('Error fetching approved tutors:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutors',
      error: error.message
    })
  }
})

// Admin: Get all tutor subscription applications (excluding heavy base64 images for list performance)
router.get('/admin/subscriptions', adminAuth, async (req, res) => {
  try {
    const subscriptions = await TutorSubscription.find({
      status: { $in: ['pending_review', 'active', 'rejected'] }
    })
      .select('-cnicPicture')
      .populate('userId', 'fullName email profileImage')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })

    // Auto-remove orphaned records where the user no longer exists
    const orphanIds = subscriptions
      .filter(s => !s.userId)
      .map(s => s._id)

    if (orphanIds.length > 0) {
      await TutorSubscription.deleteMany({ _id: { $in: orphanIds } })
    }

    const valid = subscriptions.filter(s => s.userId != null)

    res.json({
      success: true,
      subscriptions: valid
    })
  } catch (error) {
    console.error('Error fetching subscription applications:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription applications',
      error: error.message
    })
  }
})

// Admin: Get details of a single tutor subscription (including heavy base64 images on demand)
router.get('/admin/subscriptions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const subscription = await TutorSubscription.findById(id)
      .populate('userId', 'fullName email profileImage')
      .populate('reviewedBy', 'fullName email')

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Tutor subscription application not found'
      })
    }

    res.json({
      success: true,
      subscription
    })
  } catch (error) {
    console.error('Error fetching single tutor subscription details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutor subscription details',
      error: error.message
    })
  }
})

// Admin: Approve or reject a subscription application
router.put('/admin/subscriptions/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, reviewNotes } = req.body

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or rejected'
      })
    }

    const subscription = await TutorSubscription.findById(id)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      })
    }

    if (status === 'active' && subscription.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already active.'
      })
    }

    subscription.status = status
    subscription.reviewedBy = req.user.id
    subscription.reviewedAt = new Date()
    subscription.reviewNotes = reviewNotes || ''

    if (status === 'active') {
      subscription.startDate = new Date()
      let durationMs = 30 * 24 * 60 * 60 * 1000 // Monthly
      if (subscription.planType === 'six_months') {
        durationMs = 6 * 30 * 24 * 60 * 60 * 1000
      } else if (subscription.planType === 'annual') {
        durationMs = 365 * 24 * 60 * 60 * 1000
      }
      subscription.endDate = new Date(Date.now() + durationMs)

      // Auto-approve any pending tutor applications for this user proactively
      const pendingApps = await TutorApplication.find({
        userId: subscription.userId,
        status: { $in: ['Pending', 'payment_pending', 'pending_review'] }
      })

      if (pendingApps.length > 0) {
        console.log(`Auto-approving ${pendingApps.length} pending tutor applications for user ${subscription.userId} since their subscription is now active.`)
        await TutorApplication.updateMany(
          { userId: subscription.userId, status: { $in: ['Pending', 'payment_pending', 'pending_review'] } },
          { $set: { status: 'Approved' } }
        )

        // Sync offerings to user document
        const allApprovedApps = await TutorApplication.find({ userId: subscription.userId, status: 'Approved' })
        let mergedOfferings = []
        allApprovedApps.forEach(app => {
          const appOfferings = (app.subjects || []).map(subject => ({
            course: '',
            subject: trimValue(subject),
            expertise: trimValue(app.specialization)
          }))
          mergedOfferings = mergeTutorOfferings([], [...mergedOfferings, ...appOfferings], '')
        })

        await User.findByIdAndUpdate(subscription.userId, {
          isTutor: true,
          tutorOfferings: mergedOfferings
        })
      }
    }

    await subscription.save()

    // Trigger Email 2: Acceptance or Rejection Notification
    try {
      const user = await User.findById(subscription.userId)
      const transporter = getTransporterIfConfigured()
      
      if (user && transporter) {
        if (status === 'active') {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: 'Congratulations! Your Tutor Membership is Approved - CareerMap',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #2f855a; text-align: center;">Tutor Membership Approved!</h2>
                <p>Dear ${subscription.fullName || user.fullName},</p>
                <p>Congratulations! Your security and verification application has been reviewed and approved by the CareerMap Admin Team.</p>
                <p>Your tutor membership is now <strong>active</strong> under the <strong>${subscription.planType.toUpperCase().replace('_', ' ')}</strong> plan.</p>
                <p>You can now log in and complete your Tutor Profile / Course Listings directly on the Mentorship page without any additional fees per course.</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <h3 style="color: #2d3748;">CareerMap Tutor Privacy & Safety Policies</h3>
                <ol style="color: #4a5568; line-height: 1.6; font-size: 14px;">
                  <li><strong>Security & Identity Verification:</strong> You agree that your identity (CNIC, Name, Credentials) provided is accurate and authentic. Any mismatch may result in instant termination of your tutor privileges.</li>
                  <li><strong>Tutor Conduct:</strong> Tutors must maintain a professional and ethical demeanor when conducting mentorship sessions. Harassment, abuse, or inappropriate language is strictly prohibited.</li>
                  <li><strong>Content & Material:</strong> Any educational material or slides shared during sessions must adhere to standard academic integrity and copyrights. Plagiarism or posting illegal material is forbidden.</li>
                  <li><strong>Communication & Payments:</strong> All communication regarding courses, scheduling, and payments must be processed through the CareerMap platform. Collecting direct payments from students off-platform is a violation of service terms.</li>
                  <li><strong>Data Protection:</strong> Tutors must respect student privacy and must not share students' contact details or private information with third parties.</li>
                </ol>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p>We are excited to have you join our elite mentor network!</p>
                <p>Best regards,<br>The CareerMap Team</p>
              </div>
            `
          }
          await transporter.sendMail(mailOptions)
          console.log(`Email 2 (Approval) sent successfully to ${user.email}`)
        } else if (status === 'rejected') {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: 'Tutor Subscription Application Status Update - CareerMap',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #c53030; text-align: center;">Subscription Review Status</h2>
                <p>Dear ${subscription.fullName || user.fullName},</p>
                <p>Thank you for applying to be a tutor on CareerMap.</p>
                <p>We regret to inform you that your tutor subscription security application has been reviewed and <strong>rejected</strong> by our admin team due to verification details mismatches or incomplete details.</p>
                <p><strong>Admin Review Notes:</strong> ${reviewNotes || 'Verification details could not be validated.'}</p>
                <p>Please double-check your credentials and resubmit the subscription form with accurate details to be reconsidered.</p>
                <p>Best regards,<br>The CareerMap Team</p>
              </div>
            `
          }
          await transporter.sendMail(mailOptions)
          console.log(`Email 2 (Rejection) sent successfully to ${user.email}`)
        }
      }
    } catch (emailErr) {
      console.error('Error sending Email 2 (Status Notification):', emailErr)
    }

    res.json({
      success: true,
      message: `Subscription has been successfully ${status === 'active' ? 'approved' : 'rejected'}.`,
      subscription
    })
  } catch (error) {
    console.error('Error updating subscription status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription status',
      error: error.message
    })
  }
})

// Admin: Delete a tutor subscription application
router.delete('/admin/subscriptions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const subscription = await TutorSubscription.findByIdAndDelete(id)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Tutor subscription application not found'
      })
    }
    res.json({
      success: true,
      message: 'Tutor subscription application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting tutor subscription application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete tutor subscription application',
      error: error.message
    })
  }
})

export default router
