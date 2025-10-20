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
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Edit Product</h1>
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Update menu item details</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Product Name</label>
              <input 
                value={form.product_name} 
                onChange={(e)=>setForm({ ...form, product_name: e.target.value })} 
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '6px', 
                  marginBottom: '8px',
                  outline: 'none'
                }} 
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Price</label>
              <input 
                type="number" 
                step="0.01" 
                value={form.price} 
                onChange={(e)=>setForm({ ...form, price: e.target.value })} 
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '6px', 
                  marginBottom: '8px',
                  outline: 'none'
                }} 
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Category</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '6px',
                    marginBottom: '8px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
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
                  style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#5FA9FF', 
                    color: 'white', 
                    borderRadius: '6px', 
                    border: 'none',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4A8FE7'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5FA9FF'}
                >
                  <PlusIcon style={{ height: '16px', width: '16px' }} />
                  Add
                </button>
              </div>
              {showAddCategory && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    style={{ 
                      flex: 1, 
                      padding: '8px 12px', 
                      border: '1px solid #D1D5DB', 
                      borderRadius: '6px',
                      marginBottom: '8px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#5FA9FF', 
                      color: 'white', 
                      borderRadius: '6px', 
                      border: 'none',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4A8FE7'}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5FA9FF'}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory('');
                    }}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#5FA9FF', 
                      color: 'white', 
                      borderRadius: '6px', 
                      border: 'none',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4A8FE7'}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5FA9FF'}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Stock Quantity</label>
              <input 
                type="number" 
                value={form.stock_quantity} 
                onChange={(e)=>setForm({ ...form, stock_quantity: e.target.value })} 
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '6px', 
                  marginBottom: '8px',
                  outline: 'none'
                }} 
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                required 
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Description</label>
            <textarea 
              value={form.description} 
              onChange={(e)=>setForm({ ...form, description: e.target.value })} 
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #D1D5DB', 
                borderRadius: '6px', 
                marginBottom: '8px',
                outline: 'none',
                resize: 'vertical'
              }} 
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              rows={4} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={()=>navigate(-1)} 
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'white'}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                backgroundColor: '#5FA9FF', 
                color: 'white', 
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1
              }}
              onMouseEnter={(e) => !saving && ((e.target as HTMLButtonElement).style.backgroundColor = '#4A8FE7')}
              onMouseLeave={(e) => !saving && ((e.target as HTMLButtonElement).style.backgroundColor = '#5FA9FF')}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;


