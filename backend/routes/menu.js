const express = require('express');
const router = express.Router();
// const { MenuCategory, MenuItem } = require('../models/Menu'); // OLD MODELS - REMOVED
const Product = require('../models/Product');
const Category = require('../models/Category');
const { verifyToken, requireStaff, optionalAuth } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { menuSchemas, productSchemas } = require('../utils/validation');

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
    const { category, available_only } = req.query;
    const items = await Product.findAll({ category, available_only: available_only !== 'false' });
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
