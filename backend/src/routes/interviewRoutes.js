const express = require('express');
const {
  startInterview,
  submitInterview,
  getHistory,
  getInterviewDetails,
  deleteInterview
} = require('../controllers/interviewController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/start', protect, startInterview);
router.post('/submit', protect, submitInterview);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getInterviewDetails);
router.delete('/:id', protect, deleteInterview);

module.exports = router;
