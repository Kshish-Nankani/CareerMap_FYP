import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';
import authenticate from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

dotenv.config();

const router = Router();

function getTransporterIfConfigured() {
  const {
    SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,SMTP_SERVICE,SMTP_SECURE, } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const secure = typeof SMTP_SECURE === 'string' ? SMTP_SECURE === 'true' : false;

  const transportOptions = {
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    secure,
    tls: { rejectUnauthorized: false },
  };

  if (SMTP_SERVICE) {
   
    transportOptions.service = SMTP_SERVICE;
  } else {
 
    if (!SMTP_HOST || !SMTP_PORT) return null;
    transportOptions.host = SMTP_HOST;
    transportOptions.port = Number(SMTP_PORT);
  }

  return nodemailer.createTransport(transportOptions);
}

const transporter = getTransporterIfConfigured();


function buildUserResponse(user) {
  const u = user?.toObject ? user.toObject() : user;
  if (!u) return null;
  return {
    id: u._id,
    _id: u._id,
    email: u.email,fullName: u.fullName,name: u.fullName,phone: u.phone,
    city: u.city,gender: u.gender,dateOfBirth: u.dateOfBirth,dateofbirth: u.dateOfBirth,
    schoolUniversity: u.schoolUniversity,degreeType: u.degreeType,degreeGradeType: u.degreeType, 
    department: u.department,semesterYear: u.semesterYear,currentSemesterYear: u.semesterYear, 
    cgpaPercentage: u.cgpaPercentage,careerInterest: u.careerInterest,profileImage: u.profileImage || '',
    isAdmin: u.isAdmin || false,isTutor: u.isTutor || false,
    tutorBio: u.tutorBio || '',
    tutorOfferings: Array.isArray(u.tutorOfferings) ? u.tutorOfferings : [],
    careerPathStages: u.careerPathStages || { profileSetup: false, careerAssessment: false, universitySelection: false },
    createdAt: u.createdAt,updatedAt: u.updatedAt,
  };
}
if (transporter) {
  transporter
    .verify()
    .then(() => {
      console.log('SMTP transporter verified and ready');
    })
    .catch((err) => {
      console.error('SMTP verification failed:', err && err.message ? err.message : err);
    });
}
const pendingSignups = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingSignups.entries()) {
    if (data.otpExpires < now) {
      pendingSignups.delete(email);
      console.log(`Cleaned up expired pending signup for: ${email}`);
    }
  }
}, 5 * 60 * 1000);


