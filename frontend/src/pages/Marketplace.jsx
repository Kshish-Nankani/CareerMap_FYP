import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, ShoppingBag, TrendingUp, Search, Filter, LoaderCircle, ShoppingCart, ShieldCheck, Lock, Crown, Phone, User, Briefcase, IdCard, GraduationCap, Clock3, Globe, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCart } from '../contexts/CartContext'
import useChatUnreadCount from '../hooks/useChatUnreadCount'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/Dashboard.css'
import '../styles/Marketplace.css'
import '../styles/logoAnimations.css'

function Marketplace() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { addToCart, getTotalItems } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const chatUnreadCount = useChatUnreadCount()

  // Seller Subscription States
  const [sellerSubscription, setSellerSubscription] = useState(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [showSubscriptionSelector, setShowSubscriptionSelector] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [selectedSecurityPlan, setSelectedSecurityPlan] = useState(null)
  const [securityFormData, setSecurityFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cnic: '',
    socialMediaLink: '',
    sellerType: '',
    cnicFrontImage: '',
    cnicBackImage: '',
    selfieWithCnic: ''
  })

  // Product listing states
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  // Categories and filters
  const categories = ['Textbooks', 'Notes', 'Lab Materials', 'Stationery', 'Electronics', 'Other']
  const conditions = ['New', 'Used']
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'All']
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Best Rated' }
  ]

  // Fetch products
  useEffect(() => {
    fetchProducts()
  }, [page, searchTerm, selectedCategory, selectedCondition, selectedCity, sortBy])

  const fetchSellerSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const response = await api.get('/sellers/my-subscription')
      setSellerSubscription(response)
      
      // Auto-sync isSeller profile flag with database state
      if (response && response.hasActiveSubscription && !user?.isSeller) {
        updateUser({ isSeller: true })
      } else if (response && !response.hasActiveSubscription && user?.isSeller) {
        updateUser({ isSeller: false })
      }
    } catch (error) {
      console.error('Error fetching seller subscription:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSellerSubscription()
    }
  }, [user])

  const handleSelectMediaFile = (e, field) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('Uploaded picture must be less than 5MB', 'warning')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setSecurityFormData((prev) => ({
        ...prev,
        [field]: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleOpenSecurityVerification = (planType) => {
    setSelectedSecurityPlan(planType)
    setSecurityFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      cnic: '',
      socialMediaLink: '',
      sellerType: '',
      cnicFrontImage: '',
      cnicBackImage: '',
      selfieWithCnic: ''
    })
    setShowSecurityModal(true)
  }

  const handlePurchaseSubscription = async (planType) => {
    handleOpenSecurityVerification(planType)
  }

  const handleSellClick = () => {
    if (!sellerSubscription || !sellerSubscription.hasActiveSubscription) {
      showToast('Please purchase a seller membership plan.', 'info')
      const el = document.getElementById('seller-pricing-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      return
    }

    if ((sellerSubscription.productsRemaining ?? 0) <= 0) {
      showToast(`You've used all ${sellerSubscription.productsLimit} product listings of your plan. Please purchase a plan to continue.`, 'warning')
      const el = document.getElementById('seller-pricing-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      return
    }

    navigate('/marketplace/sell')
  }

  const handleSubmitSecurityForm = async (e) => {
    e.preventDefault()
    
    const { fullName, email, phone, cnic, socialMediaLink, sellerType, cnicFrontImage, cnicBackImage, selfieWithCnic } = securityFormData
    if (!fullName || !email || !phone || !cnic || !sellerType || !cnicFrontImage || !cnicBackImage || !selfieWithCnic) {
      showToast('All verification details and image uploads are required.', 'warning')
      return
    }

    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
    if (!cnicRegex.test(cnic.trim())) {
      showToast('Please enter a valid CNIC in 12345-1234567-1 format.', 'warning')
      return
    }

    // Phone number should not contain letters
    if (/[a-zA-Z]/.test(phone)) {
      showToast('Contact phone number must not contain letters.', 'warning')
      return
    }

    try {
      setLoading(true)
      showToast('Registering seller security application...', 'info')
      
      const payload = {
        planType: selectedSecurityPlan,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        socialMediaLink: socialMediaLink.trim(),
        sellerType,
        cnicFrontImage,
        cnicBackImage,
        selfieWithCnic
      }

      const response = await api.post('/sellers/subscribe', payload)
      
      if (response?.success && response.paymentRequired && response.redirectUrl && response.fields) {
        showToast('Verification details recorded. Redirecting to PayFast payment sandbox...', 'success')
        
        setTimeout(() => {
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = response.redirectUrl
          form.style.display = 'none'

          Object.entries(response.fields).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = value
            form.appendChild(input)
          })

          document.body.appendChild(form)
          form.submit()
        }, 1500)
      } else {
        showToast(response?.message || 'Failed to initialize seller payment checkout.', 'error')
      }
    } catch (error) {
      console.error('Seller subscription payment checkout error:', error)
      showToast(error.message || 'Failed to initialize subscription checkout', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 12)
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedCondition) params.append('condition', selectedCondition)
      if (selectedCity && selectedCity !== 'All') params.append('city', selectedCity)
      params.append('sortBy', sortBy)

      const response = await api.get(`/marketplace?${params.toString()}`)

      if (response.success) {
        setProducts(response.data)
        setTotalPages(response.pagination.totalPages)
      } else {
        showToast('Failed to fetch products', 'error')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      showToast('Error loading products', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    addToCart(product)
    showToast(`${product.title} added to cart`, 'success')
  }

  const handleViewDetails = (productId) => {
    navigate(`/marketplace/${productId}`)
  }

  const handleEditProduct = (productId) => {
    navigate(`/marketplace/edit/${productId}`)
  }

  const handleDeleteProduct = (productId) => {
    setProductToDelete(productId)
    setIsConfirmModalOpen(true)
  }

  const confirmDeleteProduct = async () => {
    setIsConfirmModalOpen(false)
    if (productToDelete) {
      try {
        const response = await api.delete(`/marketplace/${productToDelete}`)
        if (response.success) {
          showToast('Product deleted successfully', 'success')
          fetchProducts() // Refresh the list
        } else {
          showToast(response.message || 'Failed to delete product', 'error')
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        showToast('Error deleting product', 'error')
      } finally {
        setProductToDelete(null)
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenChatDrawer = () => {
    navigate('/dashboard?chat=open')
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedCondition('')
    setSelectedCity('')
    setSortBy('newest')
    setPage(1)
  }

  return (
    <div className="marketplace-page">
      {/* Header */}
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
            <Link to="/marketplace" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>
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

      {/* Landing Hero Section */}
      <section className="marketplace-landing-hero">
        {/* Decorative orbs */}
        <div className="mp-orb mp-orb-1" />
        <div className="mp-orb mp-orb-2" />
        <div className="mp-orb mp-orb-3" />

        <div className="container">
          <div className="marketplace-hero-inner">
            {/* ── Left: Heading + CTAs + Stats ── */}
            <div className="marketplace-hero-content">
              <div className="hero-badge-pill">
                <ShoppingBag size={13} />
                <span>Peer-to-Peer Marketplace</span>
              </div>

              <h1 className="marketplace-landing-title">
                Student{' '}
                <span className="marketplace-title-accent">Marketplace</span>
              </h1>

              <p className="marketplace-landing-desc">
                Buy & sell used study essentials at affordable prices. Connect with students in your community and find great deals on textbooks, notes, and learning materials.
              </p>

              <div className="marketplace-cta-row">
                <button
                  className="marketplace-btn-primary"
                  onClick={() => {
                    const el = document.querySelector('.marketplace-content')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <ShoppingBag size={16} />
                  Browse Items
                </button>
                {sellerSubscription?.hasActiveSubscription && (sellerSubscription?.productsRemaining ?? 1) > 0 ? (
                  <button
                    className="marketplace-btn-secondary"
                    onClick={handleSellClick}
                  >
                    <TrendingUp size={16} />
                    Got something to sell?
                    <i className="fas fa-crown text-yellow-400" style={{ marginLeft: '6px', color: '#ffd700' }}></i>
                  </button>
                ) : (
                  <button
                    className="marketplace-btn-secondary"
                    onClick={handleSellClick}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#a0aec0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: 0.95
                    }}
                    title="Purchase a Membership Plan to sell items"
                  >
                    <Lock size={16} style={{ color: '#a0aec0', marginRight: '4px' }} />
                    Become a Seller {sellerSubscription?.hasActiveSubscription ? '(Quota Full)' : '(Locked)'}
                  </button>
                )}
              </div>

              {/* Stats strip */}
              <div className="marketplace-stats-strip">
                <div className="marketplace-stat">
                  <span className="mpstat-num">500+</span>
                  <span className="mpstat-label">Active Listings</span>
                </div>
                <div className="mpstat-sep" />
                <div className="marketplace-stat">
                  <span className="mpstat-num">1000+</span>
                  <span className="mpstat-label">Happy Buyers</span>
                </div>
                <div className="mpstat-sep" />
                <div className="marketplace-stat">
                  <span className="mpstat-num">4.7★</span>
                  <span className="mpstat-label">Avg Rating</span>
                </div>
              </div>
            </div>

            {/* ── Right: Hero Image Placeholder ── */}
            <div className="marketplace-hero-visual">
              <div className="marketplace-hero-card">
                <div className="mhc-icon">
                  <ShoppingBag size={64} />
                </div>
                <div className="mhc-text">
                  <div className="mhc-title">Save Big</div>
                  <div className="mhc-subtitle">Get affordable study materials</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marketplace Onboarding: How It Works Section ── */}
      <section className="how-it-works" style={{ background: '#ffffff', padding: '5rem 0 4.5rem', borderBottom: '1px solid rgba(167, 139, 113, 0.14)' }}>
        <div className="container">
          <div className="hiw-head" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="hiw-eyebrow">Simple Process</span>
            <h2 className="hiw-title">How It Works</h2>
            <p className="hiw-subtitle">Become a verified marketplace seller and start trading in three easy steps</p>
          </div>

          <div className="hiw-steps">
            {/* Step 1 */}
            <div className="hiw-card">
              <div className="hiw-card-header">
                <div className="hiw-icon hiw-icon-1">
                  <Crown size={26} />
                </div>
                <div className="hiw-card-title-group">
                  <span className="hiw-step-num">01</span>
                  <h3 className="hiw-step-title">Choose a Plan</h3>
                </div>
              </div>
              <p className="hiw-step-desc">
                Select a premium seller plan (Basic, Standard, or Premium) that fits your inventory slot requirements.
              </p>
            </div>

            <div className="hiw-connector" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>

            {/* Step 2 */}
            <div className="hiw-card">
              <div className="hiw-card-header">
                <div className="hiw-icon hiw-icon-2">
                  <ShieldCheck size={26} />
                </div>
                <div className="hiw-card-title-group">
                  <span className="hiw-step-num">02</span>
                  <h3 className="hiw-step-title">Submit Verification</h3>
                </div>
              </div>
              <p className="hiw-step-desc">
                Fill out the secure verification form with your CNIC and a live selfie to verify your student identity.
              </p>
            </div>

            <div className="hiw-connector" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>

            {/* Step 3 */}
            <div className="hiw-card">
              <div className="hiw-card-header">
                <div className="hiw-icon hiw-icon-3">
                  <ShoppingBag size={26} />
                </div>
                <div className="hiw-card-title-group">
                  <span className="hiw-step-num">03</span>
                  <h3 className="hiw-step-title">List & Earn</h3>
                </div>
              </div>
              <p className="hiw-step-desc">
                Once approved, list your academic gear, books, or notes and start trading directly with campus peers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seller Subscription Plans Section (Dynamic Inline Section) ── */}
      <section className="how-it-works" id="seller-pricing-section" style={{ background: '#faf7f2', padding: '5rem 0', borderTop: '1px solid #f0eae1' }}>
        <div className="container">
          <div className="hiw-head" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="hiw-eyebrow" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78b71', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Unlock Selling</span>
            <h2 className="hiw-title" style={{ fontSize: '2.25rem', fontWeight: '800', color: '#2d3748', margin: '0 0 1rem 0' }}>Seller Membership Plans</h2>
            <p className="hiw-subtitle" style={{ fontSize: '1.05rem', color: '#718096', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              Verify your security credentials and subscribe to a seller tier to list textbooks, lab materials, stationery, or electronics.
            </p>
          </div>

          {sellerSubscription?.subscription?.status === 'pending_review' ? (
            <div 
              style={{ 
                background: 'rgba(250, 247, 242, 0.9)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid #e2dcd5', 
                borderRadius: '24px', 
                padding: '3rem', 
                textAlign: 'center', 
                maxWidth: '800px', 
                margin: '0 auto', 
                boxShadow: '0 10px 30px rgba(167, 139, 113, 0.08)' 
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '70px', 
                  height: '70px', 
                  background: '#faf7f2', 
                  borderRadius: '50%', 
                  margin: '0 auto 1.5rem auto' 
                }}
              >
                <Clock3 size={36} style={{ color: '#a78b71' }} />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: '#7a5e44', fontWeight: '700', marginBottom: '1rem' }}>
                Application Under Admin Review
              </h3>
              <p style={{ color: '#4a5568', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Thank you for submitting your security verification. Your seller subscription application is currently being reviewed by the CareerMap Admin Team.
              </p>
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.5rem', background: '#fff', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid #f0eae1', textAlign: 'left' }}>
                <div style={{ fontSize: '0.95rem', color: '#718096' }}><strong>Verification Details:</strong></div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Name: {sellerSubscription.subscription.fullName}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• CNIC: {sellerSubscription.subscription.cnic}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Phone: {sellerSubscription.subscription.phone}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Seller Type: <span style={{ textTransform: 'capitalize' }}>{sellerSubscription.subscription.sellerType.replace('_', ' ')}</span></div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Tier: <span style={{ textTransform: 'capitalize' }}>{sellerSubscription.subscription.planType}</span></div>
              </div>
              <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '1.5rem' }}>
                We will send an email notification once the security checks are completed and your seller onboarding is unlocked.
              </p>
            </div>
          ) : sellerSubscription?.subscription?.status === 'active' ? (
            <div 
              style={{ 
                background: 'rgba(245, 247, 244, 0.9)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid #d3dbd1', 
                borderRadius: '24px', 
                padding: '3rem', 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '3rem',
                alignItems: 'center',
                maxWidth: '1000px', 
                margin: '0 auto', 
                boxShadow: '0 10px 30px rgba(89, 108, 86, 0.08)' 
              }}
            >
              {/* Left Column: Content */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '70px', 
                    height: '70px', 
                    background: '#f1f4f0', 
                    borderRadius: '50%', 
                    marginBottom: '1.5rem' 
                  }}
                >
                  <ShieldCheck size={36} style={{ color: '#596c56' }} />
                </div>
                <h3 style={{ fontSize: '1.6rem', color: '#3d4f3b', fontWeight: '700', marginBottom: '1rem', textAlign: 'left' }}>
                  Your Seller Membership is Active
                </h3>
                <p style={{ color: '#4a5568', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem', textAlign: 'left' }}>
                  Your security credentials are verified. List your products below — each active listing uses one slot from your membership quota.
                </p>
                {(sellerSubscription.productsRemaining ?? 0) > 0 ? (
                  <button 
                    onClick={() => navigate('/marketplace/sell')}
                    className="marketplace-btn-primary"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      padding: '0.9rem 2.5rem', 
                      fontSize: '1.05rem', 
                      border: 'none', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', 
                      color: '#fff', 
                      cursor: 'pointer', 
                      fontWeight: '700', 
                      boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' 
                    }}
                  >
                    <Crown size={18} style={{ color: '#FFD700', marginRight: '6px' }} />
                    List a New Product
                  </button>
                ) : (
                  <div>
                    <p style={{ color: '#e53e3e', fontWeight: '600', fontSize: '1rem', marginBottom: '1.5rem' }}>
                      You have used all your product listing slots. Purchase a new subscription to add more listings.
                    </p>
                    <button 
                      onClick={() => setShowSubscriptionSelector(true)}
                      className="marketplace-btn-primary"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        padding: '0.9rem 2.5rem', 
                        fontSize: '1.05rem', 
                        border: 'none', 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', 
                        color: '#fff', 
                        cursor: 'pointer', 
                        fontWeight: '700', 
                        boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' 
                      }}
                    >
                      <Crown size={18} style={{ color: '#FFD700', marginRight: '6px' }} />
                      Get More Listings
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Plan Tier</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2d3748', textTransform: 'capitalize' }}>{sellerSubscription.subscription.planType}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Total Quota</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2d3748' }}>{sellerSubscription.productsLimit} Listings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Slots Used</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: (sellerSubscription.productsUsed >= sellerSubscription.productsLimit) ? '#e53e3e' : '#596c56' }}>{sellerSubscription.productsUsed} / {sellerSubscription.productsLimit}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Slots Remaining</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: (sellerSubscription.productsRemaining ?? 0) > 0 ? '#596c56' : '#e53e3e' }}>{sellerSubscription.productsRemaining ?? 0} Remaining</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="subscription-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
              {/* Basic Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Basic Seller</h3>
                  <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>Perfect for selling a few books or notes</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 2,500</span>
                  <span style={{ fontSize: '0.95rem', color: '#718096', marginLeft: '0.25rem' }}>/ month</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#4A5568', textAlign: 'left' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                          <span>List up to <strong>10 products</strong></span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                          <span>Direct buyer-seller chat support</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                          <span>Active presence in Marketplace</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                          <span>Membership valid for 30 days</span>
                        </li>
                      </ul>
                      <button 
                        onClick={() => handlePurchaseSubscription('basic')}
                        disabled={loading}
                        style={{ width: '100%', padding: '0.95rem 1.25rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                      >
                        Subscribe Basic
                      </button>
                    </div>

              {/* Standard Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '2px solid #a78b71', borderRadius: '24px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 40px rgba(167, 139, 113, 0.08)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ position: 'absolute', top: '-15px', right: '30px', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Best Value
                </div>
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Standard Seller</h3>
                  <p style={{ fontSize: '0.9rem', color: '#a78b71', margin: 0, fontWeight: '600' }}>Ideal for student sellers & small campus businesses</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 5,000</span>
                  <span style={{ fontSize: '0.95rem', color: '#718096', marginLeft: '0.25rem' }}>/ month</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#4A5568', textAlign: 'left' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>List up to <strong>20 products</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Higher placement in search queries</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Direct buyer-seller chat support</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Membership valid for 30 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('standard')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.95rem 1.25rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                >
                  Subscribe Standard
                </button>
              </div>

              {/* Premium Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Premium Seller</h3>
                  <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>For high-volume student-led businesses</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 7,000</span>
                  <span style={{ fontSize: '0.95rem', color: '#718096', marginLeft: '0.25rem' }}>/ month</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#4A5568', textAlign: 'left' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>List up to <strong>50 products</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Verified Seller premium badge profile</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Direct buyer-seller chat support</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Membership valid for 30 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('premium')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.95rem 1.25rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                >
                  Subscribe Premium
                </button>
              </div>
            </div>
            )}
        </div>
      </section>

      {/* Marketplace Content Section */}
      <section className="marketplace-content">
        <div className="container">
          {/* Filters Section */}
          <div className="marketplace-filters">
            <div className="filters-header">
              <h2><Filter size={20} /> Filters & Search</h2>
              <button className="btn-reset-filters" onClick={handleResetFilters}>
                Reset Filters
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            {/* Filter Options */}
            <div className="filter-options">
              {/* Category Filter */}
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div className="filter-group">
                <label>Condition</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => {
                    setSelectedCondition(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All Conditions</option>
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div className="filter-group">
                <label>City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    setPage(1)
                  }}
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Sort Option */}
              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setPage(1)
                  }}
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-section">
            {loading ? (
              <div className="loading-container">
                <LoaderCircle className="spinner" size={40} />
                <p>Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="products-header">
                  <h2>Available Products</h2>
                  <span className="products-count">{products.length} items found</span>
                </div>

                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                      user={user}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn-pagination"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <div className="pagination-info">
                      Page {page} of {totalPages}
                    </div>
                    <button
                      className="btn-pagination"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-products">
                <ShoppingBag size={48} />
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button className="btn-reset-filters" onClick={handleResetFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>




      {/* Floating Cart Button */}
      <Link
        to="/marketplace/cart"
        className="floating-cart-button"
        title="View shopping cart"
      >
        <ShoppingCart size={24} aria-hidden="true" />
        {getTotalItems() > 0 && (
          <span className="floating-cart-badge">{getTotalItems() > 99 ? '99+' : getTotalItems()}</span>
        )}
      </Link>

      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDeleteProduct}
        onCancel={() => {
          setIsConfirmModalOpen(false)
          setProductToDelete(null)
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Seller Subscription pricing selector modal */}
      {showSubscriptionSelector && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionSelector(false)}>
          <div className="modal-content subscription-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', background: 'rgba(255, 255, 255, 0.98)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Crown size={28} style={{ color: '#a78b71' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2d3748' }}>Become a Marketplace Seller</h2>
              </div>
              <button className="close-btn" style={{ fontSize: '2rem', padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#a0aec0' }} onClick={() => setShowSubscriptionSelector(false)}>
                ×
              </button>
            </div>
            
            <p style={{ color: '#718096', fontSize: '0.95rem', marginBottom: '2rem', marginTop: '0.25rem' }}>
              Select a premium seller plan to list textbooks, lab items, notes, or stationery. Buy a subscription quota to start trading directly.
            </p>

            <div className="subscription-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {/* Basic Tier */}
              <div className="pricing-card" style={{ border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', background: '#fff', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#4a5568' }}>Basic Seller</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748' }}>2,500 <span style={{ fontSize: '1rem', fontWeight: '600' }}>PKR</span></div>
                <div style={{ fontSize: '0.95rem', color: '#718096' }}>Quota: <strong>10 Products</strong></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', fontSize: '0.85rem', color: '#718096', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>✓ List up to 10 products</li>
                  <li>✓ Textbooks, notes & stationary</li>
                  <li>✓ Direct buyer-seller chat</li>
                  <li>✓ Active for 30 days</li>
                </ul>
                <button className="btn-primary" onClick={() => { setShowSubscriptionSelector(false); handlePurchaseSubscription('basic'); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: '700', background: '#a78b71', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  Subscribe Now
                </button>
              </div>

              {/* Standard Tier */}
              <div className="pricing-card standard-tier" style={{ border: '2px solid #a78b71', borderRadius: '20px', padding: '1.75rem', background: '#fff', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', transform: 'scale(1.03)', boxShadow: '0 8px 24px rgba(167,139,113,0.15)' }}>
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#a78b71', color: '#fff', fontSize: '0.75rem', padding: '2px 12px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>Most Popular</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#a78b71' }}>Standard Seller</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748' }}>5,000 <span style={{ fontSize: '1rem', fontWeight: '600' }}>PKR</span></div>
                <div style={{ fontSize: '0.95rem', color: '#718096' }}>Quota: <strong>20 Products</strong></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', fontSize: '0.85rem', color: '#718096', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>✓ List up to 20 products</li>
                  <li>✓ Higher priority in search results</li>
                  <li>✓ Direct buyer-seller chat</li>
                  <li>✓ Active for 30 days</li>
                </ul>
                <button className="btn-primary" onClick={() => { setShowSubscriptionSelector(false); handlePurchaseSubscription('standard'); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: '700', background: 'linear-gradient(135deg, #a78b71, #634f37)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  Subscribe Now
                </button>
              </div>

              {/* Premium Tier */}
              <div className="pricing-card" style={{ border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', background: '#fff', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#4a5568' }}>Premium Seller</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748' }}>7,000 <span style={{ fontSize: '1rem', fontWeight: '600' }}>PKR</span></div>
                <div style={{ fontSize: '0.95rem', color: '#718096' }}>Quota: <strong>50 Products</strong></div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', fontSize: '0.85rem', color: '#718096', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>✓ List up to 50 products</li>
                  <li>✓ High volume small businesses</li>
                  <li>✓ Verified Seller badge</li>
                  <li>✓ Active for 30 days</li>
                </ul>
                <button className="btn-primary" onClick={() => { setShowSubscriptionSelector(false); handlePurchaseSubscription('premium'); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: '700', background: '#a78b71', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          {showSecurityModal && (
        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(26, 32, 44, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, padding: '1.5rem' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px', width: '100%', background: '#fff', borderRadius: '24px', padding: '2.5rem', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', border: '1px solid rgba(167, 139, 113, 0.15)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <div style={{ background: '#faf5ee', borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={26} style={{ color: '#a78b71' }} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a202c', letterSpacing: '-0.02em', margin: 0 }}>Seller Verification Console</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>Protecting student safety through secure identity reviews</p>
                  <span style={{ background: '#ebf8ff', color: '#2b6cb0', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>128-bit Encrypted</span>
                </div>
              </div>
              <button className="close-btn" style={{ fontSize: '2rem', padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#a0aec0', transition: 'color 0.2s', marginTop: '-4px' }} onClick={() => setShowSecurityModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitSecurityForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* ── 2-Column Responsive Body Column Layout ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
                
                {/* ── Left Column: Personal Information ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <User size={16} style={{ color: '#a78b71' }} />
                      Personal Information
                    </h3>
                  </div>

                  {/* Full Name */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Full Name (As on CNIC) *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <User size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={securityFormData.fullName}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, fullName: e.target.value })}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* CNIC Number */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>CNIC Number (with dashes) *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <IdCard size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="text"
                        required
                        placeholder="12345-1234567-1"
                        value={securityFormData.cnic}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9-]*$/.test(val)) {
                            setSecurityFormData({ ...securityFormData, cnic: val });
                          }
                        }}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                    <small style={{ color: '#a0aec0', fontSize: '0.75rem', marginTop: '0.1rem', display: 'block' }}>Format: 12345-1234567-1</small>
                  </div>

                  {/* Phone */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Contact Phone Number *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <Phone size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="tel"
                        required
                        placeholder="03XXXXXXXXX"
                        value={securityFormData.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9]*$/.test(val)) {
                            setSecurityFormData({ ...securityFormData, phone: val });
                          }
                        }}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* Social Media Link */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Social Media Link (LinkedIn, Facebook, etc.)</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <Globe size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="url"
                        placeholder="https://facebook.com/yourprofile"
                        value={securityFormData.socialMediaLink}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, socialMediaLink: e.target.value })}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* Seller Type */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Seller Type *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <Briefcase size={16} style={{ color: '#a0aec0' }} />
                      <select
                        required
                        value={securityFormData.sellerType}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, sellerType: e.target.value })}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent', cursor: 'pointer' }}
                      >
                        <option value="">Select Type</option>
                        <option value="student">Student</option>
                        <option value="small_business">Small Business</option>
                        <option value="individual">Individual</option>
                      </select>
                    </div>
                  </div>

                  {/* Selected Tier */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Selected Tier</label>
                    <div className="input-shell" style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 0.85rem', background: '#f7fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Crown size={16} style={{ color: '#a78b71' }} />
                      <input
                        type="text"
                        disabled
                        value={String(selectedSecurityPlan || '').toUpperCase()}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#4a5568', background: 'transparent', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Identity Documents & Guidelines ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <IdCard size={16} style={{ color: '#a78b71' }} />
                      Identity Documents
                    </h3>
                  </div>

                  {/* CNIC Front & Back side-by-side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* CNIC Front Image */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>CNIC Front Image *</label>
                      <div className="verification-card-upload" style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '1rem', textAlign: 'center', background: '#fcfaf7', position: 'relative', minHeight: '135px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', overflow: 'hidden' }}>
                        {securityFormData.cnicFrontImage ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={securityFormData.cnicFrontImage} alt="CNIC Front" style={{ maxHeight: '110px', maxWidth: '100%', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }} />
                            <button type="button" onClick={() => setSecurityFormData({ ...securityFormData, cnicFrontImage: '' })} style={{ position: 'absolute', top: '0px', right: '0px', background: 'rgba(229, 62, 62, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>×</button>
                          </div>
                        ) : (
                          <div style={{ cursor: 'pointer' }}>
                            <Image size={22} style={{ color: '#a0aec0', marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: '700' }}>CNIC Front Side</div>
                            <div style={{ fontSize: '0.68rem', color: '#a0aec0', marginTop: '0.1rem' }}>Click or drag</div>
                            <input
                              type="file"
                              required
                              accept="image/*"
                              onChange={(e) => handleSelectMediaFile(e, 'cnicFrontImage')}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CNIC Back Image */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>CNIC Back Image *</label>
                      <div className="verification-card-upload" style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '1rem', textAlign: 'center', background: '#fcfaf7', position: 'relative', minHeight: '135px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', overflow: 'hidden' }}>
                        {securityFormData.cnicBackImage ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={securityFormData.cnicBackImage} alt="CNIC Back" style={{ maxHeight: '110px', maxWidth: '100%', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }} />
                            <button type="button" onClick={() => setSecurityFormData({ ...securityFormData, cnicBackImage: '' })} style={{ position: 'absolute', top: '0px', right: '0px', background: 'rgba(229, 62, 62, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>×</button>
                          </div>
                        ) : (
                          <div style={{ cursor: 'pointer' }}>
                            <Image size={22} style={{ color: '#a0aec0', marginBottom: '0.25rem' }} />
                            <div style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: '700' }}>CNIC Back Side</div>
                            <div style={{ fontSize: '0.68rem', color: '#a0aec0', marginTop: '0.1rem' }}>Click or drag</div>
                            <input
                              type="file"
                              required
                              accept="image/*"
                              onChange={(e) => handleSelectMediaFile(e, 'cnicBackImage')}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selfie / Live Photo with CNIC */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Selfie / Live Photo with CNIC *</label>
                    <div className="verification-card-upload" style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', background: '#fcfaf7', position: 'relative', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', overflow: 'hidden' }}>
                      {securityFormData.selfieWithCnic ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img src={securityFormData.selfieWithCnic} alt="Selfie with CNIC" style={{ maxHeight: '115px', maxWidth: '100%', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }} />
                          <button type="button" onClick={() => setSecurityFormData({ ...securityFormData, selfieWithCnic: '' })} style={{ position: 'absolute', top: '0px', right: '0px', background: 'rgba(229, 62, 62, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>×</button>
                        </div>
                      ) : (
                        <div style={{ cursor: 'pointer' }}>
                          <User size={24} style={{ color: '#a0aec0', marginBottom: '0.35rem' }} />
                          <div style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '700' }}>Selfie Holding ID</div>
                          <div style={{ fontSize: '0.72rem', color: '#a0aec0', marginTop: '0.15rem' }}>Hold ID clearly next to your face</div>
                          <input
                            type="file"
                            required
                            accept="image/*"
                            onChange={(e) => handleSelectMediaFile(e, 'selfieWithCnic')}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Guidelines to beautifully fill vertical space and remove whitespace */}
                  <div style={{ background: '#faf5ee', border: '1px dashed #e7dbcb', borderRadius: '14px', padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#634f37', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '700', color: '#a78b71', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} /> Submission Guidelines
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: '1.4', textAlign: 'left' }}>
                      <li>Please ensure all uploaded images are clear and text is legible.</li>
                      <li>CNIC details must match the full name entered on the left.</li>
                      <li>The selfie must show your face and the front of your CNIC held clearly next to it.</li>
                      <li>Supported formats: JPEG, PNG under 5MB per file.</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Secure statement disclaimer badge */}
              <div style={{ background: '#fcf8f2', border: '1px solid #f3e5d0', borderRadius: '14px', padding: '0.85rem 1.25rem', display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '0.25rem' }}>
                <ShieldCheck size={20} style={{ color: '#a78b71', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#7a5e44', lineHeight: '1.4', textAlign: 'left' }}>
                  <strong>🔒 Secure Identity Review:</strong> Your credentials are encrypted and strictly reviewed by the CareerMap Safety Operations team. Documents are verified solely to authorize your seller account and prevent fraudulent transactions, maintaining student community safety.
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowSecurityModal(false)} style={{ flex: 1, padding: '0.9rem', borderRadius: '14px', border: '1px solid #cbd5e0', color: '#4a5568', background: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1.5, padding: '0.9rem', borderRadius: '14px', border: 'none', color: '#fff', background: 'linear-gradient(135deg, #a78b71, #634f37)', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(167, 139, 113, 0.25)', transition: 'all 0.2s' }}>
                  <ShieldCheck size={18} />
                  {loading ? 'Processing...' : 'Submit Credentials & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-content">
            <div className="footer-section">
              <h4>CareerMap</h4>
              <p>Your trusted guide for academic and career success.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <div className="footer-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/mentorship">Mentorship</Link>
                <Link to="/marketplace">Marketplace</Link>
                <Link to="/profile">Profile</Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <div className="footer-links">
                <Link to="/help">Help Center</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="muted">© {new Date().getFullYear()} CareerMap Limited. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Marketplace
