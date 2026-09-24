const Interview = require('../models/Interview');
const Response = require('../models/Response');
const Question = require('../models/Question');
const Topic = require('../models/Topic');
const User = require('../models/User');
const ResumeProfile = require('../models/ResumeProfile');
const {
  evaluateResponse,
  evaluateOverallInterview,
  generateResumeInterviewQuestions,
  evaluateCodeSubmission,
  evaluateResumeInterviewOverall
} = require('../services/geminiService');

// ==========================================
// VERSION 1: TOPIC-BASED INTERVIEWS
// ==========================================

/**
 * @desc    Start a new topic-based interview session (Version 1)
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

    // Fetch questions for this topic and difficulty
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

    // Shuffle questions with Fisher-Yates
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
      interviewType: 'topic',
      difficulty,
      status: 'in-progress',
      violationsCount: 0,
      violations: []
    });

    return res.status(201).json({
      success: true,
      data: {
        interviewId: interview._id,
        topic: interview.topic,
        difficulty: interview.difficulty,
        interviewType: 'topic',
        questions: interviewQuestions.map(q => ({
          _id: q._id,
          question: q.question
        }))
      }
    });
  } catch (error) {
    console.error('Error starting topic interview:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Submit topic-based interview candidate answers for evaluation (Version 1)
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

    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this interview' });
    }

    if (violations && Array.isArray(violations)) {
      interview.violations = violations.map(v => ({
        type: v.type,
        timestamp: v.timestamp || new Date()
      }));
      interview.violationsCount = violations.length;
    }

    if (status) {
      interview.status = status;
    }

    console.log(`Evaluating interview ${interviewId} (${interview.topic}). Violations: ${interview.violationsCount}`);

    const evaluatedResponses = [];
    let sumScore = 0;

    for (let i = 0; i < responses.length; i++) {
      const resItem = responses[i];
      const evaluation = await evaluateResponse(
        resItem.question,
        resItem.answer,
        interview.difficulty
      );

      sumScore += evaluation.score;

      const savedResponse = await Response.create({
        interviewId,
        question: resItem.question,
        answer: resItem.answer || '',
        category: 'technical',
        responseType: 'verbal',
        evaluation
      });

      evaluatedResponses.push(savedResponse);
    }

    const totalResponses = responses.length;
    const finalScore = totalResponses > 0 ? Math.round(sumScore / totalResponses) : 0;
    const overallFeedback = await evaluateOverallInterview(evaluatedResponses);

    const hasSkippedResponses = responses.some(r => !r.answer || r.answer.trim() === '');
    const hasUnansweredQuestions = status === 'terminated' || responses.length < 5;

    if (hasSkippedResponses || hasUnansweredQuestions) {
      if (!overallFeedback.suggestions) overallFeedback.suggestions = [];
      if (!overallFeedback.suggestions.includes("Try to answer, don't skip questions.")) {
        overallFeedback.suggestions.push("Try to answer, don't skip questions.");
      }
    }

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
    console.error('Error submitting topic interview:', error);
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
    const rawInterviews = await Interview.find({
      userId: req.user.id,
      $or: [
        { status: { $in: ['completed', 'terminated'] } },
        { score: { $gt: 0 } }
      ]
    }).sort({ date: -1 });

    // Deduplicate by ID and ensure valid unique completed sessions
    const seenIds = new Set();
    const interviews = [];
    for (const item of rawInterviews) {
      const idStr = item._id.toString();
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        interviews.push(item);
      }
    }

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

    if (interview.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this interview' });
    }

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

/**
 * @desc    Delete interview session
 * @route   DELETE /api/interview/:id
 * @access  Private
 */
const deleteInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this interview' });
    }

    await Response.deleteMany({ interviewId });
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

// ==========================================
// VERSION 2: RESUME-BASED AI INTERVIEWS
// ==========================================

/**
 * Cooldown helper to calculate eligibility (3-day lock, max 2 / week)
 */