router.post('/signup', async (req, res) => {
  try {
    const { name, fullName, email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const resolvedFullName = fullName || name || '';
    
    if (!resolvedFullName || resolvedFullName.trim() === '') {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'Email already exists' });
    if (pendingSignups.has(email)) {
      const pending = pendingSignups.get(email);
      if (pending.otpExpires > Date.now()) {
        return res.status(400).json({ 
          error: 'A verification code has already been sent to this email. Please check your inbox or wait for it to expire.' 
        });  
      }
      pendingSignups.delete(email);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    const bcrypt = (await import('bcrypt')).default;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    pendingSignups.set(email, {
      fullName: resolvedFullName,email,hashedPassword,otp,otpExpires,otpAttempts: 0,createdAt: Date.now()
    });

    console.log(`Pending signup created for: ${email}`);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: email,
          subject: 'Verify your email - CareerMap',
          text: `Your verification code is: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Email verification</h2>
              <p>Welcome to <strong>CareerMap</strong> — please verify your email address by entering the 6-digit code below:</p>
              <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h1 style="color: #6b542bff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                <p style="margin: 10px 0 0 0; color: #666;">Your 6-digit verification code</p>
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes for security reasons #careermap.</p>
            </div>
          `,
        });
        return res.status(200).json({ message: 'Verification code sent to email. Please verify to complete signup.' });
      } catch (emailErr) {
        console.error('Signup email send failed:', emailErr && emailErr.message ? emailErr.message : emailErr);
      
        return res.status(200).json({ message: 'Verification code generated (email send failed).', otp });
      }
    }

    return res.status(200).json({ message: 'Verification code generated (no email configured).', otp });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, otpCode } = req.body || {};
    if (!email || !otpCode)
      return res.status(400).json({ error: 'Email and OTP code are required' });
    const pending = pendingSignups.get(email);
    if (!pending) {
      return res.status(400).json({ error: 'No OTP found for this email. Please sign up first.' });
    }

    if (pending.otpExpires < Date.now()) {
      pendingSignups.delete(email);
      return res.status(400).json({ error: 'OTP code has expired. Please sign up again.' });
    }

    if (pending.otpLockedUntil && pending.otpLockedUntil > Date.now()) {
      return res.status(400).json({ error: 'Account temporarily locked due to too many attempts. Please try again later.' });
    }

    if (pending.otp !== otpCode) {
      pending.otpAttempts = (pending.otpAttempts || 0) + 1;
   
      if (pending.otpAttempts >= 3) {
        pending.otpLockedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
        pendingSignups.set(email, pending);
        return res.status(400).json({ error: 'Too many failed attempts. Account locked for 5 minutes.' });
      }

      pendingSignups.set(email, pending);
      return res.status(400).json({ 
        error: `Invalid OTP code. ${3 - pending.otpAttempts} attempts remaining.` 
      });
    }
    const insertResult = await User.collection.insertOne({
      fullName: pending.fullName,email: pending.email,password: pending.hashedPassword,emailVerified: true,isAdmin: false,
      phone: '',city: '',gender: '',dateOfBirth: '',schoolUniversity: '',degreeType: '',
      department: '',semesterYear: '',cgpaPercentage: '',careerInterest: '',otpAttempts: 0,
      isTutor: false,tutorBio: '',tutorOfferings: [],
      createdAt: new Date(),updatedAt: new Date()
    });
  
    const user = await User.findById(insertResult.insertedId);

    pendingSignups.delete(email);
    console.log(`User account created and verified: ${email}`);

    const token = jwt.sign(
      { sub: user._id.toString(), isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ 
      message: 'Email verified successfully. Account created!', 
      token, 
      user: { 
        id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin || false 
      } 
    });
  } catch (err) {
    console.error('Verify email error:', err);
    if (err.code === 11000) {
      pendingSignups.delete(email);
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user._id.toString(), isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,user: buildUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, an OTP code has been sent.',
      });
    }

    const otpCode = user.generateOTP();
    await user.save();

    console.log(`Generated OTP for ${email}: ${otpCode}`);

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: user.email,
          subject: 'Password Reset Code - CareerMap',
          text: `Your password reset code is: ${otpCode}

This code will expire in 10 minutes for security reasons.

If you didn't request this password reset, please ignore this email.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Code</h2>
              <p>You requested a password reset for your <strong>CareerMap</strong> account.</p>
              
              <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h1 style="color: #7d642dff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
                <p style="margin: 10px 0 0 0; color: #666;">Your 6-digit verification code</p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>⚠️ Important:</strong> This code will expire in <strong>10 minutes</strong> for security reasons.</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
          `,
        });
        return res.json({
          message: 'OTP code has been sent to your email.',
          info: info.messageId,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        return res.json({
          message: 'OTP code generated (email send failed)',
          otpCode, 
          error: emailError.message,
        });
      }
    }

    return res.json({
      message: 'OTP code has been sent to your email.',
      otpCode, 
    });
  } catch (err) {
    console.error('Send OTP error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body || {};
    if (!email || !otpCode)
      return res.status(400).json({ error: 'Email and OTP code are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email' });

    const verification = user.verifyOTP(otpCode);
    await user.save();

    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); 
    await user.save();

    return res.json({ 
      message: 'OTP verified successfully',
      resetToken,
      expiresIn: 30 * 60 
    });
  } catch (err) {
    console.error('Verify OTP error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, password } = req.body || {};
    if (!email || !resetToken || !password)
      return res
        .status(400)
        .json({ error: 'Email, reset token, and new password are required' });

    const user = await User.findOne({ email, resetPasswordToken: resetToken });
    if (!user) return res.status(400).json({ error: 'Invalid reset token or email' });
    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    )
      return res.status(400).json({ error: 'Reset token expired' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil');
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log('Profile fetched successfully for user:', req.user.id);
    return res.json(buildUserResponse(user));
  } catch (err) {
    console.error('Get profile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      fullName,name,phone,city,gender,dateOfBirth,dateofbirth,schoolUniversity,degreeType,
      degreeGradeType,department,semesterYear,currentSemesterYear,cgpaPercentage,
      careerInterest,profileImage,email,careerPathStages} = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resolvedFullName = fullName ?? name;
    if (resolvedFullName !== undefined) user.fullName = resolvedFullName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (gender !== undefined) user.gender = gender;
    const resolvedDob = dateOfBirth ?? dateofbirth;
    if (resolvedDob !== undefined) user.dateOfBirth = resolvedDob;
    if (schoolUniversity !== undefined) user.schoolUniversity = schoolUniversity;
    const resolvedDegreeType = degreeType ?? degreeGradeType;
    if (resolvedDegreeType !== undefined) user.degreeType = resolvedDegreeType;
    if (department !== undefined) user.department = department;
    const resolvedSemesterYear = semesterYear ?? currentSemesterYear;
    if (resolvedSemesterYear !== undefined) user.semesterYear = resolvedSemesterYear;
    if (cgpaPercentage !== undefined) user.cgpaPercentage = cgpaPercentage;
    if (careerInterest !== undefined) user.careerInterest = careerInterest;
    if (profileImage !== undefined) {
      // Upload to Cloudinary if it's a new base64 image; preserve existing URL otherwise
      user.profileImage = await uploadToCloudinary(profileImage, 'careermap/profiles');
    }
    if (careerPathStages !== undefined) user.careerPathStages = careerPathStages;

    const savedUser = await user.save();
    console.log('Profile saved successfully for user:', req.user.id);
    console.log('Saved profile data:', {
      fullName: savedUser.fullName,phone: savedUser.phone,city: savedUser.city,
      gender: savedUser.gender,dateOfBirth: savedUser.dateOfBirth,careerInterest: savedUser.careerInterest,
      schoolUniversity: savedUser.schoolUniversity,degreeType: savedUser.degreeType,
     department: savedUser.department,semesterYear: savedUser.semesterYear,cgpaPercentage: savedUser.cgpaPercentage
    });
    const updatedUser = await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires -otpAttempts -otpLockedUntil');
    return res.json(buildUserResponse(updatedUser));
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
