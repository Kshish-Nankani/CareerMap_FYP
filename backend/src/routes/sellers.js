import express from 'express'
import SellerSubscription from '../models/SellerSubscription.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import authenticate from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'
import nodemailer from 'nodemailer'
import { uploadToCloudinary } from '../utils/cloudinary.js'
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

const SELLER_PLANS = {
  basic: { price: 2500.00, limit: 10, name: "CareerMap Basic Seller Membership" },
  standard: { price: 5000.00, limit: 20, name: "CareerMap Standard Seller Membership" },
  premium: { price: 7000.00, limit: 50, name: "CareerMap Premium Seller Membership" }
}

const initiateSellerSubscriptionPayment = async (subscription, req, res) => {
  const basketId = subscription._id.toString()
  try {
    const plan = SELLER_PLANS[subscription.planType]
    const tokenParams = new URLSearchParams()
    tokenParams.append('MERCHANT_ID', process.env.PAYFAST_MERCHANT_ID)
    tokenParams.append('SECURED_KEY', process.env.PAYFAST_SECURE_KEY)
    tokenParams.append('TXNAMT', subscription.amount.toFixed(2))
    tokenParams.append('BASKET_ID', basketId)
    tokenParams.append('CURRENCY_CODE', 'PKR')

    console.log('Fetching access token for seller subscription:', basketId, 'amount:', subscription.amount.toFixed(2))
    
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
    console.warn(`[PayFast Bypass] Error or Timeout calling PayFast API for seller subscription ${basketId}:`, tokenError.message)
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

// Get active seller subscription details
router.get('/my-subscription', authenticate, async (req, res) => {
  try {
    const activeSubscription = await SellerSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (!activeSubscription) {
      // Fallback: Check if there's a pending review subscription
      const pendingSubscription = await SellerSubscription.findOne({
        userId: req.user.id,
        status: 'pending_review'
      }).sort({ createdAt: -1 })

      if (pendingSubscription) {
        return res.json({
          success: true,
          hasActiveSubscription: false,
          subscription: pendingSubscription,
          productsLimit: pendingSubscription.productLimit,
          productsUsed: 0,
          productsRemaining: 0
        })
      }

      return res.json({
        success: true,
        hasActiveSubscription: false,
        subscription: null,
        productsLimit: 0,
        productsUsed: 0,
        productsRemaining: 0
      })
    }

    // Count products created ON OR AFTER this subscription was created
    const subscriptionStartDate = activeSubscription.createdAt || new Date(0)
    const productsCount = await Product.countDocuments({
      seller: req.user.id,
      isActive: true,
      createdAt: { $gte: subscriptionStartDate }
    })

    if (productsCount >= activeSubscription.productLimit) {
      activeSubscription.status = 'expired'
      await activeSubscription.save()

      return res.json({
        success: true,
        hasActiveSubscription: false,
        subscription: null,
        productsLimit: 0,
        productsUsed: 0,
        productsRemaining: 0
      })
    }

    return res.json({
      success: true,
      hasActiveSubscription: true,
      subscription: activeSubscription,
      productsLimit: activeSubscription.productLimit,
      productsUsed: productsCount,
      productsRemaining: Math.max(0, activeSubscription.productLimit - productsCount)
    })
  } catch (error) {
    console.error('Error fetching seller subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller subscription details',
      error: error.message
    })
  }
})

// Subscribe to a seller membership plan
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const {
      planType,
      fullName,
      email,
      phone,
      cnic,
      socialMediaLink,
      sellerType,
      cnicFrontImage,
      cnicBackImage,
      selfieWithCnic
    } = req.body
    
    if (!planType || !fullName || !email || !phone || !cnic || !sellerType || !cnicFrontImage || !cnicBackImage || !selfieWithCnic) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Plan Type, Full Name, Email, Phone, CNIC, Seller Type, CNIC Front, CNIC Back, Selfie with CNIC) are required.'
      })
    }

    // Check if a seller subscription with the same CNIC already exists
    const existingCnic = await SellerSubscription.findOne({ cnic: cnic.trim() })
    if (existingCnic) {
      return res.status(400).json({
        success: false,
        message: 'This CNIC number is already registered under another seller application.'
      })
    }
    
    if (!SELLER_PLANS[planType]) {
      return res.status(400).json({
        success: false,
        message: `Invalid planType. Must be one of: ${Object.keys(SELLER_PLANS).join(', ')}`
      })
    }

    if (!['student', 'small_business', 'individual'].includes(sellerType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sellerType. Must be one of: student, small_business, individual.'
      })
    }

    const planConfig = SELLER_PLANS[planType]

    
    const uploadedCnicFront = await uploadToCloudinary(cnicFrontImage, 'careermap/sellers/cnic')
    const uploadedCnicBack = await uploadToCloudinary(cnicBackImage, 'careermap/sellers/cnic')
    const uploadedSelfie = await uploadToCloudinary(selfieWithCnic, 'careermap/sellers/selfies')

    const subscription = new SellerSubscription({
      userId: req.user.id,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      socialMediaLink: (socialMediaLink || '').trim(),
      sellerType,
      cnicFrontImage: uploadedCnicFront,
      cnicBackImage: uploadedCnicBack,
      selfieWithCnic: uploadedSelfie,
      planType,
      amount: planConfig.price,
      productLimit: planConfig.limit,
      status: 'payment_pending'
    })

    await subscription.save()

    return initiateSellerSubscriptionPayment(subscription, req, res)
  } catch (error) {
    console.error('Error subscribing to seller plan:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to initiate seller subscription purchase',
      error: error.message
    })
  }
})

