import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['PKR'],
    default: 'PKR'
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['Laptop', 'Books', 'Accessories', 'Textbooks', 'Notes', 'Lab Materials', 'Stationery', 'Electronics', 'Other'],
    required: true
  },
  condition: {
    type: String,
    enum: ['New', 'Used'],
    required: true
  },
  location: {
    city: {
      type: String,
      required: true
    },
    area: {
      type: String
    }
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  stock: {
    type: Number,
    default: 1,
    min: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['payment_pending', 'payment_failed', 'active', 'rejected'],
    default: 'active'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  sold: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for search functionality
productSchema.index({ title: 'text', description: 'text', category: 'text' })
productSchema.index({ 'location.city': 1 })
productSchema.index({ category: 1 })
productSchema.index({ seller: 1 })

const Product = mongoose.model('Product', productSchema)

export default Product
