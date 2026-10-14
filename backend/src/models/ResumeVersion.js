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

// --- Explicit Indexes ---
// Fetch all versions for a user sorted by version number (ascending)
resumeVersionSchema.index({ userId: 1, versionNumber: 1 });
// Sort all versions by upload date (admin analytics)
resumeVersionSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
