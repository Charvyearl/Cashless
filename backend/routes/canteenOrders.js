const express = require('express');
const router = express.Router();
const CanteenTransaction = require('../models/CanteenTransaction');
const TransactionItem = require('../models/TransactionItem');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');

// Create a new order (transaction)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { items, customer_rfid } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required and must be a non-empty array'
      });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have product_id and positive quantity'
        });
      }

      // Get product details
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`
        });
      }

      if (!product.is_available) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.product_name} is not available`
        });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.product_name}. Available: ${product.stock_quantity}`
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: product.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: subtotal
      });
    }

    // Create the transaction
    const transaction = await CanteenTransaction.create({
      total_amount: totalAmount,
      status: 'pending',
      payment_method: 'rfid'
    });

    // Create transaction items
    await TransactionItem.createMultiple(transaction.transaction_id, validatedItems);

    // Get the complete transaction details
    const transactionDetails = await transaction.getDetails();

    res.json({
      success: true,
      message: 'Order created successfully',
      data: transactionDetails
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Complete order with RFID scan
router.post('/:transactionId/complete', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { customer_rfid } = req.body;

    if (!customer_rfid) {
      return res.status(400).json({
        success: false,
        message: 'Customer RFID is required'
      });
    }

    // Find the transaction
    const transaction = await CanteenTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not in pending status'
      });
    }

    // Find customer by RFID
    let customer = null;
    let customerId = null;
    let customerType = null;

    // Check students table first
    const { pool } = require('../config/database');
    const [studentRows] = await pool.execute(
      'SELECT * FROM students WHERE rfid_card_id = ? AND is_active = TRUE',
      [customer_rfid]
    );

    if (studentRows.length > 0) {
      customer = studentRows[0];
      customerId = customer.user_id;
      customerType = 'user';
    } else {
      // Check personnel table
      const [personnelRows] = await pool.execute(
        'SELECT * FROM personnel WHERE rfid_card_id = ? AND is_active = TRUE',
        [customer_rfid]
      );

      if (personnelRows.length > 0) {
        customer = personnelRows[0];
        customerId = customer.personnel_id;
        customerType = 'personnel';
      }
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found with provided RFID'
      });
    }

    // Check customer balance
    if (customer.balance < transaction.total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        data: {
          required: transaction.total_amount,
          available: customer.balance
        }
      });
    }

    // Update transaction with customer info
    if (customerType === 'user') {
      await pool.execute(
        'UPDATE TRANSACTIONS SET user_id = ?, status = ? WHERE transaction_id = ?',
        [customerId, 'completed', transactionId]
      );
    } else {
      await pool.execute(
        'UPDATE TRANSACTIONS SET personnel_id = ?, status = ? WHERE transaction_id = ?',
        [customerId, 'completed', transactionId]
      );
    }

    // Deduct balance
    const newBalance = customer.balance - transaction.total_amount;
    if (customerType === 'user') {
      await pool.execute(
        'UPDATE students SET balance = ? WHERE user_id = ?',
        [newBalance, customerId]
      );
    } else {
      await pool.execute(
        'UPDATE personnel SET balance = ? WHERE personnel_id = ?',
        [newBalance, customerId]
      );
    }

    // Update product stock
    const items = await transaction.getTransactionItems();
    for (const item of items) {
      await pool.execute(
        'UPDATE PRODUCT SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Get updated transaction details
    const updatedTransaction = await CanteenTransaction.findById(transactionId);
    const transactionDetails = await updatedTransaction.getDetails();

    res.json({
      success: true,
      message: 'Order completed successfully',
      data: {
        ...transactionDetails,
        customer_balance: {
          previous: customer.balance,
          current: newBalance,
          deducted: transaction.total_amount
        }
      }
    });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete order',
      error: error.message
    });
  }
});

// Get all orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      status: req.query.status,
      userId: req.query.user_id,
      personnelId: req.query.personnel_id
    };

    const transactions = await CanteenTransaction.findAll(options);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: options.page,
          limit: options.limit
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
});

// Get order details
router.get('/:transactionId', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await CanteenTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const transactionDetails = await transaction.getDetails();

    res.json({
      success: true,
      data: transactionDetails
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order details',
      error: error.message
    });
  }
});

// Cancel order
router.post('/:transactionId/cancel', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await CanteenTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be cancelled'
      });
    }

    await transaction.updateStatus('cancelled');

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        transaction_id: transaction.transaction_id,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// Verify customer RFID (before completing order)
router.post('/verify-rfid', verifyToken, async (req, res) => {
  try {
    const { rfid_card_id } = req.body;

    if (!rfid_card_id) {
      return res.status(400).json({
        success: false,
        message: 'RFID card ID is required'
      });
    }

    const { pool } = require('../config/database');
    let customer = null;
    let customerType = null;

    // Check students table first
    const [studentRows] = await pool.execute(
      'SELECT user_id, rfid_card_id, first_name, last_name, balance FROM students WHERE rfid_card_id = ? AND is_active = TRUE',
      [rfid_card_id]
    );

    if (studentRows.length > 0) {
      customer = studentRows[0];
      customerType = 'user';
    } else {
      // Check personnel table
      const [personnelRows] = await pool.execute(
        'SELECT personnel_id, rfid_card_id, first_name, last_name, balance FROM personnel WHERE rfid_card_id = ? AND is_active = TRUE',
        [rfid_card_id]
      );

      if (personnelRows.length > 0) {
        customer = personnelRows[0];
        customerType = 'personnel';
      }
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found with provided RFID'
      });
    }

    res.json({
      success: true,
      data: {
        customer: {
          id: customerType === 'user' ? customer.user_id : customer.personnel_id,
          rfid_card_id: customer.rfid_card_id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          balance: customer.balance,
          type: customerType
        }
      }
    });
  } catch (error) {
    console.error('Verify RFID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify RFID',
      error: error.message
    });
  }
});

module.exports = router;
