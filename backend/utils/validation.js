const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    rfid_card_id: Joi.string().required().min(5).max(50),
    student_id: Joi.string().optional().min(3).max(20),
    first_name: Joi.string().required().min(2).max(100),
    last_name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional().min(10).max(20),
    user_type: Joi.string().valid('student', 'staff', 'admin').default('student')
  }),
  
  update: Joi.object({
    first_name: Joi.string().min(2).max(100),
    last_name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().min(10).max(20),
    is_active: Joi.boolean()
  })
};

// Student validation schemas
const studentSchemas = {
  create: Joi.object({
    rfid_card_id: Joi.string().required().min(5).max(50),
    first_name: Joi.string().required().min(2).max(100),
    last_name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().optional(),
    password: Joi.string().required().min(6).max(255),
    pin: Joi.string().required().length(4).pattern(/^\d{4}$/).messages({
      'string.length': 'PIN must be exactly 4 digits',
      'string.pattern.base': 'PIN must contain only numbers'
    }),
    balance: Joi.number().precision(2).min(0).max(10000).default(0)
  }),
  
  update: Joi.object({
    first_name: Joi.string().min(2).max(100),
    last_name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    balance: Joi.number().precision(2).min(0).max(10000),
    is_active: Joi.boolean()
  }),
  
  updatePassword: Joi.object({
    password: Joi.string().required().min(6).max(255)
  })
};

// Personnel validation schemas
const personnelSchemas = {
  create: Joi.object({
    rfid_card_id: Joi.string().required().min(5).max(50),
    first_name: Joi.string().required().min(2).max(100),
    last_name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().optional(),
    password: Joi.string().required().min(6).max(255),
    pin: Joi.string().required().length(4).pattern(/^\d{4}$/).messages({
      'string.length': 'PIN must be exactly 4 digits',
      'string.pattern.base': 'PIN must contain only numbers'
    }),
    balance: Joi.number().precision(2).min(0).max(10000).default(0)
  }),
  
  update: Joi.object({
    first_name: Joi.string().min(2).max(100),
    last_name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    balance: Joi.number().precision(2).min(0).max(10000),
    is_active: Joi.boolean()
  }),
  
  updatePassword: Joi.object({
    password: Joi.string().required().min(6).max(255)
  })
};

// Wallet validation schemas
const walletSchemas = {
  topUp: Joi.object({
    amount: Joi.number().positive().precision(2).max(10000).required(),
    description: Joi.string().optional().max(255)
  }),
  
  transfer: Joi.object({
    recipient_rfid: Joi.string().required().min(5).max(50),
    amount: Joi.number().positive().precision(2).required(),
    description: Joi.string().optional().max(255)
  })
};

// Menu validation schemas
const menuSchemas = {
  createItem: Joi.object({
    category_id: Joi.number().integer().positive().required(),
    name: Joi.string().required().min(2).max(200),
    description: Joi.string().optional().max(1000),
    price: Joi.number().positive().precision(2).max(1000).required(),
    stock: Joi.number().integer().min(0).default(0),
    image_url: Joi.string().uri().optional(),
    is_available: Joi.boolean().default(true)
  }),
  
  updateItem: Joi.object({
    category_id: Joi.number().integer().positive(),
    name: Joi.string().min(2).max(200),
    description: Joi.string().max(1000),
    price: Joi.number().positive().precision(2).max(1000),
    stock: Joi.number().integer().min(0),
    image_url: Joi.string().uri(),
    is_available: Joi.boolean()
  }),
  
  createCategory: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().optional().max(500)
  })
};

// Product validation schemas (canteen staff products)
const productSchemas = {
  create: Joi.object({
    product_name: Joi.string().required().min(2).max(200),
    description: Joi.string().allow('', null).max(1000),
    price: Joi.number().positive().precision(2).max(10000).required(),
    category: Joi.string().min(2).max(100),
    category_id: Joi.number().integer().positive(),
    stock_quantity: Joi.number().integer().min(0).default(0),
    is_available: Joi.boolean().default(true)
  }).or('category', 'category_id'), // Require either category or category_id
  update: Joi.object({
    product_name: Joi.string().min(2).max(200),
    description: Joi.string().allow('', null).max(1000),
    price: Joi.number().positive().precision(2).max(10000),
    category: Joi.string().min(2).max(100),
    category_id: Joi.number().integer().positive(),
    stock_quantity: Joi.number().integer().min(0),
    is_available: Joi.boolean()
  })
};

// Inventory Record validation schemas
const inventoryRecordSchemas = {
  create: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    change_type: Joi.string().valid('add', 'adjust', 'deduct').required(),
    quantity_change: Joi.number().integer().required(),
    previous_stock: Joi.number().integer().min(0).required(),
    new_stock: Joi.number().integer().min(0).required(),
    notes: Joi.string().allow('', null).max(1000).optional()
  })
};

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    items: Joi.array().items(
      Joi.object({
        menu_item_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().max(10).required()
      })
    ).min(1).required(),
    payment_method: Joi.string().valid('rfid', 'cash').default('rfid')
  })
};

// Reservation validation schemas
const reservationSchemas = {
  create: Joi.object({
    menu_item_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().max(5).required(),
    reservation_date: Joi.date().min('now').required()
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  userSchemas,
  studentSchemas,
  personnelSchemas,
  walletSchemas,
  menuSchemas,
  orderSchemas,
  reservationSchemas,
  productSchemas,
  inventoryRecordSchemas,
  validate
};
