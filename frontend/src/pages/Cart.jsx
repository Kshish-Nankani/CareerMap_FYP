import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import useChatUnreadCount from '../hooks/useChatUnreadCount'
import CheckoutModal from '../components/CheckoutModal'
import '../styles/Cart.css'
import '../styles/logoAnimations.css'

function Cart() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart()
  const chatUnreadCount = useChatUnreadCount()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenChatDrawer = () => {
    navigate('/dashboard?chat=open')
  }

  const formatPrice = (price) => {
    return `PKR ${price.toLocaleString()}`
  }

  const totalPrice = getTotalPrice()

  return (
    <div className="cart-page">
     
      <header className="dashboard-header">
        <div className="container header-inner">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
            <div className="logo-brand-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: '1.15' }}>
              <span className="logo-text" style={{ fontSize: '30px', fontWeight: '800', color: '#5c4a3d', letterSpacing: '-0.5px' }}>CareerMap</span>
              <span className="logo-tagline" style={{ fontSize: '11px', fontWeight: '600', color: '#8b6e58', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Find Your Way. Own Your Future.</span>
            </div>
          </div>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          
          <nav className={`nav-links reveal ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/universities" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Universities
            </Link>
            <Link to="/mentorship" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Mentorship
            </Link>
            <Link to="/marketplace" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              MarketPlace
            </Link>
            {user?.isAdmin && (
              <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </Link>
            )}
          </nav>

          <div className="nav-actions reveal">
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name || 'User'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                logout
              </button>
            </div>
          </div>
        </div>
      </header>

     
      <section className="cart-content">
        <div className="container">
          <div className="cart-header">
            <button className="btn-back" onClick={() => navigate('/marketplace')}>
              <ArrowLeft size={18} />
              Back to Marketplace
            </button>
            <h1>Shopping Cart</h1>
            <span className="cart-badge">{cartItems.length} items</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart-container">
              <div className="empty-state-content">
                <p style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>🛒</p>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#333' }}>Your cart is empty</h2>
                <p style={{ fontSize: '0.95rem', color: '#666', margin: '0 0 2rem 0' }}>Add items to get started</p>
                <Link to="/marketplace" style={{ 
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  background: '#a78b71',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-main-layout">
              
              <div className="cart-items-table">
                <div className="cart-table-header">
                  <div className="col-product">PRODUCT DETAILS</div>
                  <div className="col-quantity">QUANTITY</div>
                  <div className="col-price">PRICE</div>
                  <div className="col-total">TOTAL</div>
                  <div className="col-action"></div>
                </div>

                {cartItems.map(item => (
                  <div key={item._id} className="cart-table-row">
                    <div className="col-product">
                      <div className="product-info">
                        <img
                          src={item.image || '/images/placeholder.jpg'}
                          alt={item.title}
                          className="product-img"
                        />
                        <div className="product-details">
                          <h4 className="product-name">{item.title}</h4>
                          <p className="product-meta">
                            {item.location?.city}
                            {item.location?.area ? ` • ${item.location.area}` : ''}
                          </p>
                          <span className="product-condition">
                            {item.condition === 'New' ? '🟢' : '🟡'} {item.condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-quantity">
                      <div className="qty-control">
                        <button
                          className="qty-btn-table"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-value-table">{item.quantity}</span>
                        <button
                          className="qty-btn-table"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="col-price">
                      <span className="price-text">{formatPrice(item.price)}</span>
                    </div>

                    <div className="col-total">
                      <span className="total-text">{formatPrice(item.price * item.quantity)}</span>
                    </div>

                    <div className="col-action">
                      <button
                        className="btn-remove-row"
                        onClick={() => removeFromCart(item._id)}
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="cart-footer-actions">
                  <Link to="/marketplace" className="link-continue-shopping">
                    ← Continue Shopping
                  </Link>
                  <button className="btn-clear-cart-table" onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="order-summary-sidebar">
                <div className="summary-header-row">
                  <div>
                    <span className="summary-label">ITEMS</span>
                    <span className="summary-count">{cartItems.length}</span>
                  </div>
                  <div className="summary-subtotal">
                    <span className="summary-amount">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="summary-section">
                  <label className="summary-section-label">SHIPPING</label>
                  <div className="shipping-option">
                    <span>Standard Delivery</span>
                    <span className="shipping-price">PKR 300</span>
                  </div>
                </div>

                <div className="summary-section">
                  <label className="summary-section-label">PROMO CODE</label>
                  <div className="promo-input-group">
                    <input
                      type="text"
                      className="promo-input"
                      placeholder="Enter your code"
                    />
                    <button className="btn-apply-promo">APPLY</button>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total-section">
                  <span className="total-cost-label">TOTAL COST</span>
                  <span className="total-cost-amount">{formatPrice(totalPrice)}</span>
                </div>

                <button className="btn-checkout-table" onClick={() => setCheckoutModalOpen(true)}>
                  CHECKOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        items={cartItems}
        subtotal={totalPrice}
      />
    </div>
  )
}

export default Cart
