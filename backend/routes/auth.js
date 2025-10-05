const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Personnel = require('../models/Personnel');
const { generateToken } = require('../utils/jwt');
const { validate } = require('../utils/validation');
const { userSchemas } = require('../utils/validation');
const bcrypt = require('bcryptjs');

// Register new user (admin only)
router.post('/register', validate(userSchemas.register), async (req, res) => {
  try {
    const { rfid_card_id, student_id, first_name, last_name, email, phone, user_type } = req.body;
    
    // Check if RFID card already exists
    const existingUser = await User.findByRfidCardId(rfid_card_id);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'RFID card already registered'
      });
    }
    
    // Check if student ID already exists (if provided)
    if (student_id) {
      const existingStudent = await User.findByStudentId(student_id);
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already registered'
        });
      }
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }
    
    // Create new user
    const user = await User.create({
      rfid_card_id,
      student_id,
      first_name,
      last_name,
      email,
      phone,
      user_type
    });
    
    // Generate JWT token
    const token = generateToken(user.id, user.user_type);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          rfid_card_id: user.rfid_card_id,
          student_id: user.student_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          user_type: user.user_type
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login with RFID card (supports students and personnel tables)
router.post('/login', async (req, res) => {
  try {
    const { rfid_card_id, email, password } = req.body || {};

    // If email/password are provided, handle email login inline (compat mode)
    if (email && password) {
      // Try student first
      let account = await Student.findByEmail(email);
      let userType = 'student';
      let idField = 'user_id';

      if (!account) {
        account = await Personnel.findByEmail(email);
        userType = 'staff';
        idField = 'personnel_id';
      }

      if (!account) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (account.is_active === false) {
        return res.status(401).json({ success: false, message: 'Account is inactive' });
      }

      const ok = await bcrypt.compare(password, account.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const userId = account[idField];
      const token = generateToken(userId, userType);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: userId,
            rfid_card_id: account.rfid_card_id,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            user_type: userType,
          },
          wallet: { balance: Number(account.balance || 0) },
          token,
        },
      });
    }

    if (!rfid_card_id) {
      return res.status(400).json({ success: false, message: 'RFID card ID is required' });
    }

    let account = await Student.findByRfidCardId(rfid_card_id);
    let userType = 'student';
    let id = account?.user_id;

    if (!account) {
      const personnel = await Personnel.findByRfidCardId(rfid_card_id);
      if (!personnel) {
        return res.status(401).json({ success: false, message: 'Invalid RFID card' });
      }
      if (personnel.is_active === false) {
        return res.status(401).json({ success: false, message: 'Account is inactive' });
      }
      account = personnel;
      userType = 'staff';
      id = personnel.personnel_id;
    } else if (account.is_active === false) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const token = generateToken(id, userType);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id,
          rfid_card_id: account.rfid_card_id,
          first_name: account.first_name,
          last_name: account.last_name,
          email: account.email,
          user_type: userType,
        },
        wallet: { balance: Number(account.balance || 0) },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// Email/password login for students and personnel
router.post('/email-login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Try student first
    let account = await Student.findByEmail(email);
    let userType = 'student';
    let idField = 'user_id';

    if (!account) {
      // Try personnel
      account = await Personnel.findByEmail(email);
      userType = 'staff';
      idField = 'personnel_id';
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (account.is_active === false) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const ok = await bcrypt.compare(password, account.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const userId = account[idField];
    const token = generateToken(userId, userType);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          rfid_card_id: account.rfid_card_id,
          first_name: account.first_name,
          last_name: account.last_name,
          email: account.email,
          user_type: userType,
        },
        wallet: { balance: Number(account.balance || 0) },
        token,
      },
    });
  } catch (error) {
    console.error('Email login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});


// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7);
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    // Get user info
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Get wallet balance
    const wallet = await user.getWallet();
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          rfid_card_id: user.rfid_card_id,
          student_id: user.student_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          user_type: user.user_type
        },
        wallet: {
          balance: wallet ? wallet.balance : 0
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7);
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const profile = await user.getProfile();
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

module.exports = router;
