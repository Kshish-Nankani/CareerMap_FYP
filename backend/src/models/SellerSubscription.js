import mongoose from 'mongoose'

const SellerSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Verification Details
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    cnic: {
      type: String,
      required: true,
      trim: true
    },
    socialMediaLink: {
      type: String,
      trim: true,
      default: ''
    },
    sellerType: {
      type: String,
      enum: ['student', 'small_business', 'individual'],
      required: true
    },
    cnicFrontImage: {
      type: String,
      required: true
    },
    cnicBackImage: {
      type: String,
      required: true
    },
    selfieWithCnic: {
      type: String,
      required: true
    },
    // Plan Specifications
    planType: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'PKR'
    },
    productLimit: {
      type: Number,
      required: true
    },
    // Status
    status: {
      type: String,
      enum: ['payment_pending', 'pending_review', 'active', 'rejected', 'expired', 'failed', 'cancelled'],
      default: 'payment_pending'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    transactionId: {
      type: String,
      default: null
    },
    // Admin Review Details
    reviewNotes: {
      type: String,
      default: '',
      trim: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

const SellerSubscription = mongoose.model('SellerSubscription', SellerSubscriptionSchema)
export default SellerSubscription
