import express from 'express';
import University from '../models/University.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();
router.get('/', async (req, res) => {
  try {
    const { 
      search, type, state, city, discipline, page = 1, limit = 10
    } = req.query;

    let query = { isActive: true };

    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

   
    if (type) {
      query.type = type;
    }

   
    if (state) {
      query['location.state'] = state;
    }

    
    if (city) {
      query['location.city'] = city;
    }

    
    if (discipline) {
      query.$or = [
        { 'courses.name': { $regex: discipline, $options: 'i' } },
        { 'courses.degree': { $regex: discipline, $options: 'i' } }
      ];
    }

    
    const skip = (Number(page) - 1) * Number(limit);

    const universities = await University.find(query)
      .skip(skip)
      .limit(Number(limit));

    const total = await University.countDocuments(query);

    res.json({
      universities,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ message: 'Error fetching universities', error: error.message });
  }
});


router.get('/filters/states', async (req, res) => {
  try {
    const states = await University.distinct('location.state', { isActive: true });
    res.json(states.sort());
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ message: 'Error fetching states', error: error.message });
  }
});


router.get('/filters/cities', async (req, res) => {
  try {
    const cities = await University.distinct('location.city', { isActive: true });
    res.json(cities.sort());
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Error fetching cities', error: error.message });
  }
});


router.get('/filters/disciplines', async (req, res) => {
  try {
    
    const universities = await University.find({ isActive: true }, 'courses');
    
    
    const disciplinesSet = new Set();
    
    universities.forEach(uni => {
      if (uni.courses && uni.courses.length > 0) {
        uni.courses.forEach(course => {
          
          if (course.name) {
            const name = course.name.toLowerCase();
            if (name.includes('engineering') || name.includes('engineer')) disciplinesSet.add('Engineering');
            if (name.includes('computer') || name.includes('cs') || name.includes('it')) disciplinesSet.add('Computer Science');
            if (name.includes('business') || name.includes('mba') || name.includes('management')) disciplinesSet.add('Business');
            if (name.includes('medicine') || name.includes('medical') || name.includes('mbbs')) disciplinesSet.add('Medicine');
            if (name.includes('art') || name.includes('design') || name.includes('fine')) disciplinesSet.add('Arts');
            if (name.includes('science') && !name.includes('computer')) disciplinesSet.add('Science');
            if (name.includes('law') || name.includes('legal')) disciplinesSet.add('Law');
            if (name.includes('architecture')) disciplinesSet.add('Architecture');
            if (name.includes('pharmacy')) disciplinesSet.add('Pharmacy');
            if (name.includes('education') || name.includes('teaching')) disciplinesSet.add('Education');
          }
          
          if (course.degree) {
            disciplinesSet.add(course.degree);
          }
        });
      }
    });
    
    const disciplines = Array.from(disciplinesSet).sort();
    res.json(disciplines);
  } catch (error) {
    console.error('Error fetching disciplines:', error);
    res.status(500).json({ message: 'Error fetching disciplines', error: error.message });
  }
});


router.post('/', adminAuth, async (req, res) => {
  try {
    const university = new University(req.body);
    await university.save();
    res.status(201).json({ 
      message: 'University created successfully', 
      university 
    });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({ message: 'Error creating university', error: error.message });
  }
});


router.put('/:id', adminAuth, async (req, res) => {
  try {
    const university = await University.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    res.json({ 
      message: 'University updated successfully', 
      university 
    });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(500).json({ message: 'Error updating university', error: error.message });
  }
});


router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const university = await University.findByIdAndDelete(req.params.id);

    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    res.json({ 
      message: 'University deleted successfully',
      university 
    });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({ message: 'Error deleting university', error: error.message });
  }
});

export default router;
