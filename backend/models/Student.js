const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Student {
  constructor(data) {
    this.user_id = data.user_id;
    this.rfid_card_id = data.rfid_card_id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.balance = data.balance;
    this.created_at = data.created_at;
    this.email = data.email;
    this.password = data.password;
    this.is_active = data.is_active;
    this.updated_at = data.updated_at;
  }

  // Create a new student
  static async create(studentData) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      
      const [result] = await pool.execute(
        `INSERT INTO students (rfid_card_id, first_name, last_name, balance, email, password) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          studentData.rfid_card_id,
          studentData.first_name,
          studentData.last_name,
          studentData.balance || 0.00,
          studentData.email || null,
          hashedPassword
        ]
      );

      return await Student.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Find student by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM students WHERE user_id = ?',
        [id]
      );
      return rows.length > 0 ? new Student(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find student by RFID card ID
  static async findByRfidCardId(rfidCardId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM students WHERE rfid_card_id = ?',
        [rfidCardId]
      );
      return rows.length > 0 ? new Student(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find student by email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM students WHERE LOWER(email) = LOWER(?)',
        [email]
      );
      return rows.length > 0 ? new Student(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get all students with pagination
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, is_active } = options;
      const safeLimit = Math.max(1, Number(limit) || 10);
      const safePage = Math.max(1, Number(page) || 1);
      const safeOffset = (safePage - 1) * safeLimit;
      
      let query = 'SELECT * FROM students WHERE 1=1';
      const params = [];
      
      if (is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(!!is_active);
      }
      
      query += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
      
      const [rows] = await pool.execute(query, params);
      return rows.map(row => new Student(row));
    } catch (error) {
      throw error;
    }
  }

  // Update student
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
      
      values.push(this.user_id);
      
      await pool.execute(
        `UPDATE students SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        values
      );
      
      // Refresh student data
      const updatedStudent = await Student.findById(this.user_id);
      Object.assign(this, updatedStudent);
      
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
        'UPDATE students SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [hashedPassword, this.user_id]
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

  // Delete student (soft delete by setting is_active to false)
  async delete() {
    try {
      await pool.execute(
        'UPDATE students SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [this.user_id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get student profile (without password)
  getProfile() {
    return {
      user_id: this.user_id,
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

  // Get student profile for admin (with password hash)
  getAdminProfile() {
    return {
      user_id: this.user_id,
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

module.exports = Student;
