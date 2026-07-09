import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useChatUnreadCount from '../hooks/useChatUnreadCount'
import api from '../utils/api'
import '../styles/SellItem.css'
import '../styles/logoAnimations.css'

function SellItem() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const chatUnreadCount = useChatUnreadCount()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [previews, setPreviews] = useState([])
  const [checkingSellerStatus, setCheckingSellerStatus] = useState(true)
  const hasVerified = useRef(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: 'New',
    location: {
      city: user?.city || '',
      area: ''
    },
    image: '',
    images: []
  })

  useEffect(() => {
    const verifySellerStatus = async () => {
      if (hasVerified.current) return
      
      try {
        setCheckingSellerStatus(true)
        const data = await api.get('/sellers/my-subscription')
        
        if (data.success && data.hasActiveSubscription) {
          hasVerified.current = true
          // If active, dynamically sync context state so they have access!
          if (!user?.isSeller) {
            updateUser({ isSeller: true })
          }
          fetchCategories()
        } else {
          showToast('You must be a verified seller to list products. Please subscribe first.', 'warning')
          navigate('/marketplace')
        }
      } catch (error) {
        console.error('Failed to verify seller status:', error)
        // Fallback to local profile state check if API is down
        if (user && !user.isSeller) {
          showToast('You must be a verified seller to list products. Please subscribe first.', 'warning')
          navigate('/marketplace')
        } else {
          hasVerified.current = true
          fetchCategories()
        }
      } finally {
        setCheckingSellerStatus(false)
      }
    }

    if (user) {
      verifySellerStatus()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      const data = await api.get('/marketplace/categories/all')
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      showToast('Failed to load categories', 'error')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenChatDrawer = () => {
    navigate('/dashboard?chat=open')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'city' || name === 'area') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleImageUpload = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newPreviews = []
      const newImages = []
      let loadedCount = 0
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result)
          newImages.push(reader.result)
          loadedCount++
          
          if (loadedCount === files.length) {
            setFormData(prev => {
              const updatedImages = [...prev.images, ...newImages]
              return {
                ...prev,
                image: updatedImages[0] || '',
                images: updatedImages
              }
            })
            setPreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    const newImages = formData.images.filter((_, i) => i !== index)
    
    setFormData(prev => ({
      ...prev,
      image: newImages[0] || '',
      images: newImages
    }))
    setPreviews(newPreviews)
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error')
      return false
    }
    if (!formData.description.trim()) {
      showToast('Description is required', 'error')
      return false
    }
    if (!formData.category) {
      showToast('Category is required', 'error')
      return false
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      showToast('Valid price is required', 'error')
      return false
    }
    if (!formData.location.city.trim()) {
      showToast('City/Area is required', 'error')
      return false
    }
    if (!formData.image && formData.images.length === 0) {
      showToast('At least one product image is required', 'error')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        condition: formData.condition,
        location: {
          city: formData.location.city,
          area: formData.location.area
        },
        image: formData.image,
        images: formData.images.length > 0 ? formData.images : [formData.image]
      }

      const data = await api.post('/marketplace', payload)

      showToast('Item listed successfully!', 'success')
      navigate('/marketplace')
    } catch (error) {
      console.error('Error creating listing:', error)
      showToast(error.message || 'Failed to create listing', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/marketplace')
  }

  if (checkingSellerStatus) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf8f5', gap: '1rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ color: '#a78b71', fontSize: '2.5rem' }}></i>
        <p style={{ color: '#7a5e44', fontWeight: '600', fontSize: '1.1rem' }}>Verifying seller credentials...</p>
      </div>
    )
  }

  return (
    <div className="sell-item-page">
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
          </nav>

          <div className="nav-actions reveal">
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.fullName || 'User'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  user?.fullName?.charAt(0).toUpperCase()
                )}
              </Link>

              <button className="btn-logout" onClick={handleLogout}>
                logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="sell-item-main">
        <div className="container">
          <div className="sell-item-wrapper">
            {/* Form Card */}
            <form className="tutor-application-form-card" onSubmit={handleSubmit}>
              {/* Form Header */}
              <div className="tutor-app-form-header">
                <h3>
                  <i className="fas fa-box"></i> List Your Item for Sale
                </h3>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Back to Marketplace
                </button>
              </div>

              {/* Form Grid */}
              <div className="tutor-app-form-grid">
                {/* Seller Info Section */}
                <div className="info-item">
                  <label className="info-label">Full Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="form-input"
                  />
                </div>

                <div className="info-item">
                  <label className="info-label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input"
                  />
                </div>

                <div className="info-item">
                  <label className="info-label">Phone</label>
                  <input
                    type="tel"
                    value={user?.phone || ''}
                    disabled
                    className="form-input"
                  />
                </div>

                {/* Product Info Section */}
                <div className="info-item full-width">
                  <label className="info-label">Product Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., MacBook Pro 2021"
                    className="form-input"
                    required
                  />
                </div>

                <div className="info-item full-width">
                  <label className="info-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your product in detail..."
                    rows="4"
                    className="form-input tutor-bio-input"
                    required
                  ></textarea>
                </div>

                <div className="info-item">
                  <label className="info-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="info-item">
                  <label className="info-label">Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>

                <div className="info-item">
                  <label className="info-label">Price (PKR) *</label>
                  <div className="price-input-wrapper">
                    <span className="price-prefix">PKR</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="info-item">
                  <label className="info-label">City/Area *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Karachi"
                    className="form-input"
                    required
                  />
                </div>

                <div className="info-item">
                  <label className="info-label">Area/Neighborhood</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.location.area}
                    onChange={handleInputChange}
                    placeholder="e.g., Defence"
                    className="form-input"
                  />
                </div>

                {/* Image Upload */}
                <div className="info-item full-width">
                  <label className="info-label">Product Images * (Multiple images supported)</label>
                  <div className="image-upload-section">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="file-input"
                    />
                    <label htmlFor="image" className="image-upload-label">
                      <i className="fas fa-cloud-arrow-up"></i>
                      <span>Click to upload or drag and drop</span>
                      <span className="upload-hint">Select one or more images (PNG, JPG, GIF up to 10MB each)</span>
                    </label>

                    {previews.length > 0 && (
                      <div className="image-previews-container">
                        {previews.map((preview, idx) => (
                          <div key={idx} className="image-preview-container">
                            <img src={preview} alt={`Product preview ${idx + 1}`} />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => removeImage(idx)}
                              title="Remove image"
                            >
                              <Trash2 size={16} />
                            </button>
                            {idx === 0 && <span className="primary-badge">Primary</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="card-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={loading} style={{ background: 'linear-gradient(135deg, #a78b71, #634f37)', color: 'white', border: 'none' }}>
                  {loading ? 'Listing...' : 'List Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SellItem
