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

module.exports = mongoose.model('Question', questionSchema);
