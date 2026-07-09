import { useState } from 'react'
import { X } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getAuthToken } from '../utils/authStorage'
import { API_BASE_URL } from '../utils/api'

import '../styles/CheckoutModal.css'

function CheckoutModal({ isOpen, onClose, items, subtotal }) {
  const { user } = useAuth()
  const { clearCart } = useCart()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    area: '',
    fullAddress: ''
  })
  const [error, setError] = useState('')
  // Only COD is available now
  const [paymentMethod] = useState('cod')

  const deliveryFee = 300
  const totalAmount = subtotal + deliveryFee

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone Number is required')
      return false
    }
    if (!formData.city.trim()) {
      setError('City/Area is required')
      return false
    }
    if (!formData.fullAddress.trim()) {
      setError('Full Address is required')
      return false
    }
    return true
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = getAuthToken()
      
      // Transform items to match Order schema (convert _id to productId)
      const formattedItems = items.map(item => ({
        productId: item._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))
      
      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: formattedItems,
          shippingDetails: formData,
          subtotal,
          deliveryFee,
          paymentMethod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order')
      }

      // No PayFast logic needed, only COD

      showToast('Your order has been successfully placed', 'success')
      clearCart()
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setFormData({
          fullName: user?.fullName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          city: user?.city || '',
          area: '',
          fullAddress: ''
        })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to place order')
      console.error('Order error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal">
        <div className="checkout-modal-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="checkout-modal-content">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmitOrder}>
            <div className="form-section">
              <h3>Shipping Details</h3>
              
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City/Area *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city or area"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="area">Area (Optional)</label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Enter area/neighborhood"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="fullAddress">Full Address *</label>
                <textarea
                  id="fullAddress"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  placeholder="Enter your complete address"
                  rows="3"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h3>Payment Method</h3>
              <div className="payment-options" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div className="payment-option-label" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: '#fcfbf9',
                  borderColor: '#a78b71',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked
                    readOnly
                    style={{ accentColor: '#a78b71', width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Cash on Delivery (COD)</span>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Pay cash when your order is delivered to your doorstep.</span>
                  </div>
                </div>
              </div>
              {/* Delivery Note */}
              <div className="delivery-note" style={{
                marginTop: '18px',
                background: '#fff8e1',
                border: '1px solid #ffe0b2',
                borderRadius: '6px',
                padding: '1rem',
                color: '#a78b71',
                fontSize: '0.98rem',
                fontWeight: 500
              }}>
                Note: Delivery charges of Rs. 300 must be paid when the courier arrives at your doorstep. In case you cancel your order after confirmation, the delivery charges will still apply.
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary-checkout">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>PKR {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>PKR {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-order"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Submit Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