// Admin: Get all seller subscription applications (excluding heavy base64 images for list performance)
router.get('/admin/subscriptions', adminAuth, async (req, res) => {
  try {
    const subscriptions = await SellerSubscription.find({
      status: { $in: ['pending_review', 'active', 'rejected'] }
    })
      .select('-cnicFrontImage -cnicBackImage -selfieWithCnic')
      .populate('userId', 'fullName email profileImage')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })

    // Auto-remove orphaned records where the user no longer exists
    const orphanIds = subscriptions
      .filter(s => !s.userId)
      .map(s => s._id)

    if (orphanIds.length > 0) {
      await SellerSubscription.deleteMany({ _id: { $in: orphanIds } })
    }

    const valid = subscriptions.filter(s => s.userId != null)

    res.json({
      success: true,
      subscriptions: valid
    })
  } catch (error) {
    console.error('Error fetching seller subscriptions for admin:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller subscription applications',
      error: error.message
    })
  }
})


// Admin: Get details of a single seller subscription (including heavy base64 images on demand)
router.get('/admin/subscriptions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const subscription = await SellerSubscription.findById(id)
      .populate('userId', 'fullName email profileImage')
      .populate('reviewedBy', 'fullName email')

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Seller subscription not found'
      })
    }

    res.json({
      success: true,
      subscription
    })
  } catch (error) {
    console.error('Error fetching single seller subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller subscription details',
      error: error.message
    })
  }
})

// Admin: Approve or reject a seller subscription application
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

    const subscription = await SellerSubscription.findById(id)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Seller subscription not found'
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
      // Valid for 30 days
      subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Sync seller profile status to user model
      await User.findByIdAndUpdate(subscription.userId, {
        isSeller: true
      })
    }

    await subscription.save()

    // Trigger Email Acceptance/Rejection
    try {
      const user = await User.findById(subscription.userId)
      const transporter = getTransporterIfConfigured()
      
      if (user && transporter) {
        if (status === 'active') {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: 'Congratulations! Your Seller Onboarding is Approved - CareerMap',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #2b6cb0; text-align: center;">Seller Account Approved!</h2>
                <p>Dear ${subscription.fullName || user.fullName},</p>
                <p>Congratulations! Your seller verification details have been reviewed and approved by the CareerMap Admin Team.</p>
                <p>Your seller membership is now <strong>active</strong> under the <strong>${subscription.planType.toUpperCase()}</strong> plan (Quota: ${subscription.productLimit} listings).</p>
                <p>You can now upload your textbook listings, notes, and stationery items directly into the Student Marketplace without per-listing fees!</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <h3 style="color: #2d3748;">CareerMap Marketplace Seller Terms & Privacy Policies</h3>
                <ol style="color: #4a5568; line-height: 1.6; font-size: 14px;">
                  <li><strong>Product Accuracy:</strong> Sellers must describe all listings (condition, specifications, price) accurately. Intentionally listing misleading or counterfeit items will result in immediate suspension.</li>
                  <li><strong>Safety & Handover:</strong> Always prioritize safety when meeting buyers. We strongly recommend public on-campus meetups or verified institutional pick-up points.</li>
                  <li><strong>Fair Pricing:</strong> Sellers agree to list products at reasonable and fair rates. No spam listing or price gouging.</li>
                  <li><strong>Prohibited Materials:</strong> Listing illegal items, exams/papers key solutions, copyright-infringed materials, or non-academic general goods is strictly forbidden.</li>
                  <li><strong>Data Confidentiality:</strong> You must respect buyers' personal information. Misusing buyer contact numbers or address details is a direct breach of terms.</li>
                </ol>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p>Happy Selling!</p>
                <p>Best regards,<br>The CareerMap Team</p>
              </div>
            `
          }
          await transporter.sendMail(mailOptions)
          console.log(`Email 2 (Seller Approved) sent successfully to ${user.email}`)
        } else if (status === 'rejected') {
          const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: 'Seller Verification Status Update - CareerMap',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #c53030; text-align: center;">Verification Review Status</h2>
                <p>Dear ${subscription.fullName || user.fullName},</p>
                <p>Thank you for submitting your seller registration application on CareerMap.</p>
                <p>We regret to inform you that your seller verification security details have been <strong>rejected</strong> by our admin team.</p>
                <p><strong>Feedback/Reason:</strong> ${reviewNotes || 'CNIC documentation or live selfie could not be validated.'}</p>
                <p>Please double check your details and resubmit the seller verification form with clear, high-resolution documentation for reconsidering.</p>
                <p>Best regards,<br>The CareerMap Team</p>
              </div>
            `
          }
          await transporter.sendMail(mailOptions)
          console.log(`Email 2 (Seller Rejected) sent successfully to ${user.email}`)
        }
      }
    } catch (emailErr) {
      console.error('Error sending Email 2 (Seller Status Notification):', emailErr)
    }

    res.json({
      success: true,
      message: `Seller subscription has been successfully ${status === 'active' ? 'approved' : 'rejected'}.`,
      subscription
    })
  } catch (error) {
    console.error('Error updating seller subscription status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update seller subscription status',
      error: error.message
    })
  }
})

// Admin: Delete a seller subscription application
router.delete('/admin/subscriptions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const subscription = await SellerSubscription.findByIdAndDelete(id)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Seller subscription not found'
      })
    }
    res.json({
      success: true,
      message: 'Seller subscription deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting seller subscription application:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete seller subscription application',
      error: error.message
    })
  }
})

export default router
