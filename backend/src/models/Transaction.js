import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorApplication',
      required: false
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false
    },
    type: {
      type: String,
      enum: ['tutor_application', 'product_listing'],
      default: 'tutor_application',
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
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending'
    },
    // Our internal reference ID passed to PayFast
    referenceId: {
      type: String,
      required: true,
      unique: true
    },
    // PayFast's transaction ID returned via IPN/Callback
    payfastTransactionId: {
      type: String,
      default: null
    },
    // Full payload received from PayFast for auditing
    payfastPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
)

const Transaction = mongoose.model('Transaction', transactionSchema)
export default Transaction
