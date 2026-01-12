const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ msg: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ msg: 'Token expired.' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ msg: 'Server error during authentication.' });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Authentication required.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ msg: 'Server error during authorization.' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Silently fail - user is not authenticated but request continues
    next();
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  optionalAuth
};
