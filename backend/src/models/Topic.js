const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a topic title'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a topic description']
  }
});

module.exports = mongoose.model('Topic', topicSchema);
