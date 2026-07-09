import mongoose from 'mongoose'

const TutorSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Security & Verification Details
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    cnic: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    education: {
      type: String,
      required: true,
      trim: true
    },
    cnicPicture: {
      type: String,
      required: true
    },
    degreeField: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      required: true,
      trim: true
    },
    currently: {
      type: String,
      enum: ['student', 'employer', 'other'],
      required: true
    },
    // Plan Specifications
    planType: {
      type: String,
      enum: ['monthly', 'six_months', 'annual'],
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
    courseLimit: {
      type: Number,
      required: true
    },
    // Subscription Application Review Status
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

const TutorSubscription = mongoose.model('TutorSubscription', TutorSubscriptionSchema)
export default TutorSubscription
