import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CareerRecommendation from './src/models/CareerRecommendation.js';

dotenv.config();

const seedData = [
  {
    title: "Software Engineer",
    growth: "+25%",
    salary: "PKR 80K-150K",
    demand: "Very High",
    icon: "fa-solid fa-code",
    skills: ["JavaScript", "Python", "Cloud"],
    description: "High demand in Pakistan's growing tech sector",
    companies: ["Systems Ltd", "10Pearls", "Netsol"],
    isActive: true,
    displayOrder: 1
  },
  {
    title: "Data Scientist",
    growth: "+35%",
    salary: "PKR 100K-200K",
    demand: "Very High",
    icon: "fa-solid fa-database",
    skills: ["Python", "ML", "Statistics"],
    description: "AI and analytics roles expanding rapidly",
    companies: ["Afiniti", "IBM", "NITB"],
    isActive: true,
    displayOrder: 2
  },
  {
    title: "Digital Marketing",
    growth: "+30%",
    salary: "PKR 50K-100K",
    demand: "High",
    icon: "fa-solid fa-bullhorn",
    skills: ["Social Media", "SEO", "Content"],
    description: "Essential for businesses going digital",
    companies: ["Bramerz", "Markitt", "Orient"],
    isActive: true,
    displayOrder: 3
  }
];

async function seedCareerRecommendations() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Missing MONGODB_URI environment variable');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

  
    await CareerRecommendation.deleteMany({});
    console.log('Cleared existing career recommendations');

   
    const result = await CareerRecommendation.insertMany(seedData);
    console.log(`Successfully seeded ${result.length} career recommendations`);

    console.log('\nSeeded Career Recommendations:');
    result.forEach((career, index) => {
      console.log(`${index + 1}. ${career.title} - ${career.salary} - ${career.demand} demand`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding career recommendations:', error);
    process.exit(1);
  }
}

seedCareerRecommendations();
