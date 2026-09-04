const express = require('express');
const multer = require('multer');
const {
  uploadResume,
  uploadPhoto,
  getProfile,
  updateProfile,
  deleteProfile
} = require('../controllers/resumeController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Configure Multer for memory storage (max 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Resume routes
router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/photo', protect, upload.single('photo'), uploadPhoto);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);

module.exports = router;
