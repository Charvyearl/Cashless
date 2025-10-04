import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { PlusIcon } from '@heroicons/react/24/outline';

const EditProduct: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_name: '',
    price: '',
    category: '',
    stock_quantity: '0',
    description: ''
  });
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

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const res = await menuAPI.getProduct(Number(id));
        const p = res.data?.data;
        setForm({
          product_name: p.product_name || '',
          price: String(p.price ?? ''),
          category: p.category || '',
          stock_quantity: String(p.stock_quantity ?? '0'),
          description: p.description || ''
        });
      } catch (e) {
        console.error(e);
        alert('Failed to load product');
        navigate('/canteen');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await menuAPI.updateProduct(Number(id), {
        product_name: form.product_name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        stock_quantity: Number(form.stock_quantity)
      } as any);
      navigate('/canteen');
    } catch (e) {
      console.error(e);
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="mt-1 text-sm text-gray-600">Update menu item details</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Product Name</label>
              <input value={form.product_name} onChange={(e)=>setForm({ ...form, product_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Price</label>
              <input type="number" step="0.01" value={form.price} onChange={(e)=>setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
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
              <input type="number" value={form.stock_quantity} onChange={(e)=>setForm({ ...form, stock_quantity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e)=>setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={4} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 rounded-md border border-gray-300">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;


