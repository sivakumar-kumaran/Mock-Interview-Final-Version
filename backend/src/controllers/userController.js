const User = require('../models/User');
const Interview = require('../models/Interview');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get user profile and statistics
 * @route   GET /api/user/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch user interviews
    const interviews = await Interview.find({ userId: req.user.id });

    // --- DSA IMPLEMENTATION: HashMap ---
    // Comment: We use a HashMap (in JS, an Object) to record topic scores.
    // The key is the topic title, and the value is an array of scores.
    // This allows O(1) lookup to aggregate scores for each topic dynamically.
    const topicHashMap = {};

    let totalScore = 0;
    let highestScore = 0;

    interviews.forEach(interview => {
      totalScore += interview.score;
      if (interview.score > highestScore) {
        highestScore = interview.score;
      }

      if (!topicHashMap[interview.topic]) {
        topicHashMap[interview.topic] = [];
      }
      topicHashMap[interview.topic].push(interview.score);
    });

    const totalInterviews = interviews.length;
    const averageScore = totalInterviews > 0 ? Math.round(totalScore / totalInterviews) : 0;

    // Calculate topic-wise average scores from our HashMap
    // Also determine the best and weakest topics
    let bestTopic = 'N/A';
    let weakestTopic = 'N/A';
    let maxTopicAvg = -1;
    let minTopicAvg = 101;
    const topicPerformance = [];

    for (const [topic, scores] of Object.entries(topicHashMap)) {
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / scores.length);
      topicPerformance.push({ topic, avgScore: avg, count: scores.length });

      if (avg > maxTopicAvg) {
        maxTopicAvg = avg;
        bestTopic = topic;
      }
      if (avg < minTopicAvg) {
        minTopicAvg = avg;
        weakestTopic = topic;
      }
    }

    // Performance trend over dates (Sort interviews chronologically)
    // --- DSA IMPLEMENTATION: Sorting ---
    // Comment: We use Array.prototype.sort (which uses Timsort) to sort the interviews
    // chronologically by date. This allows us to display a timeline progression of the user's progress.
    const sortedInterviews = [...interviews].sort((a, b) => new Date(a.date) - new Date(b.date));
    const performanceTrend = sortedInterviews.map(i => ({
      date: i.date,
      score: i.score,
      topic: i.topic
    }));

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          avatarUrl: user.avatarUrl || '',
          targetRole: user.targetRole || 'Full Stack Developer',
          hasUploadedResume: user.hasUploadedResume || false,
          role: user.role,
          createdAt: user.createdAt
        },
        stats: {
          totalInterviews,
          averageScore,
          highestScore,
          bestTopic: totalInterviews > 0 ? bestTopic : 'N/A',
          weakestTopic: totalInterviews > 0 ? weakestTopic : 'N/A',
          topicPerformance,
          performanceTrend
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/user/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone, targetRole, avatarUrl, password, currentPassword } = req.body;

    // Check if updating email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already taken' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (targetRole) user.targetRole = targetRole;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    // Check if updating password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }

      // Check current password (must retrieve with password field selected)
      const userWithPass = await User.findById(req.user.id).select('+password');
      const isMatch = await userWithPass.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      user.password = password;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        targetRole: user.targetRole || 'Full Stack Developer',
        hasUploadedResume: user.hasUploadedResume || false,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
