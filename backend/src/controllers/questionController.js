const mongoose = require('mongoose');
const Question = require('../models/Question');
const Topic = require('../models/Topic');
const { mockTopics, mockQuestions } = require('../config/mockDb');

// --- DSA IMPLEMENTATION: Fisher-Yates Shuffle ---
/**
 * Fisher-Yates Shuffle Algorithm
 * Explaining implementation:
 * This algorithm shuffles an array in-place. It runs in O(n) time complexity and O(1) auxiliary space complexity.
 * It starts from the last element (index n-1) and swaps it with a randomly selected element from index 0 to i (inclusive).
 * This ensures every permutation of the array is equally likely, providing a truly randomized, duplicate-free sequence.
 */
const shuffleQuestions = (array) => {
  const shuffled = [...array]; // Copy array to avoid mutating original schema lists
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
};

/**
 * @desc    Get questions by topic and optional difficulty with Fisher-Yates shuffle
 * @route   GET /api/questions
 * @access  Public
 */
const getQuestions = async (req, res) => {
  try {
    const { topicId, topicTitle, difficulty, limit } = req.query;

    // Check if MongoDB is connected, otherwise fall back to mock data
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning in-memory mock questions.');
      
      let selectedTopicTitle = '';
      if (topicTitle) {
        selectedTopicTitle = topicTitle;
      } else if (topicId) {
        const topic = mockTopics.find(t => t._id === topicId);
        if (topic) {
          selectedTopicTitle = topic.title;
        }
      }

      // If no topic selected, return all questions merged
      let queryQuestions = [];
      if (selectedTopicTitle) {
        queryQuestions = mockQuestions[selectedTopicTitle] || [];
      } else {
        Object.values(mockQuestions).forEach(list => {
          queryQuestions = queryQuestions.concat(list);
        });
      }

      // Filter by difficulty
      if (difficulty) {
        queryQuestions = queryQuestions.filter(q => q.difficulty === difficulty);
      }

      // Shuffle
      let randomized = shuffleQuestions(queryQuestions);

      // Limit
      if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          randomized = randomized.slice(0, parsedLimit);
        }
      }

      return res.status(200).json({
        success: true,
        count: randomized.length,
        data: randomized
      });
    }

    let filter = {};

    // Filter by topicId or topicTitle (we check both to make API flexible)
    if (topicId) {
      filter.topicId = topicId;
    } else if (topicTitle) {
      const topic = await Topic.findOne({ title: { $regex: new RegExp(`^${topicTitle}$`, 'i') } });
      if (topic) {
        filter.topicId = topic._id;
      } else {
        return res.status(404).json({ success: false, message: 'Topic not found' });
      }
    }

    // Filter by difficulty if provided
    if (difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    // --- DSA IMPLEMENTATION: Array ---
    // Comment: Mongoose find returns an Array of question objects. 
    // We store questions in an array to perform O(1) random indexing and shuffle operations.
    let questions = await Question.find(filter);

    if (questions.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Shuffle the array of questions using Fisher-Yates
    let randomizedQuestions = shuffleQuestions(questions);

    // Limit if requested (e.g., 5 questions for interview)
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        randomizedQuestions = randomizedQuestions.slice(0, parsedLimit);
      }
    }

    return res.status(200).json({
      success: true,
      count: randomizedQuestions.length,
      data: randomizedQuestions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getQuestions,
  shuffleQuestions
};
