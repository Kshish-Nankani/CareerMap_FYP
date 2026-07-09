import mongoose from 'mongoose'
import Product from './src/models/Product.js'
import User from './src/models/User.js'
import University from './src/models/University.js'
import dotenv from 'dotenv'

dotenv.config()

const products = [
  {
    title: 'Advanced Mathematics Textbook',
    description: 'Complete calculus and linear algebra book. Hardly used, in perfect condition.',
    price: 1500,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1507842217343-583f20270cb8?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1507842217343-583f20270cb8?w=400&h=400&fit=crop'],
    category: 'Textbooks',
    condition: 'New',
    location: {
      city: 'Karachi',
      area: 'Defence'
    },
    stock: 3,
    sold: 5
  },
  {
    title: 'Physics Lab Manual',
    description: 'Original physics lab manual with solved experiments. Perfect for engineering students.',
    price: 800,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop'],
    category: 'Lab Materials',
    condition: 'Used',
    location: {
      city: 'Karachi',
      area: 'Gulshan-e-Iqbal'
    },
    stock: 2,
    sold: 3
  },
  {
    title: 'Organic Chemistry Notes',
    description: 'Comprehensive handwritten notes from top students. Very helpful for exams.',
    price: 500,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1609708536965-3f336c6b0a7f?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1609708536965-3f336c6b0a7f?w=400&h=400&fit=crop'],
    category: 'Notes',
    condition: 'Used',
    location: {
      city: 'Lahore',
      area: 'DHA'
    },
    stock: 5,
    sold: 12
  },
  {
    title: 'Scientific Calculator (Casio)',
    description: 'Casio FX-991EX scientific calculator. Original box and manual included.',
    price: 2500,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1611264235486-61f2afc7a651?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1611264235486-61f2afc7a651?w=400&h=400&fit=crop'],
    category: 'Electronics',
    condition: 'New',
    location: {
      city: 'Islamabad',
      area: 'F-7'
    },
    stock: 1,
    sold: 8
  },
  {
    title: 'Biology Reference Book',
    description: 'Campbell Biology reference book. Complete with diagrams and explanations.',
    price: 1800,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1588357921601-37c74529586f?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1588357921601-37c74529586f?w=400&h=400&fit=crop'],
    category: 'Textbooks',
    condition: 'Used',
    location: {
      city: 'Lahore',
      area: 'Gulberg'
    },
    stock: 2,
    sold: 4
  },
  {
    title: 'English Literature Study Guide',
    description: 'Complete study guide for literature exams. Contains summaries of all major texts.',
    price: 600,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=400&fit=crop'],
    category: 'Notes',
    condition: 'Used',
    location: {
      city: 'Karachi',
      area: 'Clifton'
    },
    stock: 3,
    sold: 7
  },
  {
    title: 'Digital Thermometer',
    description: 'Digital thermometer for lab use. Accurate readings within 0.1 degree.',
    price: 450,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1576091160550-112173fac474?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1576091160550-112173fac474?w=400&h=400&fit=crop'],
    category: 'Electronics',
    condition: 'Used',
    location: {
      city: 'Rawalpindi',
      area: 'Commercial'
    },
    stock: 4,
    sold: 2
  },
  {
    title: 'Stationary Pack - Premium',
    description: 'Complete stationary pack including notebooks, pens, pencils, and highlighters.',
    price: 1200,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd5e1f4?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1599599810694-b5ac4dd5e1f4?w=400&h=400&fit=crop'],
    category: 'Stationery',
    condition: 'New',
    location: {
      city: 'Karachi',
      area: 'PECHS'
    },
    stock: 10,
    sold: 15
  },
  {
    title: 'Microeconomics Textbook',
    description: 'Fundamental Microeconomics textbook. Great for commerce students.',
    price: 1600,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop'],
    category: 'Textbooks',
    condition: 'Used',
    location: {
      city: 'Lahore',
      area: 'Township'
    },
    stock: 1,
    sold: 6
  },
  {
    title: 'Programming in C++ Notes',
    description: 'Complete C++ programming notes with examples and exercises.',
    price: 700,
    currency: 'PKR',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop'],
    category: 'Notes',
    condition: 'Used',
    location: {
      city: 'Karachi',
      area: 'Banani'
    },
    stock: 4,
    sold: 10
  }
]

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careermap')

    console.log('Connected to MongoDB for seeding products...')

    
    let seller = await User.findOne()
    if (!seller) {
      
      seller = await User.create({
        fullName: 'Sample Seller',
        email: 'seller@marketplace.com',
        password: 'password123',
        emailVerified: true
      })
      console.log('Created default seller user')
    }

    
    let university = await University.findOne()

    
    const productsToSeed = products.map(product => ({
      ...product,
      seller: seller._id,
      university: university ? university._id : undefined
    }))

   
    await Product.deleteMany({})
    console.log('Cleared existing products')

    // Seed products
    const createdProducts = await Product.insertMany(productsToSeed)
    console.log(`Successfully seeded ${createdProducts.length} products`)

    
    console.log('\nSample Products:')
    createdProducts.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - PKR ${product.price} (${product.condition})`)
    })

    await mongoose.connection.close()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error seeding products:', error)
    process.exit(1)
  }
}

seedProducts()
