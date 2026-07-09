import { ShoppingCart, MapPin, Star, Zap, Edit, Trash2 } from 'lucide-react'
import PropTypes from 'prop-types'
import '../styles/ProductCard.css'

function ProductCard({ product, onAddToCart, onViewDetails, user, onEdit, onDelete }) {
  const formatPrice = (price) => {
    return `PKR ${price.toLocaleString()}`
  }

  const getConditionClass = (condition) => {
    return condition.toLowerCase() === 'new' ? 'condition-new' : 'condition-used'
  }

  return (
    <div className="product-card">
      {/* Image Section */}
      <div className="product-image-wrapper">
        <img
          src={product.image || '/images/placeholder.jpg'}
          alt={product.title}
          className="product-image"
        />
        <div className={`product-condition ${getConditionClass(product.condition)}`}>
          {product.condition === 'New' ? <Zap size={14} /> : null}
          {product.condition}
        </div>
        {product.sold > 0 && (
          <div className="product-sold-badge">
            {product.sold} sold
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="product-content">
        <h3 className="product-title">{product.title}</h3>

        {/* Seller Info */}
        {product.seller && (
          <div className="product-seller-info">
            <img
              src={product.seller.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller.fullName || 'Seller')}&size=32&background=A78B71&color=fff&bold=true`}
              alt={product.seller.fullName}
              className="seller-avatar"
              title={`${product.seller.fullName} - ${product.seller.email}`}
            />
            <span className="seller-email">{product.seller.email}</span>
          </div>
        )}

        {/* Location */}
        <div className="product-location">
          <MapPin size={14} />
          <span>{product.location?.city}</span>
          {product.location?.area && <span>{product.location.area}</span>}
        </div>

        {/* Rating */}
        {product.rating?.average > 0 && (
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.round(product.rating.average) ? 'filled' : 'empty'}
                />
              ))}
            </div>
            <span className="rating-text">
              {product.rating.average} ({product.rating.count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="product-price">
          {formatPrice(product.price)}
        </div>

        {/* Stock Status */}
        <div className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="product-actions">
        <button
          className="btn-details"
          onClick={() => onViewDetails(product._id)}
        >
          View Details
        </button>
        <button
          className="btn-cart"
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>

      {user?.isAdmin && (
        <div className="product-admin-actions" style={{ display: 'flex', gap: '0.5rem', padding: '0 1.25rem 1.25rem' }}>
          <button
            type="button"
            className="marketplace-admin-btn"
            onClick={() => onEdit(product._id)}
          >
            <Edit size={14} /> Edit
          </button>
          <button
            type="button"
            className="marketplace-admin-btn"
            onClick={() => onDelete(product._id)}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    image: PropTypes.string,
    price: PropTypes.number.isRequired,
    condition: PropTypes.string.isRequired,
    location: PropTypes.shape({
      city: PropTypes.string,
      area: PropTypes.string
    }),
    seller: PropTypes.shape({
      _id: PropTypes.string,
      fullName: PropTypes.string,
      email: PropTypes.string,
      profileImage: PropTypes.string
    }),
    rating: PropTypes.shape({
      average: PropTypes.number,
      count: PropTypes.number
    }),
    sold: PropTypes.number,
    stock: PropTypes.number
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  user: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
}

export default ProductCard
