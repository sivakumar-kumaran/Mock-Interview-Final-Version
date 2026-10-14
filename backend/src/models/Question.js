const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  question: {
    type: String,
    required: [true, 'Please add a question text'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: [true, 'Please add a difficulty level']
  }
});

// --- Explicit Indexes ---
// Primary practice-page query: all questions for a topic (with optional difficulty filter)
questionSchema.index({ topicId: 1, difficulty: 1 });
// Secondary: filter by difficulty alone (e.g., 'all Beginner questions')
questionSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
