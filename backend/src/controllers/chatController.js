const geminiService = require('../services/geminiService');

/**
 * @desc    Chat with the AI interview assistant
 * @route   POST /api/chat
 * @access  Public
 */
const handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const reply = await geminiService.chatWithAI(message, history || []);
    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('Error in chat controller:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  handleChat
};
