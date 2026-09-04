const express = require('express');
const {
  startInterview,
  submitInterview,
  getHistory,
  getInterviewDetails,
  deleteInterview,
  getResumeEligibility,
  startResumeInterview,
  runCodeEvaluation,
  submitResumeInterview
} = require('../controllers/interviewController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Version 1 (Topic-based) Routes
router.post('/start', protect, startInterview);
router.post('/submit', protect, submitInterview);
router.get('/history', protect, getHistory);

// Version 2 (Resume-based) Routes
router.get('/resume/eligibility', protect, getResumeEligibility);
router.post('/resume/start', protect, startResumeInterview);
router.post('/resume/code-run', protect, runCodeEvaluation);
router.post('/resume/submit', protect, submitResumeInterview);

// Shared / Detail Routes
router.get('/:id', protect, getInterviewDetails);
router.delete('/:id', protect, deleteInterview);

module.exports = router;

