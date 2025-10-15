import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';
import authenticate from '../middleware/auth.js';

dotenv.config();

const router = Router();

// --- Email Transporter Setup ---
function getTransporterIfConfigured() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SERVICE,
    SMTP_SECURE,
  } = process.env;

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
    // e.g. 'gmail', lets nodemailer resolve host/port
    transportOptions.service = SMTP_SERVICE;
  } else {
    // direct host/port configuration (e.g. Gmail SMTP on 587)
    if (!SMTP_HOST || !SMTP_PORT) return null;
    transportOptions.host = SMTP_HOST;
    transportOptions.port = Number(SMTP_PORT);
  }

  return nodemailer.createTransport(transportOptions);
}

const transporter = getTransporterIfConfigured();

// Proactively verify transporter on startup to surface auth/connection issues early
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

// --- Signup Route ---
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'Email already in use' });

    const user = new User({ name, email, password });
    await user.save();

    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    if (err && err.code === 11000)
      return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Login Route ---
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
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Forgot Password ---
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    
    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, password reset instructions have been sent.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600 * 1000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('Generated password reset URL:', resetUrl);

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: user.email,
          subject: 'Password Reset Request - CareerMap',
          text: `You requested a password reset for your CareerMap account.

Reset Link: ${resetUrl}

IMPORTANT: If clicking the link doesn't work, copy and paste the entire URL above into your browser's address bar.

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You requested a password reset for your <strong>CareerMap</strong> account.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Reset Link:</strong></p>
                <p style="word-break: break-all; color: #0066cc;">
                  <a href="${resetUrl}" style="color: #0066cc;">${resetUrl}</a>
                </p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>⚠️ Important:</strong> If clicking the link doesn't work, copy and paste the entire URL above into your browser's address bar.</p>
              </div>
              
              <p>This link will expire in <strong>1 hour</strong> for security reasons.</p>
              
              <p style="color: #666; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
          `,
        });
        return res.json({
          message: 'Password reset instructions have been sent to your email.',
          info: info.messageId,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        return res.json({
          message: 'Password reset token generated (email send failed)',
          token,
          resetUrl,
          error: emailError.message,
        });
      }
    }

    return res.json({
      message: 'Password reset instructions have been sent to your email.',
      token,
      resetUrl,
    });
  } catch (err) {
    console.error('Forgot error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Reset Password ---
router.post('/reset', async (req, res) => {
  try {
    const { email, token, password } = req.body || {};
    if (!email || !token || !password)
      return res
        .status(400)
        .json({ error: 'Email, token, and new password are required' });

    const user = await User.findOne({ email, resetPasswordToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid token or email' });
    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    )
      return res.status(400).json({ error: 'Token expired' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Get Current User ---
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      '_id name email createdAt updatedAt'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
