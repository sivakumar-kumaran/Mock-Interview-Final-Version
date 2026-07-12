const express = require('express');
const {
  getAnalytics,
  getUsers,
  addTopic,
  updateTopic,
  deleteTopic,
  addQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/auth');

const router = express.Router();

// Apply protect and admin to all routes here
router.use(protect);
router.use(admin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);

router.post('/topic', addTopic);
router.route('/topic/:id')
  .put(updateTopic)
  .delete(deleteTopic);

router.post('/question', addQuestion);
router.route('/question/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;
