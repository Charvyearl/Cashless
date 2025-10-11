const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.transaction_id = data.transaction_id;
    this.user_id = data.user_id;
    this.transaction_type_id = data.transaction_type_id;
    this.amount = parseFloat(data.amount);
    this.balance_before = parseFloat(data.balance_before);
    this.balance_after = parseFloat(data.balance_after);
    this.description = data.description;
    this.reference_id = data.reference_id;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new transaction
  static async create(transactionData) {
    try {
      const transactionId = transactionData.transaction_id || uuidv4();
      
      const [result] = await pool.execute(
        `INSERT INTO transactions (transaction_id, user_id, transaction_type_id, amount, 
         balance_before, balance_after, description, reference_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          transactionData.user_id,
          transactionData.transaction_type_id,
          transactionData.amount,
          transactionData.balance_before,
          transactionData.balance_after,
          transactionData.description || null,
          transactionData.reference_id || null,
          transactionData.status || 'completed'
        ]
      );
      
      return await Transaction.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Find transaction by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM TRANSACTIONS WHERE transaction_id = ?',
        [id]
      );
      return rows.length > 0 ? new Transaction(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find transaction by transaction ID
  static async findByTransactionId(transactionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM TRANSACTIONS WHERE transaction_id = ?',
        [transactionId]
      );
      return rows.length > 0 ? new Transaction(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get transactions by user ID
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 20, startDate, endDate, transactionType, status } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          t.transaction_id as id,
          t.transaction_id,
          t.user_id,
          t.personnel_id,
          t.total_amount as amount,
          t.transaction_date as created_at,
          t.transaction_date as updated_at,
          t.status,
          t.payment_method as description,
          'purchase' as transaction_type_name,
          COALESCE(s.first_name, p.first_name) as first_name,
          COALESCE(s.last_name, p.last_name) as last_name,
          COALESCE(s.rfid_card_id, p.rfid_card_id) as rfid_card_id,
          t.total_amount as balance_before,
          t.total_amount as balance_after
        FROM TRANSACTIONS t 
        LEFT JOIN students s ON t.user_id = s.user_id
        LEFT JOIN personnel p ON t.personnel_id = p.personnel_id
        WHERE (t.user_id = ? OR t.personnel_id = ?)
      `;
      const params = [userId, userId];
      
      if (startDate) {
        query += ' AND t.transaction_date >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND t.transaction_date <= ?';
        params.push(endDate);
      }
      
      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Transaction(row));
    } catch (error) {
      throw error;
    }
  }

  // Get all transactions (admin)
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 50, startDate, endDate, transactionType, status, userId } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          t.transaction_id as id,
          t.transaction_id,
          t.user_id,
          t.personnel_id,
          t.total_amount as amount,
          t.transaction_date as created_at,
          t.transaction_date as updated_at,
          t.status,
          t.payment_method as description,
          'purchase' as transaction_type_name,
          COALESCE(s.first_name, p.first_name) as first_name,
          COALESCE(s.last_name, p.last_name) as last_name,
          COALESCE(s.rfid_card_id, p.rfid_card_id) as rfid_card_id,
          t.total_amount as balance_before,
          t.total_amount as balance_after
        FROM TRANSACTIONS t 
        LEFT JOIN students s ON t.user_id = s.user_id
        LEFT JOIN personnel p ON t.personnel_id = p.personnel_id
        WHERE 1=1
      `;
      const params = [];
      
      if (userId) {
        query += ' AND (t.user_id = ? OR t.personnel_id = ?)';
        params.push(userId, userId);
      }
      
      if (startDate) {
        query += ' AND t.transaction_date >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND t.transaction_date <= ?';
        params.push(endDate);
      }
      
      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Transaction(row));
    } catch (error) {
      throw error;
    }
  }

  // Get transaction statistics
  static async getStatistics(options = {}) {
    try {
      const { startDate, endDate, transactionType, userId } = options;
      
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          tt.name as transaction_type_name
        FROM transactions t 
        JOIN transaction_types tt ON t.transaction_type_id = tt.id 
        WHERE t.status = 'completed'
      `;
      const params = [];
      
      if (userId) {
        query += ' AND t.user_id = ?';
        params.push(userId);
      }
      
      if (startDate) {
        query += ' AND t.created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND t.created_at <= ?';
        params.push(endDate);
      }
      
      if (transactionType) {
        query += ' AND tt.name = ?';
        params.push(transactionType);
      }
      
      query += ' GROUP BY tt.name';
      
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get daily transaction summary
  static async getDailySummary(date) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as transaction_count,
          SUM(CASE WHEN tt.name = 'top_up' THEN amount ELSE 0 END) as total_top_ups,
          SUM(CASE WHEN tt.name = 'purchase' THEN amount ELSE 0 END) as total_purchases,
          SUM(CASE WHEN tt.name = 'refund' THEN amount ELSE 0 END) as total_refunds
        FROM transactions t 
        JOIN transaction_types tt ON t.transaction_type_id = tt.id 
        WHERE DATE(created_at) = ? AND t.status = 'completed'
        GROUP BY DATE(created_at)`,
        [date]
      );
      
      return rows[0] || {
        date,
        transaction_count: 0,
        total_top_ups: 0,
        total_purchases: 0,
        total_refunds: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Update transaction status
  async updateStatus(status) {
    try {
      await pool.execute(
        'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, this.id]
      );
      this.status = status;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get transaction type
  async getTransactionType() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM transaction_types WHERE id = ?',
        [this.transaction_type_id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get user info
  async getUser() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, rfid_card_id, first_name, last_name, user_type FROM users WHERE id = ?',
        [this.user_id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get transaction details with related info
  async getDetails() {
    try {
      const transactionType = await this.getTransactionType();
      const user = await this.getUser();
      
      return {
        transaction: {
          id: this.id,
          transaction_id: this.transaction_id,
          amount: this.amount,
          balance_before: this.balance_before,
          balance_after: this.balance_after,
          description: this.description,
          reference_id: this.reference_id,
          status: this.status,
          created_at: this.created_at
        },
        transaction_type: transactionType,
        user: user
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Transaction;
