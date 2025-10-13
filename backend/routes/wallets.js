const express = require('express');
const router = express.Router();
const User = require('../models/User');
// const Wallet = require('../models/Wallet'); // deprecated path for DBs without wallets table
const { pool } = require('../config/database');
const { verifyToken, requireStaff } = require('../middleware/auth');
const { verifyToken: verifyJwt } = require('../utils/jwt');
const { validate } = require('../utils/validation');
const { walletSchemas } = require('../utils/validation');

// Get wallet balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    // Read balance directly from students/personnel table
    let balance = 0;
    if (req.user.user_type === 'student') {
      const [rows] = await pool.execute('SELECT balance FROM students WHERE user_id = ? AND is_active = TRUE', [req.user.id]);
      balance = rows.length ? Number(rows[0].balance) : 0;
    } else {
      const [rows] = await pool.execute('SELECT balance FROM personnel WHERE personnel_id = ? AND is_active = TRUE', [req.user.id]);
      balance = rows.length ? Number(rows[0].balance) : 0;
    }
    
    res.json({
      success: true,
      data: {
        balance,
        user_id: req.user.id,
        rfid_card_id: req.user.rfid_card_id
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance', error: error.message });
  }
});

// Get wallet summary (derived from TRANSACTIONS)
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const idField = req.user.user_type === 'student' ? 'user_id' : 'personnel_id';
    const [rows] = await pool.execute(
      `SELECT 
         COUNT(*) AS total_count,
         SUM(total_amount) AS total_amount,
         SUM(CASE WHEN DATE(transaction_date) = CURDATE() THEN total_amount ELSE 0 END) AS today_amount
       FROM TRANSACTIONS
       WHERE ${idField} = ? AND status = 'completed'`,
      [req.user.id]
    );
    const summary = rows[0] || { total_count: 0, total_amount: 0, today_amount: 0 };
    res.json({ success: true, data: {
      totalTransactions: Number(summary.total_count || 0),
      totalAmount: Number(summary.total_amount || 0),
      todayAmount: Number(summary.today_amount || 0)
    }});
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get wallet summary', error: error.message });
  }
});

// Get transaction history
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Derive transactions from TRANSACTIONS table
    const forceScope = (req.query.scope || '').toString().toLowerCase();
    const idField = forceScope === 'personnel' ? 'personnel_id' : (req.user.user_type === 'student' ? 'user_id' : 'personnel_id');
    const status = (req.query.status || '').toString().toLowerCase();
    let sql = `SELECT transaction_id, total_amount as amount, status, payment_method, transaction_date as created_at
               FROM TRANSACTIONS
               WHERE ${idField} = ?`;
    const params = [req.user.id];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY transaction_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.execute(sql, params);
    
    res.json({
      success: true,
      data: {
        transactions: rows.map(r => ({
          transaction_id: r.transaction_id,
          amount: Number(r.amount),
          status: r.status,
          type: 'purchase',
          date: r.created_at,
        })),
        pagination: { page, limit }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction history', error: error.message });
  }
});

// Top up wallet (staff/admin only)
router.post('/top-up', verifyToken, requireStaff, validate(walletSchemas.topUp), async (req, res) => {
  try {
    const { amount, description } = req.body;
    const { user_id } = req.query; // User ID to top up
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // For simplicity, assume student top-up (extend if needed)
    await pool.execute('UPDATE students SET balance = balance + ? WHERE user_id = ?', [amount, user_id]);
    res.json({ success: true, message: 'Wallet topped up successfully', data: { user_id: Number(user_id), amount } });
  } catch (error) {
    console.error('Top-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Top-up failed',
      error: error.message
    });
  }
});

// Transfer money to another user
router.post('/transfer', verifyToken, validate(walletSchemas.transfer), async (req, res) => {
  try {
    const { recipient_rfid, amount, description } = req.body;
    if (!recipient_rfid || !amount) return res.status(400).json({ success: false, message: 'Recipient and amount required' });

    // Sender
    if (req.user.user_type === 'student') {
      await pool.execute('UPDATE students SET balance = balance - ? WHERE user_id = ?', [amount, req.user.id]);
    } else {
      await pool.execute('UPDATE personnel SET balance = balance - ? WHERE personnel_id = ?', [amount, req.user.id]);
    }
    // Recipient (find by RFID in students then personnel)
    let affected = 0;
    const [sr] = await pool.execute('UPDATE students SET balance = balance + ? WHERE rfid_card_id = ?', [amount, recipient_rfid]);
    affected = sr.affectedRows;
    if (!affected) {
      const [pr] = await pool.execute('UPDATE personnel SET balance = balance + ? WHERE rfid_card_id = ?', [amount, recipient_rfid]);
      affected = pr.affectedRows;
    }
    if (!affected) return res.status(404).json({ success: false, message: 'Recipient not found' });
    res.json({ success: true, message: 'Transfer completed successfully' });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: error.message
    });
  }
});

