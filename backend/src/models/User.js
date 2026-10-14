const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    index: true,          // Primary login lookup — covered by unique index
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  hasUploadedResume: {
    type: Boolean,
    default: false
  },
  targetRole: {
    type: String,
    default: 'Full Stack Developer'
  },
  resumeInterviewStats: {
    lastInterviewDate: { type: Date, default: null },
    cooldownUntil: { type: Date, default: null },
    weeklyCount: { type: Number, default: 0 },
    weeklyWindowStart: { type: Date, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true           // For admin sorting by join date
  }
});

// --- Explicit Indexes ---
// email is already indexed via unique:true above.
// role index speeds up admin-panel queries that filter users by role.
userSchema.index({ role: 1 });
// Compound index: useful for paginating users sorted by creation date per role.
userSchema.index({ role: 1, createdAt: -1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
