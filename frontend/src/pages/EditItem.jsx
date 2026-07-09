import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { MessageCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useChatUnreadCount from '../hooks/useChatUnreadCount'
import { getAuthToken } from '../utils/authStorage'
import { API_BASE_URL } from '../utils/api'

import '../styles/SellItem.css'
import '../styles/logoAnimations.css'

function EditItem() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const { showToast } = useToast()
  const chatUnreadCount = useChatUnreadCount()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [previews, setPreviews] = useState([])
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
    fetchCategories()
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/marketplace/categories/all`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      showToast('Failed to load categories', 'error')
    }
  }

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/marketplace/${id}`)
      const data = await response.json()
      if (data.success) {
        const p = data.data
        setFormData({
          title: p.title || '',
          description: p.description || '',
          category: p.category || '',
          price: p.price || '',
          condition: p.condition || 'New',
          location: {
            city: p.location?.city || '',
            area: p.location?.area || ''
          },
          image: p.image || '',
          images: p.images || []
        })
        if (p.images && p.images.length > 0) {
          setPreviews(p.images)
        } else if (p.image) {
          setPreviews([p.image])
        }
      } else {
        showToast('Failed to load product', 'error')
        navigate('/marketplace')
      }
    } catch (err) {
      console.error(err)
      showToast('Error loading product', 'error')
    } finally {
      setLoading(false)
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
      const token = getAuthToken()
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

      const response = await fetch(`${API_BASE_URL}/marketplace/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product')
      }

      showToast('Product updated successfully!', 'success')
      
      setTimeout(() => {
        navigate('/marketplace')
      }, 1500)
    } catch (error) {
      console.error('Error updating product:', error)
      showToast(error.message || 'Failed to update product', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/marketplace')
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
                  <i className="fas fa-edit"></i> Edit Product
                </h3>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Back to Marketplace
                </button>
              </div>

              {/* Form Grid */}
              <div className="tutor-app-form-grid">
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
                <button type="submit" className="btn-save" disabled={loading} style={{ background: '#634f37', color: 'white', border: 'none' }}>
                  <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                  {loading ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EditItem
