const User = require('../models/User');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Interview = require('../models/Interview');

/**
 * @desc    Get system-wide analytics for admin
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalInterviews = await Interview.countDocuments({});
    const totalQuestions = await Question.countDocuments({});

    // Calculate system average score
    const scoreResult = await Interview.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const averageScore = scoreResult.length > 0 ? Math.round(scoreResult[0].avgScore) : 0;

    // Get interviews grouped by topic for admin insights
    const topicPerformance = await Interview.aggregate([
      { $group: { _id: '$topic', avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
      { $project: { topic: '$_id', avgScore: { $round: ['$avgScore', 0] }, count: 1, _id: 0 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalInterviews,
        totalQuestions,
        averageScore,
        topicPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all users list
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- TOPIC MANAGEMENT ---

/**
 * @desc    Add a new interview topic
 * @route   POST /api/admin/topic
 * @access  Private/Admin
 */
const addTopic = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide title and description' });
    }

    const topicExists = await Topic.findOne({ title });
    if (topicExists) {
      return res.status(400).json({ success: false, message: 'Topic already exists' });
    }

    const topic = await Topic.create({ title, description });

    return res.status(201).json({ success: true, data: topic });
  } catch (error) {
    console.error('Error creating topic:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update an existing topic
 * @route   PUT /api/admin/topic/:id
 * @access  Private/Admin
 */
const updateTopic = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    let topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    topic.title = title || topic.title;
    topic.description = description || topic.description;

    await topic.save();

    return res.status(200).json({ success: true, data: topic });
  } catch (error) {
    console.error('Error updating topic:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a topic and its corresponding questions
 * @route   DELETE /api/admin/topic/:id
 * @access  Private/Admin
 */
const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Delete all associated questions to prevent orphans
    await Question.deleteMany({ topicId: topic._id });

    // Delete topic
    await Topic.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Topic and associated questions deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- QUESTION MANAGEMENT ---

/**
 * @desc    Add a question to a topic
 * @route   POST /api/admin/question
 * @access  Private/Admin
 */
const addQuestion = async (req, res) => {
  try {
    const { topicId, question, difficulty } = req.body;

    if (!topicId || !question || !difficulty) {
      return res.status(400).json({ success: false, message: 'Please provide topicId, question text and difficulty' });
    }

    // Validate topic
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Associated topic not found' });
    }

    const questionObj = await Question.create({
      topicId,
      question,
      difficulty
    });

    return res.status(201).json({ success: true, data: questionObj });
  } catch (error) {
    console.error('Error adding question:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update a question
 * @route   PUT /api/admin/question/:id
 * @access  Private/Admin
 */
const updateQuestion = async (req, res) => {
  try {
    const { question, difficulty, topicId } = req.body;

    let questionObj = await Question.findById(req.params.id);
    if (!questionObj) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (topicId) {
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({ success: false, message: 'Associated topic not found' });
      }
      questionObj.topicId = topicId;
    }

    questionObj.question = question || questionObj.question;
    questionObj.difficulty = difficulty || questionObj.difficulty;

    await questionObj.save();

    return res.status(200).json({ success: true, data: questionObj });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a question
 * @route   DELETE /api/admin/question/:id
 * @access  Private/Admin
 */
const deleteQuestion = async (req, res) => {
  try {
    const questionObj = await Question.findById(req.params.id);
    if (!questionObj) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await Question.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  addTopic,
  updateTopic,
  deleteTopic,
  addQuestion,
  updateQuestion,
  deleteQuestion
};
