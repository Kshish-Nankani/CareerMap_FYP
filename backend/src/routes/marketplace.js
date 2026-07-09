import express from 'express'
import Product from '../models/Product.js'
import SellerSubscription from '../models/SellerSubscription.js'
import authenticate from '../middleware/auth.js'
import { uploadToCloudinary, uploadArrayToCloudinary } from '../utils/cloudinary.js'

const router = express.Router()

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      city,
      page = 1,
      limit = 12,
      sortBy = 'newest'
    } = req.query

    let query = { isActive: true }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (category) {
      query.category = category
    }
    if (condition) {
      query.condition = condition
    }
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' }
    }
    let sortOption = {}
    switch (sortBy) {
      case 'price-low':
        sortOption = { price: 1 }
        break
      case 'price-high':
        sortOption = { price: -1 }
        break
      case 'popular':
        sortOption = { sold: -1 }
        break
      case 'rating':
        sortOption = { 'rating.average': -1 }
        break
      case 'newest':
      default:
        sortOption = { createdAt: -1 }
        break
    }

    const skip = (Number(page) - 1) * Number(limit)

    const products = await Product.find(query)
      .select('-images')
      .populate('seller', 'fullName profileImage email')
      .populate('university', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
    const total = await Product.countDocuments(query)

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    })
  }
})

router.get('/categories/all', async (req, res) => {
  try {
    const categories = [
      'Laptop',
      'Books',
      'Accessories',
      'Textbooks',
      'Notes',
      'Lab Materials',
      'Stationery',
      'Electronics',
      'Other'
    ]

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    })
  }
})

// Get my items (authenticated - products uploaded by current user)
router.get('/my-items/all', authenticate, async (req, res) => {
  try {
    const myItems = await Product.find({ seller: req.user.id })
      .populate('seller', 'fullName profileImage email')
      .populate('university', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: myItems
    })
  } catch (error) {
    console.error('Error fetching my items:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your items',
      error: error.message
    })
  }
})

// Get single product details
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'fullName profileImage email phone')
      .populate('university', 'name location')
      .populate('reviews.buyer', 'fullName profileImage')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    })
  }
})

// Create product (authenticated, for sellers)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      location,
      image,
      images,
      university
    } = req.body

    // Validate required fields
    if (!title || !description || !price || !category || !condition || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      })
    }

    // Verify user has an active seller subscription
    const activeSub = await SellerSubscription.findOne({
      userId: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    })

    if (!activeSub) {
      return res.status(403).json({
        success: false,
        message: 'An active seller subscription is required to list products. Please subscribe first.'
      })
    }

    // Verify seller quota limits
    const subscriptionStartDate = activeSub.createdAt || new Date(0)
    const listedCount = await Product.countDocuments({
      seller: req.user.id,
      isActive: true,
      createdAt: { $gte: subscriptionStartDate }
    })

    if (listedCount >= activeSub.productLimit) {
      return res.status(400).json({
        success: false,
        message: `You have reached your subscription's product limit of ${activeSub.productLimit} listings. Please upgrade your plan to upload more products.`
      })
    }

    // Upload primary image to Cloudinary (if it's a new base64 upload)
    const uploadedImage = await uploadToCloudinary(image, 'careermap/products')

    // Upload secondary images array to Cloudinary
    const uploadedImages = await uploadArrayToCloudinary(images || [], 'careermap/products')

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      location,
      image: uploadedImage,
      images: uploadedImages,
      seller: req.user.id,
      university,
      isActive: true,
      status: 'active'
    })

    await product.save()

    res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      data: product
    })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
      error: error.message
    })
  }
})

// Add review to product
router.post('/:id/reviews', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating. Must be between 1 and 5'
      })
    }

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      r => r.buyer.toString() === req.user.id
    )

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      })
    }

    // Add new review
    product.reviews.push({
      buyer: req.user.id,
      rating,
      comment
    })

    // Update rating average
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0)
    product.rating.average = (totalRating / product.reviews.length).toFixed(1)
    product.rating.count = product.reviews.length

    await product.save()

    // Populate the buyer information for the response
    await product.populate('reviews.buyer', 'fullName profileImage')

    // Get the newly added review
    const newReview = product.reviews[product.reviews.length - 1]

    res.json({
      success: true,
      message: 'Review added successfully',
      data: newReview
    })
  } catch (error) {
    console.error('Error adding review:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    })
  }
})

// Update product (authenticated, seller only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if user is the seller or an admin
    if (product.seller.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only the seller or an admin can update this product'
      })
    }
    const { title, description, price, condition, location, stock, isActive, image, images } = req.body

    if (title) product.title = title
    if (description) product.description = description
    if (price) product.price = price
    if (condition) product.condition = condition
    if (location) product.location = location
    if (stock !== undefined) product.stock = stock
    if (isActive !== undefined) product.isActive = isActive

    // Upload new images to Cloudinary if provided (base64 check handled inside helper)
    if (image !== undefined) {
      product.image = await uploadToCloudinary(image, 'careermap/products')
    }
    if (images !== undefined && Array.isArray(images)) {
      product.images = await uploadArrayToCloudinary(images, 'careermap/products')
    }

    await product.save()

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    })
  }
})

// Delete product (authenticated, seller only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if user is the seller or an admin
    if (product.seller.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only the seller or an admin can delete this product'
      })
    }

    await Product.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    })
  }
})

export default router
