import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MessageCircle, MapPin, Calendar, Tag, Package, User, ArrowLeft, Share2, Heart, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCart } from '../contexts/CartContext'
import useChatUnreadCount from '../hooks/useChatUnreadCount'
import { getAuthToken } from '../utils/authStorage'
import '../styles/ProductDetail.css'
import '../styles/logoAnimations.css'

function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const { addToCart } = useCart()
  const chatUnreadCount = useChatUnreadCount()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [product, setProduct] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [buyingLoading, setBuyingLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/marketplace/${productId}`)
      const data = await response.json()
      
      if (data.success) {
        setProduct(data.data)
        setSeller(data.data.seller)
        setSelectedImage(data.data.image || (data.data.images && data.data.images[0]))
        // Sort reviews by newest first
        const sortedReviews = data.data.reviews ? [...data.data.reviews].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ) : []
        setReviews(sortedReviews)
      } else {
        showToast('Product not found', 'error')
        navigate('/marketplace')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      showToast('Failed to load product details', 'error')
      navigate('/marketplace')
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

  const handleAddToCart = () => {
    try {
      addToCart({
        _id: product._id,
        title: product.title,
        price: product.price,
        image: product.image,
        condition: product.condition,
        seller: seller?.fullName || 'Unknown'
      })
      showToast('Added to cart successfully!', 'success')
    } catch (error) {
      showToast('Failed to add to cart', 'error')
    }
  }

  const handleBuyNow = async () => {
    try {
      setBuyingLoading(true)
      const token = getAuthToken()
      
      const orderPayload = {
        items: [{
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity: 1,
          image: product.image
        }],
        totalPrice: product.price,
        shippingAddress: user?.city || 'Not provided',
        paymentMethod: 'COD'
      }

      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order')
      }

      showToast('Order placed successfully!', 'success')
      setTimeout(() => {
        navigate('/profile?tab=orders')
      }, 1500)
    } catch (error) {
      console.error('Error placing order:', error)
      showToast(error.message || 'Failed to place order', 'error')
    } finally {
      setBuyingLoading(false)
    }
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success')
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!user) {
      showToast('Please login to leave a review', 'info')
      navigate('/login')
      return
    }

    if (!reviewForm.comment.trim()) {
      showToast('Please add a comment to your review', 'error')
      return
    }

    try {
      setReviewLoading(true)
      const token = getAuthToken()
      
      const reviewPayload = {
        rating: reviewForm.rating,
        comment: reviewForm.comment
      }

      const response = await fetch(`http://localhost:5000/api/marketplace/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewPayload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review')
      }

      showToast('Review submitted successfully!', 'success')
      setReviewForm({ rating: 5, comment: '' })
      // Refresh product to get updated reviews from DB
      fetchProductDetails()
    } catch (error) {
      console.error('Error submitting review:', error)
      showToast(error.message || 'Failed to submit review', 'error')
    } finally {
      setReviewLoading(false)
    }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'star-filled' : 'star-empty'}
        fill={i < rating ? 'currentColor' : 'none'}
      />
    ))
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <header className="dashboard-header">
          <div className="container header-inner">
            <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
              <div className="logo-brand-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: '1.15' }}>
                <span className="logo-text" style={{ fontSize: '30px', fontWeight: '800', color: '#5c4a3d', letterSpacing: '-0.5px' }}>CareerMap</span>
                <span className="logo-tagline" style={{ fontSize: '11px', fontWeight: '600', color: '#8b6e58', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Find Your Way. Own Your Future.</span>
              </div>
            </div>
          </div>
        </header>
        <main className="product-detail-main">
          <div className="container">
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading product details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const formatDate = (date) => {
    if (!date) return 'Recently'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image]

  return (
    <div className="product-detail-page">
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

      <main className="product-detail-main">
        <div className="container">
          {/* Back Button */}
          <button 
            className="back-button"
            onClick={() => navigate('/marketplace')}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span>Back to Marketplace</span>
          </button>

          <div className="product-detail-wrapper">
            {/* Images Section */}
            <div className="detail-images-section">
              <div className="main-image">
                <img src={selectedImage} alt={product.title} />
                <span className="condition-badge">{product.condition}</span>
              </div>
              
              {images.length > 1 && (
                <div className="thumbnail-images">
                  {images.map((img, idx) => (
                    <div 
                      key={idx}
                      className={`thumbnail ${selectedImage === img ? 'active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={img} alt={`Product ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews Section */}
              <div className="reviews-section">
                <h3>Reviews</h3>
                
                {/* Review Form */}
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="form-group">
                    <label>Rating *</label>
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-button ${reviewForm.rating >= star ? 'active' : ''}`}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          title={`${star} star${star !== 1 ? 's' : ''}`}
                        >
                          <Star size={20} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Your Review *</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this product..."
                      rows="3"
                      maxLength="500"
                      className="review-textarea"
                    />
                    <span className="char-count">{reviewForm.comment.length}/500</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit-review"
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Submit Review
                      </>
                    )}
                  </button>
                </form>

                {/* Reviews List */}
                <div className="reviews-list">
                  {reviews.length === 0 ? (
                    <div className="no-reviews">
                      <p>No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    reviews.map((review, idx) => (
                      <div key={idx} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              {review.buyer?.profileImage ? (
                                <img src={review.buyer.profileImage} alt={review.buyer.fullName} />
                              ) : (
                                <div className="avatar-placeholder">
                                  <User size={16} />
                                </div>
                              )}
                            </div>
                            <div className="reviewer-details">
                              <div className="reviewer-name">{review.buyer?.fullName || 'Anonymous'}</div>
                              <div className="review-rating">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </div>
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="detail-info-section">
              {/* Product Header */}
              <div className="product-header">
                <div className="header-top">
                  <h1>{product.title}</h1>
                  <button 
                    className={`favorite-button ${isFavorite ? 'active' : ''}`}
                    onClick={handleToggleFavorite}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Meta Information */}
                <div className="product-meta">
                  <span className="category-tag">
                    <Tag size={16} />
                    {product.category}
                  </span>
                  <span className="posted-date">
                    <Calendar size={16} />
                    {formatDate(product.createdAt)}
                  </span>
                </div>
              </div>

              {/* Price Section */}
              <div className="price-section">
                <span className="price-label">Price</span>
                <span className="price-value">PKR {product.price.toLocaleString()}</span>
              </div>

              {/* Key Details */}
              <div className="key-details">
                <div className="detail-row">
                  <span className="detail-label">
                    <MapPin size={18} />
                    Location
                  </span>
                  <span className="detail-value">
                    {product.location?.city || 'Not specified'}
                    {product.location?.area && `, ${product.location.area}`}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    <Package size={18} />
                    Condition
                  </span>
                  <span className="detail-value">{product.condition}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    <Tag size={18} />
                    Category
                  </span>
                  <span className="detail-value">{product.category}</span>
                </div>
              </div>

              {/* Description */}
              <div className="description-section">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>

              {/* Seller Information */}
              <div className="seller-section">
                <h3>Seller Information</h3>
                <div className="seller-card">
                  <div className="seller-avatar">
                    {seller?.profileImage ? (
                      <img src={seller.profileImage} alt={seller.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="seller-info">
                    <div className="seller-name">{seller?.fullName || 'Unknown Seller'}</div>
                    <div className="seller-contact">
                      {seller?.email && (
                        <a href={`mailto:${seller.email}`} className="contact-link">
                          <i className="fas fa-envelope"></i>
                          {seller.email}
                        </a>
                      )}
                    </div>
                    <div className="seller-rating">
                      <i className="fas fa-star"></i>
                      <span>Trusted Seller</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  className="btn-add-cart"
                  onClick={handleAddToCart}
                  disabled={buyingLoading}
                >
                  <i className="fas fa-shopping-cart"></i>
                  Add to Cart
                </button>
                <button 
                  className="btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={buyingLoading}
                >
                  {buyingLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-bolt"></i>
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProductDetail
