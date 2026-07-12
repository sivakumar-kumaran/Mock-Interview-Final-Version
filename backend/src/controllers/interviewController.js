const Interview = require('../models/Interview');
const Response = require('../models/Response');
const Question = require('../models/Question');
const Topic = require('../models/Topic');
const { getQuestions } = require('./questionController');
const { evaluateResponse, evaluateOverallInterview } = require('../services/geminiService');

/**
 * @desc    Start a new interview session
 * @route   POST /api/interview/start
 * @access  Private
 */
const startInterview = async (req, res) => {
  try {
    const { topicTitle, difficulty } = req.body;

    if (!topicTitle || !difficulty) {
      return res.status(400).json({ success: false, message: 'Please provide topic title and difficulty' });
    }

    // Check if topic exists
    const topicObj = await Topic.findOne({ title: { $regex: new RegExp(`^${topicTitle}$`, 'i') } });
    if (!topicObj) {
      return res.status(404).json({ success: false, message: `Topic "${topicTitle}" not found` });
    }

    // Get 5 questions using Fisher-Yates randomization (limit = 5)
    // We fetch questions for this topic and difficulty
    const questions = await Question.find({
      topicId: topicObj._id,
      difficulty
    });

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions found for this topic and difficulty. Please seed the database first.'
      });
    }

    // Shuffle questions
    // --- DSA IMPLEMENTATION: Fisher-Yates Shuffle ---
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Select 5 questions
    const interviewQuestions = shuffled.slice(0, 5);

    // Create the Interview document
    const interview = await Interview.create({
      userId: req.user.id,
      topic: topicObj.title,
      difficulty,
      status: 'completed', // Default status, updated on submit if terminated
      violationsCount: 0,
      violations: []
    });

    // --- DSA IMPLEMENTATION: Queue ---
    // Comment: The frontend maintains the interview flow as a Queue.
    // The list of selected questions is sent as an array. The client processes them
    // in a First-In-First-Out (FIFO) order: enqueuing the 5 questions, displaying
    // the head of the queue (active question), and dequeuing it (shift) upon submission
    // to move to the next item.
    return res.status(201).json({
      success: true,
      data: {
        interviewId: interview._id,
        topic: interview.topic,
        difficulty: interview.difficulty,
        questions: interviewQuestions.map(q => ({
          _id: q._id,
          question: q.question
        }))
      }
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Submit candidate answers for evaluation
 * @route   POST /api/interview/submit
 * @access  Private
 */
const submitInterview = async (req, res) => {
  try {
    const { interviewId, responses, violations, status } = req.body;

    if (!interviewId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ success: false, message: 'Please provide interview ID and responses' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    // Verify ownership
    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this interview' });
    }

    // Save violation info
    if (violations && Array.isArray(violations)) {
      interview.violations = violations.map(v => ({
        type: v.type,
        timestamp: v.timestamp || new Date()
      }));
      interview.violationsCount = violations.length;
    }

    if (status) {
      interview.status = status; // e.g. 'terminated' or 'completed'
    }

    console.log(`Evaluating interview ${interviewId} (${interview.topic}). Violations: ${interview.violationsCount}`);

    // Evaluate each response sequentially
    const evaluatedResponses = [];
    let sumScore = 0;

    for (let i = 0; i < responses.length; i++) {
      const resItem = responses[i];
      
      // Request evaluation from Gemini API (includes fallback inside the service)
      const evaluation = await evaluateResponse(
        resItem.question,
        resItem.answer,
        interview.difficulty
      );

      sumScore += evaluation.score;

      // Save to database
      const savedResponse = await Response.create({
        interviewId,
        question: resItem.question,
        answer: resItem.answer || '',
        evaluation
      });

      evaluatedResponses.push(savedResponse);
    }

    // Calculate average score
    const totalResponses = responses.length;
    const finalScore = totalResponses > 0 ? Math.round(sumScore / totalResponses) : 0;

    // Get overall feedback summary from Gemini
    const overallFeedback = await evaluateOverallInterview(evaluatedResponses);

    // Check if any response was skipped or left unanswered (due to early termination)
    const hasSkippedResponses = responses.some(r => !r.answer || r.answer.trim() === '');
    const hasUnansweredQuestions = status === 'terminated' || responses.length < 5;

    if (hasSkippedResponses || hasUnansweredQuestions) {
      if (!overallFeedback.suggestions) {
        overallFeedback.suggestions = [];
      }
      if (!overallFeedback.suggestions.includes("Try to answer, don't skip questions.")) {
        overallFeedback.suggestions.push("Try to answer, don't skip questions.");
      }
    }

    // Update Interview details
    interview.score = finalScore;
    interview.feedback = {
      summary: overallFeedback.summary,
      strengths: overallFeedback.strengths,
      weaknesses: overallFeedback.weaknesses,
      suggestions: overallFeedback.suggestions
    };

    await interview.save();

    return res.status(200).json({
      success: true,
      data: {
        interview,
        responses: evaluatedResponses
      }
    });
  } catch (error) {
    console.error('Error submitting interview:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get user interview history
 * @route   GET /api/interview/history
 * @access  Private
 */
const getHistory = async (req, res) => {
  try {
    // Get interviews sorted by date descending (newest first)
    const interviews = await Interview.find({ userId: req.user.id }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get interview session details and answers
 * @route   GET /api/interview/:id
 * @access  Private
 */
const getInterviewDetails = async (req, res) => {
  try {
    const interviewId = req.params.id;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Ensure authorized user
    if (interview.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this interview' });
    }

    // Fetch matching responses
    const responses = await Response.find({ interviewId });

    return res.status(200).json({
      success: true,
      data: {
        interview,
        responses
      }
    });
  } catch (error) {
    console.error('Error fetching interview details:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Ensure authorized user
    if (interview.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this interview' });
    }

    // Delete related responses
    await Response.deleteMany({ interviewId });

    // Delete the interview itself
    await Interview.findByIdAndDelete(interviewId);

    return res.status(200).json({
      success: true,
      message: 'Interview session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting interview:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  startInterview,
  submitInterview,
  getHistory,
  getInterviewDetails,
  deleteInterview
};
