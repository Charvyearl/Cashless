const express = require('express');
const router = express.Router();
// const { MenuCategory, MenuItem } = require('../models/Menu'); // OLD MODELS - REMOVED
const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryRecord = require('../models/InventoryRecord');
const { verifyToken, requireStaff, optionalAuth } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { menuSchemas, productSchemas, inventoryRecordSchemas } = require('../utils/validation');

// Get full menu (public) - DISABLED (using products instead)
// router.get('/', optionalAuth, async (req, res) => {
//   try {
//     const menu = await MenuItem.getFullMenu();
//     
//     res.json({
//       success: true,
//       data: menu
//     });
//   } catch (error) {
//     console.error('Get menu error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get menu',
//       error: error.message
//     });
//   }
// });

// Get menu items with filters - DISABLED (using products instead)
// router.get('/items', optionalAuth, async (req, res) => {
//   try {
//     const options = {
//       category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
//       available_only: req.query.available_only !== 'false',
//       page: parseInt(req.query.page) || 1,
//       limit: parseInt(req.query.limit) || 50
//     };
//     
//     const items = await MenuItem.findAll(options);
//     
//     res.json({
//       success: true,
//       data: {
//         items,
//         pagination: {
//           page: options.page,
//           limit: options.limit
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get menu items error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get menu items',
//       error: error.message
//     });
//   }
// });

// Search menu items - DISABLED (using products instead)
// router.get('/search', optionalAuth, async (req, res) => {
//   try {
//     const { q: searchTerm } = req.query;
//     
//     if (!searchTerm) {
//       return res.status(400).json({
//         success: false,
//         message: 'Search term is required'
//       });
//     }
//     
//     const options = {
//       category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
//       available_only: req.query.available_only !== 'false',
//       page: parseInt(req.query.page) || 1,
//       limit: parseInt(req.query.limit) || 20
//     };
//     
//     const items = await MenuItem.search(searchTerm, options);
//     
//     res.json({
//       success: true,
//       data: {
//         items,
//         search_term: searchTerm,
//         pagination: {
//           page: options.page,
//           limit: options.limit
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Search menu error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Search failed',
//       error: error.message
//     });
//   }
// });

// Get menu categories - REMOVED (using new Category model below)

// Get single menu item - DISABLED (using products instead)
// router.get('/items/:id', optionalAuth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const item = await MenuItem.findById(id);
//     
//     if (!item) {
//       return res.status(404).json({
//         success: false,
//         message: 'Menu item not found'
//       });
//     }
//     
//     const category = await item.getCategory();
//     
//     res.json({
//       success: true,
//       data: {
//         ...item,
//         category: category ? {
//           id: category.id,
//           name: category.name,
//           description: category.description
//         } : null
//       }
//     });
//   } catch (error) {
//     console.error('Get menu item error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get menu item',
//       error: error.message
//     });
//   }
// });

// Create menu category - REMOVED (using new Category model below)

// Update menu category - REMOVED (using new Category model below)

// Delete menu category - REMOVED (using new Category model below)

// Create menu item (staff/admin only) - DISABLED (using products instead)
// router.post('/items', verifyToken, requireStaff, validate(menuSchemas.createItem), async (req, res) => {
//   try {
//     const item = await MenuItem.create(req.body);
//     
//     res.status(201).json({
//       success: true,
//       message: 'Menu item created successfully',
//       data: item
//     });
//   } catch (error) {
//     console.error('Create menu item error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create menu item',
//       error: error.message
//     });
//   }
// });

// Update menu item (staff/admin only) - DISABLED (using products instead)
// router.put('/items/:id', verifyToken, requireStaff, validate(menuSchemas.updateItem), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const item = await MenuItem.findById(id);
//     
//     if (!item) {
//       return res.status(404).json({
//         success: false,
//         message: 'Menu item not found'
//       });
//     }
//     
//     await item.update(req.body);
//     
//     res.json({
//       success: true,
//       message: 'Menu item updated successfully',
//       data: item
//     });
//   } catch (error) {
//     console.error('Update menu item error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update menu item',
//       error: error.message
//     });
//   }
// });

// Toggle menu item availability (staff/admin only) - DISABLED (using products instead)
// router.patch('/items/:id/availability', verifyToken, requireStaff, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const item = await MenuItem.findById(id);
//     
//     if (!item) {
//       return res.status(404).json({
//         success: false,
//         message: 'Menu item not found'
//       });
//     }
//     
//     await item.toggleAvailability();
//     
//     res.json({
//       success: true,
//       message: `Menu item ${item.is_available ? 'made available' : 'made unavailable'}`,
//       data: {
//         id: item.id,
//         name: item.name,
//         is_available: item.is_available
//       }
//     });
//   } catch (error) {
//     console.error('Toggle availability error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to toggle availability',
//       error: error.message
//     });
//   }
// });

