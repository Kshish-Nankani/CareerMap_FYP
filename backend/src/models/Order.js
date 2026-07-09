import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  },
  { _id: false }
)

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      area: { type: String, trim: true, default: '' },
      fullAddress: { type: String, required: true }
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 300 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending_payment', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, default: 'cod' },
    orderNumber: { type: String, unique: true }
  },
  { timestamps: true }
)

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`
  }
  next()
})

const Order = mongoose.model('Order', OrderSchema)

export default Order
