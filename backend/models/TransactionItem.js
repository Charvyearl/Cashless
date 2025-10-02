const { pool } = require('../config/database');

class TransactionItem {
  constructor(data) {
    this.transaction_item_id = data.transaction_item_id;
    this.transaction_id = data.transaction_id;
    this.product_id = data.product_id;
    this.quantity = data.quantity;
    this.unit_price = parseFloat(data.unit_price);
    this.subtotal = parseFloat(data.subtotal);
    this.created_at = data.created_at;
  }

  static async create(itemData) {
    try {
      const subtotal = itemData.quantity * itemData.unit_price;
      
      const [result] = await pool.execute(
        `INSERT INTO TRANSACTION_ITEMS (transaction_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          itemData.transaction_id,
          itemData.product_id,
          itemData.quantity,
          itemData.unit_price,
          subtotal
        ]
      );
      
      return await TransactionItem.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  static async createMultiple(transactionId, items) {
    try {
      const createdItems = [];
      
      for (const item of items) {
        const subtotal = item.quantity * item.unit_price;
        
        const [result] = await pool.execute(
          `INSERT INTO TRANSACTION_ITEMS (transaction_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [
            transactionId,
            item.product_id,
            item.quantity,
            item.unit_price,
            subtotal
          ]
        );
        
        const createdItem = await TransactionItem.findById(result.insertId);
        createdItems.push(createdItem);
      }
      
      return createdItems;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM TRANSACTION_ITEMS WHERE transaction_item_id = ?',
        [id]
      );
      return rows.length > 0 ? new TransactionItem(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByTransactionId(transactionId) {
    try {
      const [rows] = await pool.execute(
        `SELECT ti.*, p.product_name, p.description, p.category 
         FROM TRANSACTION_ITEMS ti
         JOIN PRODUCT p ON ti.product_id = p.product_id
         WHERE ti.transaction_id = ?
         ORDER BY ti.transaction_item_id`,
        [transactionId]
      );
      return rows.map(row => new TransactionItem(row));
    } catch (error) {
      throw error;
    }
  }

  async update(updateData) {
    try {
      const allowed = ['quantity', 'unit_price'];
      const sets = [];
      const values = [];
      
      for (const [k, v] of Object.entries(updateData)) {
        if (allowed.includes(k) && v !== undefined) {
          sets.push(`${k} = ?`);
          values.push(v);
        }
      }
      
      if (sets.length === 0) throw new Error('No valid fields to update');
      
      // Recalculate subtotal if quantity or unit_price changed
      if (updateData.quantity !== undefined || updateData.unit_price !== undefined) {
        const newQuantity = updateData.quantity !== undefined ? updateData.quantity : this.quantity;
        const newUnitPrice = updateData.unit_price !== undefined ? updateData.unit_price : this.unit_price;
        const newSubtotal = newQuantity * newUnitPrice;
        
        sets.push('subtotal = ?');
        values.push(newSubtotal);
      }
      
      values.push(this.transaction_item_id);
      
      await pool.execute(
        `UPDATE TRANSACTION_ITEMS SET ${sets.join(', ')} WHERE transaction_item_id = ?`,
        values
      );
      
      const updated = await TransactionItem.findById(this.transaction_item_id);
      Object.assign(this, updated);
      return this;
    } catch (error) {
      throw error;
    }
  }

  async delete() {
    try {
      await pool.execute('DELETE FROM TRANSACTION_ITEMS WHERE transaction_item_id = ?', [this.transaction_item_id]);
      return this;
    } catch (error) {
      throw error;
    }
  }

  async getProduct() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM PRODUCT WHERE product_id = ?',
        [this.product_id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TransactionItem;
