const { pool } = require('../config/database');

class Product {
  constructor(data) {
    this.product_id = data.product_id;
    this.product_name = data.product_name;
    this.description = data.description;
    this.price = parseFloat(data.price);
    this.category = data.category;
    this.category_id = data.category_id || null;
    this.stock_quantity = data.stock_quantity;
    this.is_available = data.is_available;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(data) {
    // Handle both category_id and category string
    let categoryName = data.category;
    if (data.category_id && !data.category) {
      // If category_id is provided but not category name, get the name from categories table
      const [categoryRows] = await pool.execute('SELECT name FROM categories WHERE id = ?', [data.category_id]);
      if (categoryRows.length > 0) {
        categoryName = categoryRows[0].name;
      }
    }
    
    const [result] = await pool.execute(
      `INSERT INTO PRODUCT (product_name, description, price, category, stock_quantity, is_available)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.product_name,
        data.description || null,
        data.price,
        categoryName,
        data.stock_quantity ?? 0,
        data.is_available !== undefined ? data.is_available : true
      ]
    );
    return await Product.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM PRODUCT WHERE product_id = ?', [id]);
    return rows.length ? new Product(rows[0]) : null;
  }

  static async findAll(options = {}) {
    const { category_id, category, available_only } = options;
    let query = 'SELECT p.*, c.id as category_id FROM PRODUCT p LEFT JOIN categories c ON p.category = c.name WHERE 1=1';
    const params = [];
    if (category_id) {
      query += ' AND c.id = ?';
      params.push(category_id);
    }
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    if (available_only) {
      query += ' AND p.is_available = TRUE';
    }
    query += ' ORDER BY p.product_name ASC';
    const [rows] = await pool.execute(query, params);
    return rows.map(r => new Product(r));
  }

  static async search(searchTerm, options = {}) {
    const { category_id } = options;
    let query = 'SELECT p.*, c.id as category_id FROM PRODUCT p LEFT JOIN categories c ON p.category = c.name WHERE p.product_name LIKE ? OR p.description LIKE ?';
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];
    if (category_id) {
      query += ' AND c.id = ?';
      params.push(category_id);
    }
    query += ' ORDER BY p.product_name ASC';
    const [rows] = await pool.execute(query, params);
    return rows.map(r => new Product(r));
  }

  async update(updateData) {
    const allowed = ['product_name', 'description', 'price', 'category', 'stock_quantity', 'is_available', 'category_id'];
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(updateData)) {
      if (allowed.includes(k) && v !== undefined) {
        if (k === 'category_id') {
          sets.push('category = (SELECT name FROM categories WHERE id = ?)');
          values.push(v);
        } else {
          sets.push(`${k} = ?`);
          values.push(v);
        }
      }
    }
    if (sets.length === 0) throw new Error('No valid fields to update');
    values.push(this.product_id);
    await pool.execute(
      `UPDATE PRODUCT SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`,
      values
    );
    const updated = await Product.findById(this.product_id);
    Object.assign(this, updated);
    return this;
  }

  async delete() {
    // Perform a hard delete so the product row is removed from the database.
    // Related rows in tables like order_items and reservations are configured
    // with ON DELETE CASCADE in the schema and will be cleaned up automatically.
    await pool.execute('DELETE FROM PRODUCT WHERE product_id = ?', [this.product_id]);
    return this;
  }

  async toggleAvailability() {
    await pool.execute('UPDATE PRODUCT SET is_available = NOT is_available, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [this.product_id]);
    this.is_available = !this.is_available;
    return this;
  }
}

module.exports = Product;


