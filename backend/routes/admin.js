const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Student = require('../models/Student');
const Personnel = require('../models/Personnel');
const { validate } = require('../utils/validation');
const { studentSchemas, personnelSchemas } = require('../utils/validation');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// TEMPORARILY DISABLED AUTH FOR TESTING
// router.use(verifyToken);
// router.use(requireAdmin);

// TEMPORARY: Test delete without auth for debugging
router.delete('/test-delete/:id', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    await pool.execute('DELETE FROM students WHERE user_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Test delete worked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes working!' });
});

// ========== STUDENT MANAGEMENT ==========

// Create new student account
router.post('/students', validate(studentSchemas.create), async (req, res) => {
  try {
    const { rfid_card_id, first_name, last_name, email, password, balance } = req.body;
    
    // Check if RFID card already exists in students table
    const existingStudent = await Student.findByRfidCardId(rfid_card_id);
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'RFID card already registered for a student'
      });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Student.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered for a student'
        });
      }
    }
    
    // Create new student
    const student = await Student.create({
      rfid_card_id,
      first_name,
      last_name,
      email,
      password,
      balance
    });
    
    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      data: student.getProfile()
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student account',
      error: error.message
    });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const { page = 1, limit = 10, is_active } = req.query;
    
    const students = await Student.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    });
    
    res.json({
      success: true,
      data: students.map(student => student.getProfile())
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: error.message
    });
  }
});

// Get student by ID
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      data: student.getProfile()
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student',
      error: error.message
    });
  }
});

// Update student
router.put('/students/:id', validate(studentSchemas.update), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    await student.update(req.body);
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student.getProfile()
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
});

// Update student password
router.put('/students/:id/password', validate(studentSchemas.updatePassword), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    await student.updatePassword(req.body.password);
    
    res.json({
      success: true,
      message: 'Student password updated successfully'
    });
  } catch (error) {
    console.error('Update student password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student password',
      error: error.message
    });
  }
});

// Delete student (soft delete)
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    await student.delete();
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
});

// ========== PERSONNEL MANAGEMENT ==========

// Create new personnel account
router.post('/personnel', validate(personnelSchemas.create), async (req, res) => {
  try {
    const { rfid_card_id, first_name, last_name, email, password, balance } = req.body;
    
    // Check if RFID card already exists in personnel table
    const existingPersonnel = await Personnel.findByRfidCardId(rfid_card_id);
    if (existingPersonnel) {
      return res.status(400).json({
        success: false,
        message: 'RFID card already registered for personnel'
      });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Personnel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered for personnel'
        });
      }
    }
    
    // Create new personnel
    const personnel = await Personnel.create({
      rfid_card_id,
      first_name,
      last_name,
      email,
      password,
      balance
    });
    
    res.status(201).json({
      success: true,
      message: 'Personnel account created successfully',
      data: personnel.getProfile()
    });
  } catch (error) {
    console.error('Create personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create personnel account',
      error: error.message
    });
  }
});

// Get all personnel
router.get('/personnel', async (req, res) => {
  try {
    const { page = 1, limit = 10, is_active } = req.query;
    
    const personnel = await Personnel.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    });
    
    res.json({
      success: true,
      data: personnel.map(person => person.getProfile())
    });
  } catch (error) {
    console.error('Get personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personnel',
      error: error.message
    });
  }
});

// Get personnel by ID
router.get('/personnel/:id', async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    res.json({
      success: true,
      data: personnel.getProfile()
    });
  } catch (error) {
    console.error('Get personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personnel',
      error: error.message
    });
  }
});

// Update personnel
router.put('/personnel/:id', validate(personnelSchemas.update), async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    await personnel.update(req.body);
    
    res.json({
      success: true,
      message: 'Personnel updated successfully',
      data: personnel.getProfile()
    });
  } catch (error) {
    console.error('Update personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personnel',
      error: error.message
    });
  }
});

// Update personnel password
router.put('/personnel/:id/password', validate(personnelSchemas.updatePassword), async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    await personnel.updatePassword(req.body.password);
    
    res.json({
      success: true,
      message: 'Personnel password updated successfully'
    });
  } catch (error) {
    console.error('Update personnel password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personnel password',
      error: error.message
    });
  }
});

// Delete personnel (soft delete)
router.delete('/personnel/:id', async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    await personnel.delete();
    
    res.json({
      success: true,
      message: 'Personnel deleted successfully'
    });
  } catch (error) {
    console.error('Delete personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete personnel',
      error: error.message
    });
  }
});

// Add money to student wallet - SIMPLE VERSION
router.post('/students/:id/add-money', async (req, res) => {
  try {
    const { amount } = req.body;
    console.log('Adding money to student:', req.params.id, 'Amount:', amount);
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Simply add the amount to the existing balance
    const newBalance = parseFloat(student.balance) + parseFloat(amount);
    
    await student.update({ balance: newBalance });
    
    res.json({
      success: true,
      message: 'Money added successfully',
      data: {
        amount: parseFloat(amount),
        balance_before: parseFloat(student.balance),
        balance_after: newBalance
      }
    });
  } catch (error) {
    console.error('Add money to student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money',
      error: error.message
    });
  }
});

// Add money to personnel wallet - SIMPLE VERSION
router.post('/personnel/:id/add-money', async (req, res) => {
  try {
    const { amount } = req.body;
    console.log('Adding money to personnel:', req.params.id, 'Amount:', amount);
    
    const personnel = await Personnel.findById(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    // Simply add the amount to the existing balance
    const newBalance = parseFloat(personnel.balance) + parseFloat(amount);
    
    await personnel.update({ balance: newBalance });
    
    res.json({
      success: true,
      message: 'Money added successfully',
      data: {
        amount: parseFloat(amount),
        balance_before: parseFloat(personnel.balance),
        balance_after: newBalance
      }
    });
  } catch (error) {
    console.error('Add money to personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money',
      error: error.message
    });
  }
});

// Delete student account - REAL DELETE
router.delete('/students/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE ENDPOINT HIT! ID:', req.params.id);
    const { pool } = require('../config/database');
    
    // Check if student exists first
    const [checkRows] = await pool.execute('SELECT * FROM students WHERE user_id = ?', [req.params.id]);
    console.log('🔍 Student exists?', checkRows.length > 0);
    
    if (checkRows.length === 0) {
      return res.json({ success: false, message: 'Student not found' });
    }
    
    console.log('👤 Deleting student:', checkRows[0].first_name, checkRows[0].last_name);
    
    // Try to delete
    const [result] = await pool.execute('DELETE FROM students WHERE user_id = ?', [req.params.id]);
    console.log('🗑️ Delete result:', result);
    console.log('✅ Rows affected:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'No rows deleted - student may not exist' });
    }
    
    // Verify it's gone
    const [verifyRows] = await pool.execute('SELECT * FROM students WHERE user_id = ?', [req.params.id]);
    console.log('🔍 Student still exists?', verifyRows.length > 0);
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// Delete personnel account - SIMPLE
router.delete('/personnel/:id', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    await pool.execute('DELETE FROM personnel WHERE personnel_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

module.exports = router;
