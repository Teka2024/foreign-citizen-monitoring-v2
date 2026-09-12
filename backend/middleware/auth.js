const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== AUTHENTICATE ====================
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('accommodationId', 'name address');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('❌ Auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// ==================== AUTHORIZE BY ROLE ====================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// ==================== AUTHORIZE OFFICER (Hotel/Accommodation) ====================
const authorizeOfficer = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has full access
    if (req.user.role === 'admin') {
      return next();
    }

    // Officer must be assigned to an accommodation
    if (req.user.role === 'officer') {
      if (!req.user.accommodationId) {
        return res.status(403).json({
          success: false,
          message: 'Officer is not assigned to any accommodation'
        });
      }
      req.officerAccommodationId = req.user.accommodationId._id || req.user.accommodationId;
      return next();
    }

    // Viewer has no access to officer-only operations
    if (req.user.role === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Viewers do not have permission to perform this action'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  };
};

// ==================== CHECK PERMISSION ====================
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has specific permission
    if (req.user.permissions?.includes(permission)) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  };
};

module.exports = { authenticate, authorize, authorizeOfficer, hasPermission };