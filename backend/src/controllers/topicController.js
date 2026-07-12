const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const { mockTopics } = require('../config/mockDb');

/**
 * @desc    Get all topics
 * @route   GET /api/topics
 * @access  Public
 */
const getTopics = async (req, res) => {
  try {
    // Check if MongoDB is connected, otherwise fall back to mock data
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning in-memory mock topics.');
      return res.status(200).json({
        success: true,
        data: mockTopics
      });
    }

    const topics = await Topic.find({});
    
    // Aggregate question counts per topic
    const topicsWithCount = await Promise.all(
      topics.map(async (topic) => {
        const questionCount = await Question.countDocuments({ topicId: topic._id });
        return {
          _id: topic._id,
          title: topic.title,
          description: topic.description,
          questionCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: topicsWithCount
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getTopics
};
