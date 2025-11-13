const { pool } = require('../config/database');

class CanteenTransaction {
  constructor(data) {
    this.transaction_id = data.transaction_id;
    this.user_id = data.user_id;
    this.personnel_id = data.personnel_id;
    this.total_amount = parseFloat(data.total_amount);
    this.transaction_date = data.transaction_date;
    this.status = data.status;
    this.payment_method = data.payment_method;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    // Optional joined fields for display
    this.user_first_name = data.user_first_name;
    this.user_last_name = data.user_last_name;
    this.user_rfid = data.user_rfid;
    this.personnel_first_name = data.personnel_first_name;
    this.personnel_last_name = data.personnel_last_name;
    this.personnel_rfid = data.personnel_rfid;
  }

  static async create(transactionData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO TRANSACTIONS (user_id, personnel_id, total_amount, status, payment_method)
         VALUES (?, ?, ?, ?, ?)`,
        [
          transactionData.user_id || null,
          transactionData.personnel_id || null,
          transactionData.total_amount,
          transactionData.status || 'pending',
          transactionData.payment_method || 'rfid'
        ]
      );
      
      return await CanteenTransaction.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM TRANSACTIONS WHERE transaction_id = ?',
        [id]
      );
      return rows.length > 0 ? new CanteenTransaction(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(options = {}) {
    try {
      const rawPage = Number(options.page);
      const rawLimit = Number(options.limit);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50;
      const { startDate, endDate, status, userId, personnelId } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT t.*, 
               u.first_name as user_first_name, u.last_name as user_last_name, u.rfid_card_id as user_rfid,
               p.first_name as personnel_first_name, p.last_name as personnel_last_name, p.rfid_card_id as personnel_rfid
        FROM TRANSACTIONS t 
        LEFT JOIN students u ON t.user_id = u.user_id
        LEFT JOIN personnel p ON t.personnel_id = p.personnel_id
        WHERE 1=1
      `;
      const params = [];
      
      if (userId) {
        query += ' AND t.user_id = ?';
        params.push(userId);
      }
      
      if (personnelId) {
        query += ' AND t.personnel_id = ?';
        params.push(personnelId);
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
      return rows.map(row => new CanteenTransaction(row));
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(status) {
    try {
      await pool.execute(
        'UPDATE TRANSACTIONS SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE transaction_id = ?',
        [status, this.transaction_id]
      );
      this.status = status;
      return this;
    } catch (error) {
      throw error;
    }
  }

  async getTransactionItems() {
    try {
      const [rows] = await pool.execute(
        `SELECT ti.*, p.product_name, p.description, p.category 
         FROM TRANSACTION_ITEMS ti
         JOIN PRODUCT p ON ti.product_id = p.product_id
         WHERE ti.transaction_id = ?
         ORDER BY ti.transaction_item_id`,
        [this.transaction_id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async getDetails() {
    try {
      const items = await this.getTransactionItems();
      
      // Get user/personnel info
      let customer = null;
      if (this.user_id) {
        const [userRows] = await pool.execute(
          'SELECT user_id, rfid_card_id, first_name, last_name FROM students WHERE user_id = ?',
          [this.user_id]
        );
        customer = userRows[0] || null;
      } else if (this.personnel_id) {
        const [personnelRows] = await pool.execute(
          'SELECT personnel_id, rfid_card_id, first_name, last_name FROM personnel WHERE personnel_id = ?',
          [this.personnel_id]
        );
        customer = personnelRows[0] || null;
      }
      
      return {
        transaction: {
          transaction_id: this.transaction_id,
          total_amount: this.total_amount,
          transaction_date: this.transaction_date,
          status: this.status,
          payment_method: this.payment_method,
          created_at: this.created_at
        },
        customer: customer,
        items: items
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CanteenTransaction;
