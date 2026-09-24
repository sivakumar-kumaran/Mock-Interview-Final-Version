const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  interviewType: {
    type: String,
    enum: ['topic', 'resume'],
    default: 'topic'
  },
  resumeProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeProfile'
  },
  targetRole: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'terminated'],
    default: 'in-progress'
  },
  violationsCount: {
    type: Number,
    default: 0
  },
  violations: [
    {
      type: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  metrics: {
    resumeUnderstanding: { type: Number, default: 0 },
    projectKnowledge: { type: Number, default: 0 },
    technicalDepth: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    domainKnowledge: { type: Number, default: 0 },
    employabilityScore: { type: Number, default: 0 }
  },
  feedback: {
    summary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', interviewSchema);
