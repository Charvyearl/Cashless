const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Personnel {
  constructor(data) {
    this.personnel_id = data.personnel_id;
    this.rfid_card_id = data.rfid_card_id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.balance = data.balance;
    this.created_at = data.created_at;
    this.email = data.email;
    this.password = data.password;
    this.pin = data.pin;
    this.is_active = data.is_active;
    this.updated_at = data.updated_at;
  }

  // Create a new personnel
  static async create(personnelData) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(personnelData.password, 10);
      
      // Hash PIN if provided
      let hashedPin = null;
      if (personnelData.pin) {
        hashedPin = await bcrypt.hash(personnelData.pin, 10);
      }
      
      const [result] = await pool.execute(
        `INSERT INTO personnel (rfid_card_id, first_name, last_name, balance, email, password, pin) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          personnelData.rfid_card_id,
          personnelData.first_name,
          personnelData.last_name,
          personnelData.balance || 0.00,
          personnelData.email || null,
          hashedPassword,
          hashedPin
        ]
      );

      return await Personnel.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Find personnel by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM personnel WHERE personnel_id = ?',
        [id]
      );
      return rows.length > 0 ? new Personnel(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find personnel by RFID card ID
  static async findByRfidCardId(rfidCardId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM personnel WHERE rfid_card_id = ?',
        [rfidCardId]
      );
      return rows.length > 0 ? new Personnel(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find personnel by email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM personnel WHERE LOWER(email) = LOWER(?)',
        [email]
      );
      return rows.length > 0 ? new Personnel(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get all personnel with pagination
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, is_active } = options;
      const safeLimit = Math.max(1, Number(limit) || 10);
      const safePage = Math.max(1, Number(page) || 1);
      const safeOffset = (safePage - 1) * safeLimit;
      
      let query = 'SELECT * FROM personnel WHERE 1=1';
      const params = [];
      
      if (is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(!!is_active);
      }
      
      query += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
      
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Personnel(row));
    } catch (error) {
      throw error;
    }
  }

  // Update personnel
  async update(updateData) {
    try {
      const allowedFields = ['first_name', 'last_name', 'email', 'balance', 'is_active'];
      const updates = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(this.personnel_id);
      
      await pool.execute(
        `UPDATE personnel SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE personnel_id = ?`,
        values
      );
      
      // Refresh personnel data
      const updatedPersonnel = await Personnel.findById(this.personnel_id);
      Object.assign(this, updatedPersonnel);
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await pool.execute(
        'UPDATE personnel SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE personnel_id = ?',
        [hashedPassword, this.personnel_id]
      );
      
      this.password = hashedPassword;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw error;
    }
  }

  // Verify PIN
  async verifyPin(pin) {
    try {
      if (!this.pin) {
        return false; // No PIN set
      }
      return await bcrypt.compare(pin, this.pin);
    } catch (error) {
      throw error;
    }
  }

  // Update PIN
  async updatePin(newPin) {
    try {
      const hashedPin = await bcrypt.hash(newPin, 10);
      
      await pool.execute(
        'UPDATE personnel SET pin = ?, updated_at = CURRENT_TIMESTAMP WHERE personnel_id = ?',
        [hashedPin, this.personnel_id]
      );
      
      this.pin = hashedPin;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete personnel (soft delete by setting is_active to false)
  async delete() {
    try {
      await pool.execute(
        'UPDATE personnel SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE personnel_id = ?',
        [this.personnel_id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get personnel profile (without password)
  getProfile() {
    return {
      personnel_id: this.personnel_id,
      rfid_card_id: this.rfid_card_id,
      first_name: this.first_name,
      last_name: this.last_name,
      balance: this.balance,
      email: this.email,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Get personnel profile for admin (with password hash)
  getAdminProfile() {
    return {
      personnel_id: this.personnel_id,
      rfid_card_id: this.rfid_card_id,
      first_name: this.first_name,
      last_name: this.last_name,
      balance: this.balance,
      email: this.email,
      password: this.password,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Personnel;
