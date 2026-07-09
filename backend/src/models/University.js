import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  name: {type: String, required: true,trim: true},
  location: {city: 
    {type: String,
      required: true},
    state: {type: String,required: true},
    country: {type: String,required: true,default: 'pakistan'}},
  description: {type: String,required: true},
  establishedYear: {type: Number,required: true},
  ranking: {national: Number,global: Number},
  type: {type: String,enum: ['Public', 'Private', 'Deemed'],required: true},
  affiliation: {type: String,default: 'Autonomous'},
  courses: [{name: String,duration: String,degree: String}],
  facilities: [String],
  website: {type: String,trim: true},
  email: {type: String,trim: true,lowercase: true},
  phone: {type: String,trim: true},
  admissionProcess: {type: String},
  fees: {min: Number,max: Number,
  currency: {type: String,enum: ['PKR'],default: 'PKR'}},
  image: {type: String,default: 'https://unifyed.com/wp-content/uploads/2021/02/Student-Information-System-Help-Institutions.jpg'},
  isActive: {type: Boolean,default: true}
}, {
  timestamps: true
});

// Index for search functionality
universitySchema.index({ name: 'text', 'location.city': 'text', 'location.state': 'text' });

const University = mongoose.model('University', universitySchema);

export default University;
