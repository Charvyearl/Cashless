const { pool } = require('../config/database');

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Get all categories
  static async getAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM categories ORDER BY name ASC'
      );
      return rows.map(row => new Category(row));
    } catch (error) {
      throw error;
    }
  }

  // Get category by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? new Category(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get category by name
  static async getByName(name) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM categories WHERE name = ?',
        [name]
      );
      return rows.length > 0 ? new Category(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Create new category
  static async create(data) {
    try {
      const { name } = data;
      const [result] = await pool.execute(
        'INSERT INTO categories (name) VALUES (?)',
        [name]
      );
      
      const newCategory = await Category.getById(result.insertId);
      return newCategory;
    } catch (error) {
      throw error;
    }
  }

  // Update category
  async update(data) {
    try {
      const { name } = data;
      await pool.execute(
        'UPDATE categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, this.id]
      );
      
      // Update current instance
      this.name = name || this.name;
      
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Hard delete category
  async delete() {
    try {
      await pool.execute(
        'DELETE FROM categories WHERE id = ?',
        [this.id]
      );
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Category;