// Delete menu item (staff/admin only) - DISABLED (using products instead)
// router.delete('/items/:id', verifyToken, requireStaff, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const item = await MenuItem.findById(id);
//     
//     if (!item) {
//       return res.status(404).json({
//         success: false,
//         message: 'Menu item not found'
//       });
//     }
//     
//     await item.delete();
//     
//     res.json({
//       success: true,
//       message: 'Menu item deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete menu item error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete menu item',
//       error: error.message
//     });
//   }
// });

// Products (Canteen Staff)
router.post('/products', verifyToken, requireStaff, validate(productSchemas.create), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
});

router.get('/products', optionalAuth, async (req, res) => {
  try {
    const { category, category_id, available_only } = req.query;
    // Backward compatibility: support old ?category=name and new ?category_id=ID
    const opts = { available_only: available_only !== 'false' };
    if (category_id) {
      opts.category_id = parseInt(category_id, 10);
    } else if (category) {
      // If only name provided, Product.findAll will still match by joined name via category filter below
      // For now, pass as category_id is absent
      opts.category = category;
    }
    const items = await Product.findAll(opts);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ success: false, message: 'Failed to list products', error: error.message });
  }
});

router.get('/products/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Failed to get product', error: error.message });
  }
});

router.put('/products/:id', verifyToken, requireStaff, validate(productSchemas.update), async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    await item.update(req.body);
    res.json({ success: true, message: 'Product updated', data: item });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
});

router.patch('/products/:id/availability', verifyToken, requireStaff, async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    await item.toggleAvailability();
    res.json({ success: true, data: { product_id: item.product_id, is_available: item.is_available } });
  } catch (error) {
    console.error('Toggle product availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle availability', error: error.message });
  }
});

router.delete('/products/:id', verifyToken, requireStaff, async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
    await item.delete();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
});

// ===== INVENTORY RECORDS ENDPOINTS =====

// Create inventory record (staff/admin only)
router.post('/inventory-records', verifyToken, requireStaff, validate(inventoryRecordSchemas.create), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Get user info from token - verify personnel exists in database
    let userId = null;
    let personnelId = null;
    
    if (req.user.user_type === 'student') {
      userId = req.user.id;
    } else if (req.user.user_type === 'staff' || req.user.user_type === 'admin') {
      // Verify the personnel_id actually exists in the personnel table
      try {
        const [personnelRows] = await pool.execute(
          'SELECT personnel_id FROM personnel WHERE personnel_id = ? AND is_active = TRUE',
          [req.user.id]
        );
        if (personnelRows.length > 0) {
          personnelId = req.user.id;
        } else {
          // Personnel doesn't exist, set to null (will be ignored by foreign key)
          console.warn(`Personnel ID ${req.user.id} not found in personnel table, setting personnel_id to null`);
          personnelId = null;
        }
      } catch (error) {
        console.error('Error checking personnel:', error);
        personnelId = null;
      }
    }
    
    const recordData = {
      ...req.body,
      user_id: userId,
      personnel_id: personnelId
    };
    
    const record = await InventoryRecord.create(recordData);
    res.status(201).json({ success: true, message: 'Inventory record created', data: record });
  } catch (error) {
    console.error('Create inventory record error:', error);
    res.status(500).json({ success: false, message: 'Failed to create inventory record', error: error.message });
  }
});

// Get all inventory records (staff/admin only)
router.get('/inventory-records', verifyToken, requireStaff, async (req, res) => {
  try {
    const { product_id, user_id, personnel_id, start_date, end_date, page, limit } = req.query;
    
    const options = {
      product_id: product_id ? parseInt(product_id) : undefined,
      user_id: user_id ? parseInt(user_id) : undefined,
      personnel_id: personnel_id ? parseInt(personnel_id) : undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100
    };
    
    const records = await InventoryRecord.findAll(options);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get inventory records error:', error);
    res.status(500).json({ success: false, message: 'Failed to get inventory records', error: error.message });
  }
});

// Get inventory record by ID (staff/admin only)
router.get('/inventory-records/:id', verifyToken, requireStaff, async (req, res) => {
  try {
    const record = await InventoryRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Get inventory record error:', error);
    res.status(500).json({ success: false, message: 'Failed to get inventory record', error: error.message });
  }
});

// Get inventory records by product ID (staff/admin only)
router.get('/products/:id/inventory-records', verifyToken, requireStaff, async (req, res) => {
  try {
    const { limit } = req.query;
    const records = await InventoryRecord.findByProductId(req.params.id, { limit: limit ? parseInt(limit) : undefined });
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get product inventory records error:', error);
    res.status(500).json({ success: false, message: 'Failed to get product inventory records', error: error.message });
  }
});

// ===== CATEGORY ENDPOINTS =====

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json({
      success: true,
      data: categories.map(cat => cat.toJSON())
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

// Create new category
router.post('/categories', verifyToken, requireStaff, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.getByName(name.trim());
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = await Category.create({
      name: name.trim()
    });

    res.status(201).json({
      success: true,
      data: category.toJSON(),
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// Delete category (staff/admin only)
router.delete('/categories/:id', verifyToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await category.delete();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

module.exports = router;
