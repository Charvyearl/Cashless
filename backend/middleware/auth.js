const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { pool } = require('../config/database');
const Student = require('../models/Student');
const Personnel = require('../models/Personnel');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Development mock token support: 'mock-jwt-token-<userId>'
    if (token.startsWith('mock-jwt-token-')) {
      const mockedId = parseInt(token.replace('mock-jwt-token-', ''), 10);
      if (!Number.isNaN(mockedId)) {
        const mockRole = mockedId === 1 ? 'admin' : 'staff';
        req.user = {
          id: mockedId,
          rfid_card_id: mockRole === 'admin' ? 'ADMIN001' : 'STAFF001',
          first_name: mockRole === 'admin' ? 'Admin' : 'Staff',
          last_name: mockRole === 'admin' ? 'User' : 'Member',
          user_type: mockRole,
          is_active: true
        };
        return next();
      }
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Resolve user based on token userType
    let resolved = null;
    if (decoded.userType === 'student') {
      const student = await Student.findById(decoded.userId);
      if (student && student.is_active) {
        resolved = {
          id: student.user_id,
          rfid_card_id: student.rfid_card_id,
          first_name: student.first_name,
          last_name: student.last_name,
          user_type: 'student',
          is_active: true,
        };
      }
    } else {
      const personnel = await Personnel.findById(decoded.userId);
      if (personnel && personnel.is_active) {
        resolved = {
          id: personnel.personnel_id,
          rfid_card_id: personnel.rfid_card_id,
          first_name: personnel.first_name,
          last_name: personnel.last_name,
          user_type: decoded.userType === 'admin' ? 'admin' : 'staff',
          is_active: true,
        };
      }
    }

    if (!resolved) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = resolved;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is staff or admin
const requireStaff = (req, res, next) => {
  if (!['staff', 'admin'].includes(req.user.user_type)) {
    return res.status(403).json({
      success: false,
      message: 'Staff or admin access required'
    });
  }
  next();
};

// Check if user is student
const requireStudent = (req, res, next) => {
  if (req.user.user_type !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student access required'
    });
  }
  next();
};

// Optional auth - doesn't fail if no token (supports students and personnel)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);

    // Resolve user based on token userType
    let userRecord = null;
    if (decoded.userType === 'student') {
      const Student = require('../models/Student');
      userRecord = await Student.findById(decoded.userId);
      if (userRecord && userRecord.is_active) {
        req.user = {
          id: userRecord.user_id,
          rfid_card_id: userRecord.rfid_card_id,
          first_name: userRecord.first_name,
          last_name: userRecord.last_name,
          user_type: 'student',
          is_active: true,
        };
      }
    } else {
      const Personnel = require('../models/Personnel');
      const personnel = await Personnel.findById(decoded.userId);
      if (personnel && personnel.is_active) {
        req.user = {
          id: personnel.personnel_id,
          rfid_card_id: personnel.rfid_card_id,
          first_name: personnel.first_name,
          last_name: personnel.last_name,
          user_type: decoded.userType === 'admin' ? 'admin' : 'staff',
          is_active: true,
        };
      }
    }

    if (!req.user) {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireStaff,
  requireStudent,
  optionalAuth
};
