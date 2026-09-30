const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'ordercraft_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
async function registerUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        error: 'Duplicate email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff',
    });

    const token = signToken(user._id);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Authentication failed',
      });
    }

    const token = signToken(user._id);
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  return res.json({
    success: true,
    message: 'Current authenticated user retrieved',
    data: req.user,
  });
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