const checkUserResumeEligibility = (user) => {
  const stats = user.resumeInterviewStats || {};
  const now = new Date();

  // 1. Check 3-day cooldown
  if (stats.cooldownUntil && new Date(stats.cooldownUntil) > now) {
    const diffMs = new Date(stats.cooldownUntil).getTime() - now.getTime();
    const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
    return {
      eligible: false,
      reason: 'cooldown_active',
      cooldownUntil: stats.cooldownUntil,
      hoursRemaining,
      message: `Resume interview locked. Cooldown active for ${hoursRemaining} more hour(s).`
    };
  }

  // 2. Check 7-day weekly window (Max 2 per week)
  const windowStart = stats.weeklyWindowStart ? new Date(stats.weeklyWindowStart) : null;
  const isWindowExpired = !windowStart || (now.getTime() - windowStart.getTime()) > (7 * 24 * 60 * 60 * 1000);

  let currentWeeklyCount = stats.weeklyCount || 0;
  if (isWindowExpired) {
    currentWeeklyCount = 0;
  }

  if (currentWeeklyCount >= 2) {
    const windowEnd = new Date(windowStart.getTime() + (7 * 24 * 60 * 60 * 1000));
    const hoursToReset = Math.ceil((windowEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
    return {
      eligible: false,
      reason: 'weekly_limit_reached',
      unlockTime: windowEnd,
      hoursRemaining: hoursToReset,
      message: `Weekly limit reached (2/2 completed). Resets in ${hoursToReset} hour(s).`
    };
  }

  return {
    eligible: true,
    remainingWeekly: 2 - currentWeeklyCount,
    cooldownUntil: stats.cooldownUntil,
    weeklyCount: currentWeeklyCount
  };
};

/**
 * @desc    Check if user is eligible to start a Resume Interview
 * @route   GET /api/interview/resume/eligibility
 * @access  Private
 */
const getResumeEligibility = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasProfile = await ResumeProfile.exists({ userId: req.user.id });
    const eligibility = checkUserResumeEligibility(user);

    return res.status(200).json({
      success: true,
      data: {
        ...eligibility,
        hasUploadedResume: Boolean(hasProfile)
      }
    });
  } catch (error) {
    console.error('Error in getResumeEligibility:', error);
    return res.status(500).json({ success: false, message: 'Server error checking eligibility' });
  }
};

/**
 * @desc    Start dynamic Resume-Based Interview Session (Version 2)
 * @route   POST /api/interview/resume/start
 * @access  Private
 */
