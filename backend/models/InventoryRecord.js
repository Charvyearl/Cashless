const { pool } = require('../config/database');

class InventoryRecord {
  constructor(data) {
    this.record_id = data.record_id;
    this.product_id = data.product_id;
    this.change_type = data.change_type;
    this.quantity_change = data.quantity_change;
    this.previous_stock = data.previous_stock;
    this.new_stock = data.new_stock;
    this.notes = data.notes;
    this.user_id = data.user_id;
    this.personnel_id = data.personnel_id;
    this.created_at = data.created_at;
    this.product_name = data.product_name;
    this.user_name = data.user_name;
  }

  static async create(recordData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO inventory_records 
         (product_id, change_type, quantity_change, previous_stock, new_stock, notes, user_id, personnel_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordData.product_id,
          recordData.change_type,
          recordData.quantity_change,
          recordData.previous_stock,
          recordData.new_stock,
          recordData.notes || null,
          recordData.user_id || null,
          recordData.personnel_id || null
        ]
      );

      return await InventoryRecord.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT ir.*, p.product_name,
         COALESCE(CONCAT(s.first_name, ' ', s.last_name), CONCAT(per.first_name, ' ', per.last_name)) as user_name
         FROM inventory_records ir
         LEFT JOIN PRODUCT p ON ir.product_id = p.product_id
         LEFT JOIN students s ON ir.user_id = s.user_id
         LEFT JOIN personnel per ON ir.personnel_id = per.personnel_id
         WHERE ir.record_id = ?`,
        [id]
      );
      return rows.length > 0 ? new InventoryRecord(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(options = {}) {
    try {
      const { product_id, user_id, personnel_id, start_date, end_date, page, limit } = options;

      let query = `SELECT ir.*, p.product_name,
                   COALESCE(CONCAT(s.first_name, ' ', s.last_name), CONCAT(per.first_name, ' ', per.last_name)) as user_name
                   FROM inventory_records ir
                   LEFT JOIN PRODUCT p ON ir.product_id = p.product_id
                   LEFT JOIN students s ON ir.user_id = s.user_id
                   LEFT JOIN personnel per ON ir.personnel_id = per.personnel_id
                   WHERE 1=1`;

      const params = [];

      if (product_id) {
        query += ' AND ir.product_id = ?';
        params.push(product_id);
      }

      if (user_id) {
        query += ' AND ir.user_id = ?';
        params.push(user_id);
      }

      if (personnel_id) {
        query += ' AND ir.personnel_id = ?';
        params.push(personnel_id);
      }

      if (start_date) {
        query += ' AND ir.created_at >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND ir.created_at <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY ir.created_at DESC';

      if (limit) {
        const limitNum = parseInt(limit, 10);
        const pageNum = page ? parseInt(page, 10) : 1;
        const offset = (pageNum - 1) * limitNum;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => new InventoryRecord(row));
    } catch (error) {
      throw error;
    }
  }

  static async findByProductId(productId, options = {}) {
    try {
      const { limit } = options;
      let query = `SELECT ir.*, p.product_name,
                   COALESCE(CONCAT(s.first_name, ' ', s.last_name), CONCAT(per.first_name, ' ', per.last_name)) as user_name
                   FROM inventory_records ir
                   LEFT JOIN PRODUCT p ON ir.product_id = p.product_id
                   LEFT JOIN students s ON ir.user_id = s.user_id
                   LEFT JOIN personnel per ON ir.personnel_id = per.personnel_id
                   WHERE ir.product_id = ?
                   ORDER BY ir.created_at DESC`;

      const params = [productId];

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const [rows] = await pool.execute(query, params);
      return rows.map(row => new InventoryRecord(row));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = InventoryRecord;

