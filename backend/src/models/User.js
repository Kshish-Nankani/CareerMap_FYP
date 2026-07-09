import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const TutorOfferingSchema = new mongoose.Schema(
  {
    course: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    expertise: { type: String, trim: true, default: '' }
  },
  { _id: false }
)

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: ''},
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    emailVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isTutor: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    otpCode: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date },
    tutorBio: { type: String, trim: true, default: '' },
    tutorOfferings: { type: [TutorOfferingSchema], default: [] },

    // Profile Information
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    gender: { type: String, trim: true, default: '' },
    dateOfBirth: { type: String, trim: true, default: '' },
    schoolUniversity: { type: String, trim: true, default: '' },
    degreeType: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    semesterYear: { type: String, trim: true, default: '' },
    cgpaPercentage: { type: String, trim: true, default: '' },
    careerInterest: { type: String, trim: true, default: '' },
    profileImage: { type: String, default: '' },
    careerPathStages: {
      profileSetup: { type: Boolean, default: false },
      careerAssessment: { type: Boolean, default: false },
      universitySelection: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next() 
  } catch (err) {
    next(err)
  }
})

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

UserSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  this.otpCode = otp
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000) 
  this.otpAttempts = 0
  this.otpLockedUntil = undefined
  return otp
}

UserSchema.methods.verifyOTP = function (code) {
  
  if (this.otpLockedUntil && this.otpLockedUntil > Date.now()) {
    return { valid: false, message: 'Account temporarily locked due to too many attempts' }
  }

  
  if (!this.otpCode || !this.otpExpires || this.otpExpires < Date.now()) {
    return { valid: false, message: 'OTP code has expired or is invalid' }
  }

  if (this.otpCode !== code) {
    this.otpAttempts += 1
    
  
    if (this.otpAttempts >= 3) {
      this.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000) 
    }
    
    return { 
      valid: false, 
      message: `Invalid OTP code. ${3 - this.otpAttempts} attempts remaining` 
    }
  }

  
  this.otpCode = undefined
  this.otpExpires = undefined
  this.otpAttempts = 0
  this.otpLockedUntil = undefined
  
  return { valid: true, message: 'OTP verified successfully' }
}

const User = mongoose.model('User', UserSchema)
export default User
