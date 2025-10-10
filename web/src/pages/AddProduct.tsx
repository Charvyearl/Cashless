import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { menuAPI } from '../services/api';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    product_name: '',
    price: '',
    category: '',
    stock_quantity: '0',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await menuAPI.getCategories();
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to default categories
        setCategories([
          { id: 1, name: 'Food' },
          { id: 2, name: 'Beverage' },
          { id: 3, name: 'Snacks' }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    // Check if category already exists
    const exists = categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase());
    if (exists) {
      alert('Category already exists');
      return;
    }

    try {
      const response = await menuAPI.createCategory({
        name: newCategory.trim(),
        description: ''
      });
      
      const newCategoryData = response.data.data;
      setCategories([...categories, newCategoryData]);
      setForm({ ...form, category: newCategoryData.name });
      setNewCategory('');
      setShowAddCategory(false);
    } catch (error: any) {
      console.error('Failed to create category:', error);
      alert(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await menuAPI.deleteCategory(categoryId);
      
      // Remove category from local state
      setCategories(categories.filter(cat => cat.id !== categoryId));
      
      // Clear form category if it was the deleted one
      if (form.category === categoryName) {
        setForm({ ...form, category: '' });
      }
      
      alert('Category deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        product_name: form.product_name,
        description: form.description || undefined,
        price: Number(form.price),
        category: form.category,
        stock_quantity: Number(form.stock_quantity),
        is_available: true
      };
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/menu/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create product');
      navigate('/canteen');
    } catch (err) {
      console.error(err);
      alert('Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          <p className="mt-1 text-sm text-gray-600">Create a new menu item for the canteen</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Product Name</label>
              <input
                value={form.product_name}
                onChange={(e)=>setForm({ ...form, product_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e)=>setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                  disabled={loadingCategories}
                >
                  <option value="">{loadingCategories ? 'Loading categories...' : 'Select category'}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {form.category && (
                  <button
                    type="button"
                    onClick={() => {
                      const selectedCategory = categories.find(cat => cat.name === form.category);
                      if (selectedCategory) {
                        handleDeleteCategory(selectedCategory.id, selectedCategory.name);
                      }
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
                    title={`Delete ${form.category}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
              {showAddCategory && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={form.stock_quantity}
                onChange={(e)=>setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e)=>setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 rounded-md border border-gray-300">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-blue-600 text-black hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;


