import express from 'express';
import CareerRecommendation from '../models/CareerRecommendation.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const recommendations = await CareerRecommendation.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error fetching career recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career recommendations',
      error: error.message
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const recommendation = await CareerRecommendation.findById(req.params.id);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Career recommendation not found'
      });
    }
    
    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('Error fetching career recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career recommendation',
      error: error.message
    });
  }
});

export default router;
