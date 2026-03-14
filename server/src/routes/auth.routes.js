const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register - Step 1: Send OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create unverified user
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'staff',
      verificationOtp: otp,
      verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      isVerified: false
    });
    
    // Dev mode short-circuit
    if (process.env.NODE_ENV === 'development') {
      return res.status(201).json({ 
        success: true, 
        message: 'OTP sent (dev mode)', 
        otp,
        userId: user.id,
        requiresVerification: true
      });
    }

    // Send OTP email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    
    await transporter.sendMail({
      from: `"CoreInventory" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Your Email - CoreInventory',
      html: `
        <h2>Welcome to CoreInventory!</h2>
        <p>Hi ${name},</p>
        <p>Your verification OTP is: <strong style="font-size: 24px; letter-spacing: 3px;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'OTP sent to your email',
      userId: user.id,
      requiresVerification: true
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-registration - Step 2: Verify OTP and complete registration
router.post('/verify-registration', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    const user = await User.findOne({ 
      where: { 
        id: userId,
        verificationOtp: otp,
        verificationOtpExpiry: { [Op.gt]: new Date() }
      } 
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    
    // Mark as verified
    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpiry = null;
    await user.save();
    
    // Generate token
    const token = signToken(user.id);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully!',
      token, 
      user: user.toJSON() 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/resend-verification - Resend verification OTP
router.post('/resend-verification', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    user.verificationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    
    // Dev mode
    if (process.env.NODE_ENV === 'development') {
      return res.json({ success: true, message: 'OTP resent (dev mode)', otp });
    }
    
    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    
    await transporter.sendMail({
      from: `"CoreInventory" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Your Email - CoreInventory',
      html: `
        <h2>Email Verification</h2>
        <p>Your new verification OTP is: <strong style="font-size: 24px; letter-spacing: 3px;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `
    });
    
    res.json({ success: true, message: 'OTP resent to your email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email first.',
        requiresVerification: true,
        userId: user.id
      });
    }
    
    const token = signToken(user.id);
    res.json({ success: true, token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email.' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();
    
    // Dev only short-circuit
    if (process.env.NODE_ENV === 'development') {
        return res.json({ success: true, message: 'OTP generated (dev mode)', otp });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: `"CoreInventory" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Password Reset OTP',
      html: `<h2>Password Reset OTP</h2><p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`
    });
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
      where: { 
        email, 
        resetOtp: otp, 
        resetOtpExpiry: { [Op.gt]: new Date() } 
      } 
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    res.json({ success: true, message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      where: { 
        email, 
        resetOtp: otp, 
        resetOtpExpiry: { [Op.gt]: new Date() } 
      } 
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { 
      name, 
      avatar, 
      phoneNumber, 
      dateOfBirth, 
      address, 
      department, 
      jobTitle, 
      bio 
    } = req.body;
    
    // Update allowed fields
    if (name !== undefined) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    if (phoneNumber !== undefined) req.user.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) req.user.dateOfBirth = dateOfBirth;
    if (address !== undefined) req.user.address = address;
    if (department !== undefined) req.user.department = department;
    if (jobTitle !== undefined) req.user.jobTitle = jobTitle;
    if (bio !== undefined) req.user.bio = bio;
    
    await req.user.save();
    res.json({ success: true, user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
