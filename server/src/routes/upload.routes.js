const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { User } = require('../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/upload/profile-picture
router.post('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Update user's profile picture in database
    const user = await User.findByPk(req.user.id);
    user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// DELETE /api/upload/profile-picture
router.delete('/profile-picture', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    user.profilePicture = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Profile picture removal error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove profile picture' });
  }
});

module.exports = router;
