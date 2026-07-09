import mongoose from 'mongoose';

const CareerRecommendationSchema = new mongoose.Schema(
  {
    title: {type: String,required: true,trim: true},
    growth: {type: String,required: false,trim: true,default: ''},
    salary: {type: String,required: true,trim: true},
    demand: {type: String,required: true,trim: true},
    icon: {type: String,required: true,default: 'fa-solid fa-briefcase'},
    skills: {type: [String],default: []},
    description: {type: String,required: true,trim: true},
    companies: {type: [String],default: []},
    isActive: {type: Boolean,default: true},
    displayOrder: {type: Number,default: 0}
  },{
    timestamps: true
  }
);
CareerRecommendationSchema.index({ isActive: 1, displayOrder: 1 });

const CareerRecommendation = mongoose.model('CareerRecommendation', CareerRecommendationSchema);

export default CareerRecommendation;