// Get wallet by RFID (for payment processing)
router.get('/rfid/:rfid_card_id', verifyToken, requireStaff, async (req, res) => {
  try {
    const { rfid_card_id } = req.params;
    // Lookup student then personnel by RFID
    const [srows] = await pool.execute('SELECT user_id as id, rfid_card_id, first_name, last_name, balance, 1 as is_student FROM students WHERE rfid_card_id = ? AND is_active = TRUE', [rfid_card_id]);
    let rec = srows[0];
    if (!rec) {
      const [prows] = await pool.execute('SELECT personnel_id as id, rfid_card_id, first_name, last_name, balance, 0 as is_student FROM personnel WHERE rfid_card_id = ? AND is_active = TRUE', [rfid_card_id]);
      rec = prows[0];
    }
    if (!rec) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user: {
      id: rec.id,
      rfid_card_id: rec.rfid_card_id,
      first_name: rec.first_name,
      last_name: rec.last_name,
    }, wallet: { balance: Number(rec.balance || 0) } } });
  } catch (error) {
    console.error('Get wallet by RFID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet',
      error: error.message
    });
  }
});

// Process payment (deduct from wallet)
router.post('/payment', verifyToken, requireStaff, async (req, res) => {
  try {
    const { rfid_card_id, amount, description, reference_id } = req.body;
    
    if (!rfid_card_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'RFID card ID and amount are required'
      });
    }
    // Deduct directly on students/personnel
    let updated = 0; let userInfo = null;
    const [srows] = await pool.execute('SELECT user_id as id, balance, first_name, last_name, rfid_card_id FROM students WHERE rfid_card_id = ? AND is_active = TRUE', [rfid_card_id]);
    if (srows.length) {
      const bal = Number(srows[0].balance);
      if (bal < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });
      await pool.execute('UPDATE students SET balance = balance - ? WHERE user_id = ?', [amount, srows[0].id]);
      userInfo = srows[0];
      updated = 1;
    } else {
      const [prows] = await pool.execute('SELECT personnel_id as id, balance, first_name, last_name, rfid_card_id FROM personnel WHERE rfid_card_id = ? AND is_active = TRUE', [rfid_card_id]);
      if (!prows.length) return res.status(404).json({ success: false, message: 'User not found' });
      const bal = Number(prows[0].balance);
      if (bal < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });
      await pool.execute('UPDATE personnel SET balance = balance - ? WHERE personnel_id = ?', [amount, prows[0].id]);
      userInfo = prows[0];
      updated = 1;
    }
    if (!updated) return res.status(500).json({ success: false, message: 'Payment failed' });
    res.json({ success: true, message: 'Payment processed successfully', data: { amount, user: userInfo, reference_id, description } });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error.message
    });
  }
});

module.exports = router;

// Server-Sent Events stream of recent transactions (dev convenience)
// Auth: via Bearer header or token query param
router.get('/transactions/stream', async (req, res) => {
  try {
    // Auth handling: prefer Authorization header; fallback to token query
    let userContext = null;
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : (req.query.token || '').toString();
      if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

      const decoded = verifyJwt(token);
      // Minimal user context (id, userType) to use existing Wallet model helpers
      req.user = { id: decoded.userId, user_type: decoded.userType };
      userContext = req.user;
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    let isClosed = false;
    req.on('close', () => { isClosed = true; clearInterval(intervalId); });

    const idField = userContext.user_type === 'student' ? 'user_id' : 'personnel_id';
    const sendSnapshot = async () => {
      try {
        const [rows] = await pool.execute(
          `SELECT transaction_id, total_amount as amount, status, payment_method, transaction_date as created_at
           FROM TRANSACTIONS
           WHERE ${idField} = ?
           ORDER BY transaction_date DESC
           LIMIT 20`,
          [userContext.id]
        );
        if (!isClosed) {
          const tx = rows.map(r => ({
            transaction_id: r.transaction_id,
            amount: Number(r.amount),
            status: r.status,
            type: 'purchase',
            date: r.created_at,
          }));
          res.write(`data: ${JSON.stringify({ success: true, transactions: tx })}\n\n`);
        }
      } catch (e) {
        if (!isClosed) {
          res.write(`data: ${JSON.stringify({ success: false, message: 'stream error' })}\n\n`);
        }
      }
    };
    await sendSnapshot();
    var intervalId = setInterval(sendSnapshot, 5000);
  } catch (error) {
    try { res.status(500).json({ success: false, message: 'Stream failed' }); } catch (_) {}
  }
});
