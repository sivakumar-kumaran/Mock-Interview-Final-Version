const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Determine role (make first registered user an admin for convenience if desired, or let email decide, or default to user)
    // We can auto-admin specific emails or just allow setting role during registration for development/demo.
    const userRole = role && ['user', 'admin'].includes(role) ? role : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || '',
          targetRole: user.targetRole || 'Full Stack Developer',
          hasUploadedResume: user.hasUploadedResume || false,
          token: generateToken(user._id)
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message,
      ...(process.env.NODE_ENV === 'production' ? {} : { stack: error.stack })
    });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user (must specify select('+password') because we hid it in User model schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        targetRole: user.targetRole || 'Full Stack Developer',
        hasUploadedResume: user.hasUploadedResume || false,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message,
      ...(process.env.NODE_ENV === 'production' ? {} : { stack: error.stack })
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  // Since we are using standard stateless JWT tokens stored in localStorage,
  // we just return success and let the client discard the token.
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  logout
};
