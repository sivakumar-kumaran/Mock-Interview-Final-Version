const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  resumeFileName: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  targetRole: {
    type: String,
    default: ''
  },
  skills: [{ type: String }],
  skillsAddedSinceLastVersion: [{ type: String }],
  projectsCount: {
    type: Number,
    default: 0
  },
  experienceCount: {
    type: Number,
    default: 0
  },
  profileCompletenessScore: {
    type: Number,
    default: 0
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
