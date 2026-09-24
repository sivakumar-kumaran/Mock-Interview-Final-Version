const mongoose = require('mongoose');

const resumeProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  resumeFileName: {
    type: String,
    default: ''
  },
  resumeFileUrl: {
    type: String,
    default: ''
  },
  parsedAt: {
    type: Date,
    default: Date.now
  },
  basicDetails: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    cgpaOrPercentage: { type: String, default: '' }
  },
  targetRole: {
    type: String,
    default: 'Full Stack Developer'
  },
  summary: {
    type: String,
    default: ''
  },
  skills: {
    technical: [{ type: String }],
    frameworks: [{ type: String }],
    databases: [{ type: String }],
    tools: [{ type: String }],
    softSkills: [{ type: String }]
  },
  experience: [
    {
      company: { type: String, default: '' },
      role: { type: String, default: '' },
      duration: { type: String, default: '' },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      description: { type: String, default: '' },
      isInternship: { type: Boolean, default: false }
    }
  ],
  projects: [
    {
      name: { type: String, default: '' },
      technologies: [{ type: String }],
      summary: { type: String, default: '' },
      highlights: [{ type: String }],
      githubUrl: { type: String, default: '' },
      liveUrl: { type: String, default: '' }
    }
  ],
  education: [
    {
      institution: { type: String, default: '' },
      degree: { type: String, default: '' },
      fieldOfStudy: { type: String, default: '' },
      year: { type: String, default: '' },
      score: { type: String, default: '' }
    }
  ],
  certifications: [{ type: String }],
  achievements: [{ type: String }],
  areasOfInterest: [{ type: String }],
  likelyInterviewQuestions: [
    {
      category: { type: String, default: '' },
      questions: [{ type: String }]
    }
  ],
  summaryReport: {
    professionalSummary: { type: String, default: '' },
    cgpaOrPercentage: { type: String, default: '' },
    technicalSkills: {
      languages: [{ type: String }],
      coreCS: [{ type: String }],
      backend: [{ type: String }],
      frontend: [{ type: String }],
      databases: [{ type: String }],
      aiMl: [{ type: String }],
      tools: [{ type: String }]
    },
    projects: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        techStack: [{ type: String }],
        features: [{ type: String }],
        advancedConcepts: [{ type: String }],
        interviewOneLiner: { type: String, default: '' }
      }
    ],
    experienceAndTraining: [
      {
        title: { type: String, default: '' },
        organization: { type: String, default: '' },
        details: [{ type: String }],
        conceptsLearned: [{ type: String }],
        interviewOneLiner: { type: String, default: '' }
      }
    ],
    certifications: [{ type: String }],
    achievements: [{ type: String }],
    education: [
      {
        degree: { type: String, default: '' },
        institution: { type: String, default: '' },
        year: { type: String, default: '' },
        score: { type: String, default: '' }
      }
    ],
    areasOfInterest: [{ type: String }],
    likelyInterviewQuestions: [
      {
        category: { type: String, default: '' },
        questions: [{ type: String }]
      }
    ],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  rawText: {
    type: String,
    default: ''
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  extractionMethod: {
    type: String,
    default: 'gemini-validated',
    enum: ['gemini-validated', 'regex-fallback', 'openai-validated']
  },
  extractionLowConfidence: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeProfile', resumeProfileSchema);


