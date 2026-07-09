import mongoose from 'mongoose'

const TutorRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

const TutorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Personal Information
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, trim: true },
    university: { type: String, required: true, trim: true },
    degreeProgram: { type: String, required: true, trim: true },
    currentSemester: { type: String, required: true, trim: true },
    
    // Academic Information
    subjects: [{ type: String, required: true }],
    specialization: { type: String, required: true, trim: true },
    gpa: { type: String, trim: true, default: '' },
    hourlyRate: { type: Number, default: 0, min: 0 },
    responseTime: { type: String, trim: true, default: '' },
    
    // Experience & Qualifications
    teachingExperience: { type: String, trim: true, default: '' },
    certifications: { type: String, trim: true, default: '' },
    achievements: { type: String, trim: true, default: '' },
    linkedinPortfolio: { type: String, trim: true, default: '' },
    
    // File Uploads (store file paths or URLs)
    cnicDocument: { type: String, default: '' },
    resumeDocument: { type: String, default: '' },
    certificateDocuments: [{ type: String }],
    
    // Application Status
    status: {
      type: String,
      enum: ['payment_pending', 'payment_failed', 'payment_cancelled', 'pending_review', 'Pending', 'Approved', 'Rejected'],
      default: 'payment_pending'
    },
    transactionId: {
      type: String,
      default: null
    },
    
    // Admin Review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true, default: '' },

    // Public tutor ratings submitted by authenticated users.
    ratings: {
      type: [TutorRatingSchema],
      default: []
    },
    ratingAverage: {
      type: Number,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

const TutorApplication = mongoose.model('TutorApplication', TutorApplicationSchema) // model stores the tutor application data in monogoDB collection named 'tutorapplications'
export default TutorApplication
