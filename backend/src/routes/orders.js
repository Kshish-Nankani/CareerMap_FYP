import express from 'express'
import crypto from 'crypto'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import authenticate from '../middleware/auth.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import TutorApplication from '../models/TutorApplication.js'
import TutorSubscription from '../models/TutorSubscription.js'
import SellerSubscription from '../models/SellerSubscription.js'
import User from '../models/User.js'

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

const transporter = getTransporterIfConfigured()

// Email helper functions
async function sendBuyerOrderConfirmationEmail(order, buyerEmail, buyerName) {
  if (!transporter) {
    console.log('Email not configured, skipping buyer notification')
    return
  }

  try {
    const itemsHtml = order.items
      .map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0ece6;">${item.title}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0ece6; text-align: center;">x${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0ece6; text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `)
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #fcfbf9; padding: 20px; border-radius: 8px; }
          .header { background: #a78b71; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
          .order-details { background: white; padding: 20px; border: 1px solid #f0ece6; border-radius: 6px; margin: 20px 0; }
          .section-title { color: #a78b71; font-weight: bold; font-size: 1.1em; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #a78b71; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          .summary-table { background: #f9f9f9; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .summary-row.total { font-weight: bold; font-size: 1.2em; color: #a78b71; border-top: 2px solid #a78b71; padding-top: 15px; margin-top: 10px; }
          .note-box { background: #fff8e1; border-left: 4px solid #ffe0b2; padding: 15px; margin: 20px 0; border-radius: 4px; color: #a78b71; }
          .shipping-box { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Order Confirmation</h1>
            <p style="margin: 10px 0 0 0;">CareerMap Marketplace</p>
          </div>

          <div class="order-details">
            <p>Dear ${buyerName},</p>
            <p>Thank you for your order! Your order has been successfully placed on CareerMap. Below is a summary of your purchase.</p>

            <div class="section-title">Order Number: ${order.orderNumber}</div>
            
            <div class="section-title">Order Items</div>
            <table>
              <thead style="background: #f9f9f9;">
                <tr>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #a78b71;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #a78b71;">Quantity</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #a78b71;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="section-title">Order Summary</div>
            <div class="summary-table">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>Rs. ${order.subtotal.toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Charges:</span>
                <span>Rs. ${order.deliveryFee.toLocaleString()}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span>Rs. ${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="section-title">Delivery Address</div>
            <div class="shipping-box">
              <p style="margin: 5px 0;"><strong>${order.shippingDetails.fullName}</strong></p>
              <p style="margin: 5px 0;">${order.shippingDetails.fullAddress}</p>
              <p style="margin: 5px 0;">${order.shippingDetails.city}${order.shippingDetails.area ? ', ' + order.shippingDetails.area : ''}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingDetails.phone}</p>
            </div>

            <div class="section-title">Payment Method</div>
            <p style="margin: 10px 0; font-weight: 600;">Cash on Delivery (COD)</p>

            <div class="note-box">
              <strong>Important Note:</strong><br>
              Delivery charges of Rs. 300 will be collected by the courier at the time of delivery. In case the order is cancelled after confirmation, delivery charges may still apply.
            </div>

            <p style="margin-top: 20px; color: #666;">Your order is being processed and will be dispatched soon. You will receive tracking information via email once your order is shipped.</p>
            
            <p style="margin: 20px 0 0 0;">If you have any questions about your order, please contact us.</p>
          </div>

          <div class="footer">
            <p>This is an automated email. Please do not reply to this email address.</p>
            <p>&copy; 2026 CareerMap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: buyerEmail,
      subject: `Order Confirmation - ${order.orderNumber} | CareerMap`,
      html: htmlContent
    })

    console.log(`Buyer confirmation email sent to ${buyerEmail}`)
  } catch (error) {
    console.error('Error sending buyer confirmation email:', error)
  }
}

async function sendSellerOrderNotificationEmail(seller, order, items) {
  if (!transporter || !seller.email) {
    console.log('Email not configured or seller has no email, skipping seller notification')
    return
  }

  try {
    const itemsHtml = items
      .map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0ece6;">${item.title}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0ece6; text-align: center;">x${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0ece6; text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `)
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #fcfbf9; padding: 20px; border-radius: 8px; }
          .header { background: #a78b71; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
          .order-details { background: white; padding: 20px; border: 1px solid #f0ece6; border-radius: 6px; margin: 20px 0; }
          .section-title { color: #a78b71; font-weight: bold; font-size: 1.1em; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #a78b71; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          .buyer-info { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .summary-table { background: #f9f9f9; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .summary-row.total { font-weight: bold; font-size: 1.2em; color: #a78b71; border-top: 2px solid #a78b71; padding-top: 15px; margin-top: 10px; }
          .footer { text-align: center; color: #999; font-size: 0.9em; margin-top: 20px; }
          .urgent { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Order Received!</h1>
            <p style="margin: 10px 0 0 0;">CareerMap Marketplace</p>
          </div>

          <div class="order-details">
            <p>Dear Seller,</p>
            <p>Great news! You have received a new order on CareerMap Marketplace. Below are the order details.</p>

            <div class="section-title">Order Number: ${order.orderNumber}</div>

            <div class="section-title">Buyer Information</div>
            <div class="buyer-info">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${order.shippingDetails.fullName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${order.shippingDetails.email}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingDetails.phone}</p>
              <p style="margin: 5px 0;"><strong>City/Area:</strong> ${order.shippingDetails.city}${order.shippingDetails.area ? ', ' + order.shippingDetails.area : ''}</p>
              <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${order.shippingDetails.fullAddress}</p>
            </div>

            <div class="section-title">Ordered Items</div>
            <table>
              <thead style="background: #f9f9f9;">
                <tr>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #a78b71;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #a78b71;">Quantity</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #a78b71;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="section-title">Order Summary</div>
            <div class="summary-table">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>Rs. ${order.subtotal.toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Charges:</span>
                <span>Rs. ${order.deliveryFee.toLocaleString()}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span>Rs. ${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="section-title">Payment Method</div>
            <p style="margin: 10px 0; font-weight: 600;">Cash on Delivery (COD)</p>

            <div class="urgent">
              <strong>Action Required:</strong> Please pack and prepare the item(s) for shipment. Verify the buyer's delivery address and confirm the order through your dashboard.
            </div>

            <p style="margin-top: 20px; color: #666;">Log into your CareerMap dashboard to manage this order and update the shipment status once the item has been dispatched.</p>
          </div>

          <div class="footer">
            <p>This is an automated email. Please do not reply to this email address.</p>
            <p>&copy; 2026 CareerMap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: seller.email,
      subject: `New Order Received - ${order.orderNumber} | CareerMap`,
      html: htmlContent
    })

    console.log(`Seller notification email sent to ${seller.email}`)
  } catch (error) {
    console.error('Error sending seller notification email:', error)
  }
}

const router = express.Router()

// Mock redirect handler to bypass PayFast when UAT API is down/slow
router.all('/payfast/mock-redirect', (req, res) => {
  const basket_id = req.query.basket_id || req.body.basket_id
  const err_code = req.query.err_code || req.body.err_code
  const validation_hash = req.query.validation_hash || req.body.validation_hash
  const transaction_id = req.query.transaction_id || req.body.transaction_id

  console.log('[PayFast Bypass] Received mock redirect request. Redirecting to frontend callback.')
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const redirectUrl = `${frontendUrl}/payment/callback?basket_id=${basket_id}&err_code=${err_code}&validation_hash=${validation_hash}&transaction_id=${transaction_id}`
  
  return res.redirect(302, redirectUrl)
})

// PayFast IPN/Webhook Callback (GET & POST) - MUST be unauthenticated
router.all('/payfast/webhook', async (req, res) => {
  try {
    const basket_id = req.query.basket_id || req.body.basket_id
    const err_code = req.query.err_code || req.body.err_code
    const validation_hash = req.query.validation_hash || req.body.validation_hash
    const transaction_id = req.query.transaction_id || req.body.transaction_id

    console.log('PayFast Webhook called with params:', { basket_id, err_code, validation_hash, transaction_id })

    if (!basket_id || !err_code || !validation_hash) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' })
    }

    // Verify validation hash
    const hashStr = `${basket_id}|${process.env.PAYFAST_SECURE_KEY}|${process.env.PAYFAST_MERCHANT_ID}|${err_code}`
    const computedHash = crypto.createHash('sha256').update(hashStr).digest('hex')

    if (computedHash.toLowerCase() !== validation_hash.toLowerCase()) {
      console.error('PayFast Webhook hash mismatch! Computed:', computedHash, 'Received:', validation_hash)
      return res.status(400).json({ success: false, message: 'Invalid validation hash' })
    }

    const order = await Order.findOne({ orderNumber: basket_id })
    if (!order) {
      if (mongoose.Types.ObjectId.isValid(basket_id)) {
        const application = await TutorApplication.findById(basket_id)
        if (application) {
          if (application.status === 'payment_pending' || application.status === 'payment_failed') {
            if (err_code === '000' || err_code === '00') {
              application.status = 'Pending' // paid, pending admin review
              application.transactionId = transaction_id
              await application.save()
              console.log(`PayFast payment successful for Tutor Application ${basket_id}. Status updated to Pending.`)
            
              try {
                const user = await User.findById(application.userId)
                if (user && transporter) {
                  const mailOptions = {
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: user.email,
                    subject: 'Tutor Application Under Review - CareerMap',
                    html: `
                      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #3182ce; text-align: center; margin-bottom: 20px;">Tutor Application Received</h2>
                        <p style="font-size: 1rem; color: #2d3748; line-height: 1.6;">Dear ${application.fullName || user.fullName},</p>
                        <p style="font-size: 1rem; color: #2d3748; line-height: 1.6;">Thank you for subscribing in tutor applications. Your request is now under admin review. We will notify you with updates.</p>
                        <p style="font-size: 0.95rem; color: #4a5568; margin-top: 20px;">Best regards,<br><strong>The CareerMap Team</strong></p>
                      </div>
                    `
                  }
                  await transporter.sendMail(mailOptions)
                  console.log(`Email 1 (Tutor Application Received) sent successfully to ${user.email}`)
                }
              } catch (emailErr) {
                console.error('Error sending Email 1 (Tutor Application Pending Review Notification):', emailErr)
              }
            } else {
              application.status = 'payment_failed'
              application.transactionId = transaction_id
              await application.save()
              console.log(`PayFast payment failed with err_code ${err_code} for Tutor Application ${basket_id}. Status updated to payment_failed.`)
            }
          } else {
            console.log(`Tutor Application ${basket_id} is already in state: ${application.status}, skipping status update.`)
          }
          return res.status(200).json({ success: true, message: 'Webhook processed successfully for tutor application' })
        }
  
        const subscription = await TutorSubscription.findById(basket_id)
        if (subscription) {
          if (subscription.status === 'payment_pending' || subscription.status === 'failed') {
            if (err_code === '000' || err_code === '00') {
              subscription.status = 'pending_review'
              subscription.transactionId = transaction_id
              await subscription.save()
              console.log(`PayFast payment successful for Tutor Subscription ${basket_id}. Status updated to pending_review.`)

              // Trigger Email 1: Application Received / Under Review
              try {
                const user = await User.findById(subscription.userId)
                if (user && transporter) {
                  const mailOptions = {
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: user.email,
                    subject: 'Tutor Subscription Application Under Review - CareerMap',
                    html: `
                      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #3182ce; text-align: center; margin-bottom: 20px;">Tutor Subscription Received</h2>
                        <p style="font-size: 1rem; color: #2d3748; line-height: 1.6;">Dear ${subscription.fullName || user.fullName},</p>
                        <p style="font-size: 1rem; color: #2d3748; line-height: 1.6;">Thank you for subscribing in tutor applications. Your request is now under admin review. We will notify you with updates.</p>
                        <p style="font-size: 0.95rem; color: #4a5568; margin-top: 20px;">Best regards,<br><strong>The CareerMap Team</strong></p>
                      </div>
                    `
                  }
                  await transporter.sendMail(mailOptions)
                  console.log(`Email 1 (Application Received) sent successfully to ${user.email}`)
                }
              } catch (emailErr) {
                console.error('Error sending Email 1 (Pending Review Notification):', emailErr)
              }
            } else {
              subscription.status = 'failed'
              subscription.transactionId = transaction_id
              await subscription.save()
              console.log(`PayFast payment failed with err_code ${err_code} for Tutor Subscription ${basket_id}. Status updated to failed.`)
            }
          } else {
            console.log(`Tutor Subscription ${basket_id} is already in state: ${subscription.status}, skipping status update.`)
          }
          return res.status(200).json({ success: true, message: 'Webhook processed successfully for tutor subscription' })
        }

        const sellerSub = await SellerSubscription.findById(basket_id)
        if (sellerSub) {
          if (sellerSub.status === 'payment_pending' || sellerSub.status === 'failed') {
            if (err_code === '000' || err_code === '00') {
              sellerSub.status = 'pending_review'
              sellerSub.transactionId = transaction_id
              await sellerSub.save()
              console.log(`PayFast payment successful for Seller Subscription ${basket_id}. Status updated to pending_review.`)

              // Trigger Email 1: Seller Application Received / Under Review
              try {
                const user = await User.findById(sellerSub.userId)
                if (user && transporter) {
                  const mailOptions = {
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: user.email,
                    subject: 'Seller Verification Application Under Review - CareerMap',
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                        <h2 style="color: #2b6cb0; text-align: center;">Seller Application Received</h2>
                        <p>Dear ${sellerSub.fullName || user.fullName},</p>
                        <p>Thank you for submitting your seller registration details on CareerMap!</p>
                        <p>Your subscription payment for the <strong>${sellerSub.planType.toUpperCase()}</strong> membership (Amount: ${sellerSub.amount} PKR) has been processed successfully.</p>
                        <p>Your seller verification application is now under admin review. We will verify your CNIC credentials and selfies and notify you of our decision via email shortly.</p>
                        <p>Best regards,<br>The CareerMap Team</p>
                      </div>
                    `
                  }
                  await transporter.sendMail(mailOptions)
                  console.log(`Email 1 (Seller Sub Received) sent successfully to ${user.email}`)
                }
              } catch (emailErr) {
                console.error('Error sending Email 1 (Seller Pending Review Notification):', emailErr)
              }
            } else {
              sellerSub.status = 'failed'
              sellerSub.transactionId = transaction_id
              await sellerSub.save()
              console.log(`PayFast payment failed with err_code ${err_code} for Seller Subscription ${basket_id}. Status updated to failed.`)
            }
          } else {
            console.log(`Seller Subscription ${basket_id} is already in state: ${sellerSub.status}, skipping status update.`)
          }
          return res.status(200).json({ success: true, message: 'Webhook processed successfully for seller subscription' })
        }
      }

      console.error('PayFast Webhook Order, Tutor Application, Tutor Subscription, or Seller Subscription not found:', basket_id)
      return res.status(404).json({ success: false, message: 'Order, Tutor Application, Tutor Subscription, or Seller Subscription not found' })
    }

    // Marketplace orders use COD payment - no webhook payment processing needed
    console.log(`Webhook received for marketplace order ${basket_id} (COD payment method - no processing required)`)

    return res.status(200).json({ success: true, message: 'Webhook processed successfully for marketplace order' })
  } catch (error) {
    console.error('Error handling PayFast webhook:', error)
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message })
  }
})

// Middleware to check authentication
router.use(authenticate)

// Create a new order
router.post('/create', async (req, res) => {
  try {
    const { items, shippingDetails, subtotal, deliveryFee } = req.body
    const userId = req.user.id

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    if (!shippingDetails || !shippingDetails.fullName || !shippingDetails.email || 
        !shippingDetails.phone || !shippingDetails.city || !shippingDetails.fullAddress) {
      return res.status(400).json({ message: 'Missing required shipping details' })
    }

    // Calculate total
    const totalAmount = subtotal + deliveryFee

    // Create order (marketplace always uses COD payment)
    const order = new Order({
      userId,
      items,
      shippingDetails,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: 'cod',
      status: 'pending'
    })

    await order.save()

    // Send email notifications
    try {
        // Send buyer confirmation email
        await sendBuyerOrderConfirmationEmail(order, shippingDetails.email, shippingDetails.fullName)

        // Group items by seller and send seller notification emails
        const sellerMap = new Map()
        
        for (const item of items) {
          const product = await Product.findById(item.productId).populate('seller', 'name email fullName')
          if (product && product.seller) {
            if (!sellerMap.has(product.seller._id.toString())) {
              sellerMap.set(product.seller._id.toString(), {
                seller: product.seller,
                items: []
              })
            }
            sellerMap.get(product.seller._id.toString()).items.push(item)
          }
        }

        // Send notification to each seller
        for (const [, sellerData] of sellerMap) {
          await sendSellerOrderNotificationEmail(sellerData.seller, order, sellerData.items)
        }
      } catch (emailError) {
        console.error('Error sending order notification emails:', emailError)
        // Don't fail the order creation if emails fail, just log the error
      }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'Failed to create order', error: error.message })
  }
})

// Get user's orders
router.get('/my-orders', async (req, res) => {
  try {
    const userId = req.user.id
    const orders = await Order.find({ userId }).sort({ createdAt: -1 })

    res.json({
      success: true,
      orders
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message })
  }
})

// Get seller's received orders (orders for their products)
router.get('/seller/received-orders', authenticate, async (req, res) => {
  try {
    const sellerId = req.user._id

    // Find all orders that contain products from this seller
    const orders = await Order.find({
      'items.sellerId': sellerId
    })
      .populate('userId', 'fullName email phone')
      .populate('items.productId', 'title price')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      orders: orders
    })
  } catch (error) {
    console.error('Get seller received orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch received orders'
    })
  }
})

// Update order status (by seller or admin)
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body
    const userId = req.user.id

    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check authorization: only seller of products in this order or admin can update
    let isAuthorized = false
    
    // Check if user is seller of any product in the order
    for (const item of order.items) {
      const product = await Product.findById(item.productId).select('seller')
      if (product && String(product.seller) === String(userId)) {
        isAuthorized = true
        break
      }
    }

    const user = await User.findById(userId)
    if (user?.isAdmin) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Unauthorized - you can only update orders for your products' })
    }

    order.status = status
    await order.save()

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ message: 'Failed to update order status', error: error.message })
  }
})

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check if user owns this order
    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    res.json({
      success: true,
      order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ message: 'Failed to fetch order', error: error.message })
  }
})

export default router
