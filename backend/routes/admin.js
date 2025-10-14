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

// Dashboard statistics endpoint
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Get total users (students + personnel)
    const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students WHERE is_active = 1');
    const [personnelCount] = await pool.execute('SELECT COUNT(*) as count FROM personnel WHERE is_active = 1');
    const totalUsers = studentCount[0].count + personnelCount[0].count;
    
    // Get total transactions
    const [transactionCount] = await pool.execute('SELECT COUNT(*) as count FROM TRANSACTIONS');
    
    // Get total revenue (sum of completed transactions)
    const [revenueResult] = await pool.execute('SELECT SUM(total_amount) as total FROM TRANSACTIONS WHERE status = "completed"');
    const totalRevenue = revenueResult[0].total || 0;
    
    // Get active wallets (users with balance > 0)
    const [activeWalletsResult] = await pool.execute(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id FROM students WHERE balance > 0 AND is_active = 1
        UNION
        SELECT personnel_id FROM personnel WHERE balance > 0 AND is_active = 1
      ) as active_users
    `);
    
    // Get today's transactions
    const [todayTransactions] = await pool.execute(`
      SELECT COUNT(*) as count FROM TRANSACTIONS 
      WHERE DATE(transaction_date) = CURDATE()
    `);
    
    // Get today's revenue
    const [todayRevenueResult] = await pool.execute(`
      SELECT SUM(total_amount) as total FROM TRANSACTIONS 
      WHERE DATE(transaction_date) = CURDATE() AND status = 'completed'
    `);
    
    // Get active users (users who made transactions in the last 30 days)
    const [activeUsersResult] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id FROM TRANSACTIONS 
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status = 'completed'
        UNION
        SELECT personnel_id as user_id FROM TRANSACTIONS 
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status = 'completed'
      ) as active_users
    `);
    
    // Get new users today (users created today)
    const [newUsersTodayResult] = await pool.execute(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id FROM students WHERE DATE(created_at) = CURDATE() AND is_active = 1
        UNION
        SELECT personnel_id FROM personnel WHERE DATE(created_at) = CURDATE() AND is_active = 1
      ) as new_users
    `);
    
    const stats = {
      total_users: totalUsers,
      total_transactions: transactionCount[0].count,
      total_revenue: parseFloat(totalRevenue),
      active_wallets: activeWalletsResult[0].count,
      daily_transactions: todayTransactions[0].count,
      daily_revenue: parseFloat(todayRevenueResult[0].total || 0),
      active_users: activeUsersResult[0].count,
      new_users_today: newUsersTodayResult[0].count
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
});

// User Reports and Registration Trends endpoints
router.get('/reports/user-registration-trends', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { days = 30 } = req.query;
    
    // Get registration trends for the last N days
    const [registrationTrends] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        SUM(CASE WHEN user_type = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN user_type = 'personnel' THEN 1 ELSE 0 END) as personnel
      FROM (
        SELECT created_at, 'student' as user_type FROM students WHERE is_active = 1
        UNION ALL
        SELECT created_at, 'personnel' as user_type FROM personnel WHERE is_active = 1
      ) as all_users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [parseInt(days)]);
    
    res.json({
      success: true,
      data: {
        trends: registrationTrends,
        period_days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('User registration trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registration trends',
      error: error.message
    });
  }
});

router.get('/reports/user-activity-summary', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Get user activity summary
    const [activitySummary] = await pool.execute(`
      SELECT 
        'Total Users' as metric,
        COUNT(*) as value
      FROM (
        SELECT user_id FROM students WHERE is_active = 1
        UNION
        SELECT personnel_id FROM personnel WHERE is_active = 1
      ) as all_users
      
      UNION ALL
      
      SELECT 
        'Active Users (30 days)' as metric,
        COUNT(DISTINCT user_id) as value
      FROM (
        SELECT user_id FROM TRANSACTIONS 
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status = 'completed'
        UNION
        SELECT personnel_id as user_id FROM TRANSACTIONS 
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status = 'completed'
      ) as active_users
      
      UNION ALL
      
      SELECT 
        'New Users Today' as metric,
        COUNT(*) as value
      FROM (
        SELECT user_id FROM students WHERE DATE(created_at) = CURDATE() AND is_active = 1
        UNION
        SELECT personnel_id FROM personnel WHERE DATE(created_at) = CURDATE() AND is_active = 1
      ) as new_users
      
      UNION ALL
      
      SELECT 
        'Users with Balance > 0' as metric,
        COUNT(*) as value
      FROM (
        SELECT user_id FROM students WHERE balance > 0 AND is_active = 1
        UNION
        SELECT personnel_id FROM personnel WHERE balance > 0 AND is_active = 1
      ) as users_with_balance
    `);
    
    res.json({
      success: true,
      data: activitySummary
    });
  } catch (error) {
    console.error('User activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity summary',
      error: error.message
    });
  }
});

// Weekly Performance and Peak Hours endpoints
router.get('/reports/weekly-performance', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { weeks = 4 } = req.query;
    
    // Get weekly performance data for the last N weeks
    const [weeklyData] = await pool.execute(`
      SELECT 
        YEARWEEK(transaction_date) as week,
        DATE(transaction_date) as week_start,
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction_value,
        COUNT(DISTINCT user_id) as unique_users
      FROM TRANSACTIONS 
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK) 
        AND status = 'completed'
      GROUP BY YEARWEEK(transaction_date)
      ORDER BY week DESC
    `, [parseInt(weeks)]);
    
    res.json({
      success: true,
      data: {
        weekly_performance: weeklyData,
        period_weeks: parseInt(weeks)
      }
    });
  } catch (error) {
    console.error('Weekly performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly performance data',
      error: error.message
    });
  }
});

router.get('/reports/peak-hours', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { days = 30 } = req.query;
    
    // Get peak hours analysis for the last N days
    const [peakHoursData] = await pool.execute(`
      SELECT 
        HOUR(transaction_date) as hour,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction_value,
        COUNT(DISTINCT user_id) as unique_users
      FROM TRANSACTIONS 
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) 
        AND status = 'completed'
      GROUP BY HOUR(transaction_date)
      ORDER BY transaction_count DESC
    `, [parseInt(days)]);
    
    // Get daily patterns
    const [dailyPatterns] = await pool.execute(`
      SELECT 
        DAYNAME(transaction_date) as day_name,
        DAYOFWEEK(transaction_date) as day_number,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction_value
      FROM TRANSACTIONS 
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) 
        AND status = 'completed'
      GROUP BY DAYOFWEEK(transaction_date), DAYNAME(transaction_date)
      ORDER BY day_number
    `, [parseInt(days)]);
    
    res.json({
      success: true,
      data: {
        peak_hours: peakHoursData,
        daily_patterns: dailyPatterns,
        period_days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peak hours data',
      error: error.message
    });
  }
});

module.exports = router;