const startResumeInterview = async (req, res) => {
  try {
    const { difficulty = 'Intermediate' } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Check Cooldown & Weekly limit
    const eligibility = checkUserResumeEligibility(user);
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message: eligibility.message,
        data: eligibility
      });
    }

    // 2. Fetch User's Structured Resume Profile
    const profile = await ResumeProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'No resume profile found. Please upload your resume in the Resume Intelligence dashboard first.'
      });
    }

    // 3. Generate dynamic question queue from structured profile
    console.log(`[InterviewController] Generating resume-based questions for ${user.email} (${profile.targetRole || 'Full Stack Developer'})`);
    const dynamicQuestions = await generateResumeInterviewQuestions(profile, difficulty);

    // 4. Create Interview record
    const interview = await Interview.create({
      userId: req.user.id,
      topic: `Resume Interview — ${profile.targetRole || 'Personalized'}`,
      interviewType: 'resume',
      resumeProfileId: profile._id,
      targetRole: profile.targetRole || 'Full Stack Developer',
      difficulty,
      status: 'in-progress',
      violationsCount: 0,
      violations: []
    });

    return res.status(201).json({
      success: true,
      message: 'Resume-Based Interview session started!',
      data: {
        interviewId: interview._id,
        topic: interview.topic,
        interviewType: 'resume',
        targetRole: interview.targetRole,
        difficulty: interview.difficulty,
        questions: dynamicQuestions
      }
    });
  } catch (error) {
    console.error('Error in startResumeInterview:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

const { SQL_QUESTIONS, PROGRAMMING_QUESTIONS } = require('../data/codingQuestions');

/**
 * @desc    Run and evaluate code submission in real-time
 * @route   POST /api/interview/resume/code-run
 * @access  Private
 */
const runCodeEvaluation = async (req, res) => {
  try {
    const { question, code, language, testCases } = req.body;

    if (!question || !code) {
      return res.status(400).json({ success: false, message: 'Please provide question and code.' });
    }

    let activeTestCases = testCases || [];
    if (!activeTestCases.length) {
      const matched = PROGRAMMING_QUESTIONS.find(p => question.includes(p.title) || p.title.includes(question))
        || SQL_QUESTIONS.find(s => question.includes(s.title) || s.title.includes(question));
      if (matched && matched.testCases) {
        activeTestCases = matched.testCases;
      }
    }

    const evaluation = await evaluateCodeSubmission(question, code, language || 'javascript', activeTestCases);

    return res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error running code evaluation:', error);
    return res.status(500).json({ success: false, message: 'Failed to evaluate code.' });
  }
};

/**
 * @desc    Submit Resume Interview with 8-metric evaluation & update cooldown
 * @route   POST /api/interview/resume/submit
 * @access  Private
 */
const submitResumeInterview = async (req, res) => {
  try {
    const { interviewId, responses, violations, status } = req.body;

    if (!interviewId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ success: false, message: 'Please provide interview ID and responses' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (violations && Array.isArray(violations)) {
      interview.violations = violations.map(v => ({
        type: v.type,
        timestamp: v.timestamp || new Date()
      }));
      interview.violationsCount = violations.length;
    }

    if (status) {
      interview.status = status;
    }

    const user = await User.findById(req.user.id);
    const profile = await ResumeProfile.findOne({ userId: req.user.id });

    const evaluatedResponses = [];
    let sumScore = 0;

    for (let i = 0; i < responses.length; i++) {
      const resItem = responses[i];
      let evaluation = null;

      if (resItem.responseType === 'coding' || resItem.type === 'coding' || resItem.code) {
        let activeTestCases = resItem.testCases || [];
        if (!activeTestCases.length) {
          const matched = PROGRAMMING_QUESTIONS.find(p => (resItem.question || '').includes(p.title) || p.title.includes(resItem.question || ''))
            || SQL_QUESTIONS.find(s => (resItem.question || '').includes(s.title) || s.title.includes(resItem.question || ''));
          if (matched && matched.testCases) {
            activeTestCases = matched.testCases;
          }
        }

        evaluation = await evaluateCodeSubmission(
          resItem.question,
          resItem.code || resItem.answer,
          resItem.language || 'javascript',
          activeTestCases
        );
      } else {
        evaluation = await evaluateResponse(
          resItem.question,
          resItem.answer || '',
          interview.difficulty
        );
      }

      sumScore += evaluation.score || 0;

      const savedResponse = await Response.create({
        interviewId,
        question: resItem.question,
        category: resItem.category || 'technical',
        responseType: resItem.responseType || resItem.type || 'verbal',
        code: resItem.code || '',
        language: resItem.language || 'javascript',
        testCaseResults: evaluation.testCaseResults || [],
        answer: resItem.answer || '',
        evaluation
      });

      evaluatedResponses.push(savedResponse);
    }

    const finalScore = responses.length > 0 ? Math.round(sumScore / responses.length) : 0;
    const overallReport = await evaluateResumeInterviewOverall(evaluatedResponses, profile);

    interview.score = finalScore;
    interview.metrics = {
      resumeUnderstanding: overallReport.metrics?.resumeUnderstanding || finalScore,
      projectKnowledge: overallReport.metrics?.projectKnowledge || finalScore,
      technicalDepth: overallReport.metrics?.technicalDepth || finalScore,
      problemSolving: overallReport.metrics?.problemSolving || finalScore,
      communication: overallReport.metrics?.communication || finalScore,
      confidence: overallReport.metrics?.confidence || finalScore,
      domainKnowledge: overallReport.metrics?.domainKnowledge || finalScore,
      employabilityScore: overallReport.metrics?.employabilityScore || finalScore
    };
    interview.feedback = {
      summary: overallReport.summary,
      strengths: overallReport.strengths,
      weaknesses: overallReport.weaknesses,
      suggestions: overallReport.suggestions
    };

    await interview.save();

    // Update User Cooldown & Weekly window
    const now = new Date();
    const cooldownDurationMs = 3 * 24 * 60 * 60 * 1000; // 3 days lock
    const cooldownUntil = new Date(now.getTime() + cooldownDurationMs);

    const stats = user.resumeInterviewStats || {};
    const windowStart = stats.weeklyWindowStart ? new Date(stats.weeklyWindowStart) : null;
    const isWindowExpired = !windowStart || (now.getTime() - windowStart.getTime()) > (7 * 24 * 60 * 60 * 1000);

    const newWeeklyWindowStart = isWindowExpired ? now : windowStart;
    const newWeeklyCount = isWindowExpired ? 1 : ((stats.weeklyCount || 0) + 1);

    await User.findByIdAndUpdate(req.user.id, {
      resumeInterviewStats: {
        lastInterviewDate: now,
        cooldownUntil: cooldownUntil,
        weeklyCount: newWeeklyCount,
        weeklyWindowStart: newWeeklyWindowStart
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Resume interview evaluated and submitted successfully!',
      data: {
        interview,
        responses: evaluatedResponses,
        cooldown: {
          cooldownUntil,
          weeklyCount: newWeeklyCount,
          remainingWeekly: Math.max(0, 2 - newWeeklyCount)
        }
      }
    });
  } catch (error) {
    console.error('Error submitting resume interview:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

module.exports = {
  startInterview,
  submitInterview,
  getHistory,
  getInterviewDetails,
  deleteInterview,
  getResumeEligibility,
  startResumeInterview,
  runCodeEvaluation,
  submitResumeInterview
};
