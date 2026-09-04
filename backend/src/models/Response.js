const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'technical' // intro, project, technical, coding, database, behavioral
  },
  responseType: {
    type: String,
    enum: ['verbal', 'coding'],
    default: 'verbal'
  },
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  testCaseResults: [
    {
      testCase: Number,
      passed: Boolean,
      input: String,
      expected: String,
      actual: String,
      details: String
    }
  ],
  evaluation: {
    score: { type: Number, default: 0 },
    technicalAccuracy: { type: Number, default: 0 },
    keywordCoverage: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    feedback: { type: String, default: '' }
  }
});

module.exports = mongoose.model('Response', responseSchema);
