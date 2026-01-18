import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { PlusIcon, PencilIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Product {
  product_id: number;
  product_name: string;
  description?: string;
  category: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
}

interface InventoryRecord {
  record_id: number;
  product_id: number;
  product_name: string;
  change_type: 'add' | 'adjust' | 'deduct';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_at: string;
  user_name?: string;
}

const InventoryRecords: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'adjust'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  useEffect(() => {
    loadProducts();
    loadRecords();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getProducts({ available_only: false });
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const response = await menuAPI.getInventoryRecords({ limit: 500 });
      setRecords(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load inventory records:', error);
      // Don't show alert, just log error - records are optional
    }
  };

  const saveRecord = async (recordData: {
    product_id: number;
    change_type: 'add' | 'adjust' | 'deduct';
    quantity_change: number;
    previous_stock: number;
    new_stock: number;
    notes?: string;
  }) => {
    try {
      await menuAPI.createInventoryRecord(recordData);
      // Reload records to get the latest data from backend
      await loadRecords();
    } catch (error: any) {
      console.error('Failed to save inventory record:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      console.error('Backend error:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleAdjustStock = (product: Product, type: 'add' | 'adjust') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setAdjustQuantity('');
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct || !adjustQuantity) return;

    const quantity = parseInt(adjustQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setAdjusting(true);
    try {
      const previousStock = selectedProduct.stock_quantity;
      let newStock: number;

      if (adjustType === 'add') {
        newStock = previousStock + quantity;
      } else {
        // Adjust to specific amount
        newStock = quantity;
      }

      // Update product via API
      await menuAPI.updateProduct(selectedProduct.product_id, {
        stock_quantity: newStock,
      } as any);

      // Save inventory record
      await saveRecord({
        product_id: selectedProduct.product_id,
        change_type: adjustType === 'add' ? 'add' : 'adjust',
        quantity_change: adjustType === 'add' ? quantity : newStock - previousStock,
        previous_stock: previousStock,
        new_stock: newStock,
        notes: adjustNotes || undefined,
      });

      // Reload products
      await loadProducts();

      // Close modal
      setShowAdjustModal(false);
      setSelectedProduct(null);
      setAdjustQuantity('');
      setAdjustNotes('');
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to adjust stock';
      alert(`Failed to adjust stock: ${errorMessage}`);
    } finally {
      setAdjusting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/canteen')}
            className="flex items-center space-x-2 text-white transition-colors"
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px',
              backgroundColor: '#5FA9FF',
              border: 'none'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4A8FE7'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5FA9FF'}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Inventory Records
            </h1>
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
              Manage product stock levels and track inventory changes
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/canteen/add')}
          className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-md border-0"
          style={{ backgroundColor: '#5FA9FF', border: 'none' }}
        >
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            color: '#9CA3AF'
          }} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 40px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Products ({filteredProducts.length})
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Product
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Category
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Price
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Stock
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.product_id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{product.product_name}</div>
                      {product.description && (
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                      {product.category}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                      {currency(product.price)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: product.stock_quantity > 0 ? '#D1FAE5' : '#FEE2E2',
                        color: product.stock_quantity > 0 ? '#065F46' : '#991B1B'
                      }}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {product.stock_quantity === 0 ? (
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B'
                        }}>
                          Out of Stock
                        </span>
                      ) : product.is_available ? (
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#D1FAE5',
                          color: '#065F46'
                        }}>
                          Available
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#FEF3C7',
                          color: '#92400E'
                        }}>
                          Disabled
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleAdjustStock(product, 'add')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Add Stock"
                        >
                          <PlusIcon style={{ width: '16px', height: '16px' }} />
                          Add
                        </button>
                        <button
                          onClick={() => handleAdjustStock(product, 'adjust')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#5FA9FF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Adjust Stock"
                        >
                          <PencilIcon style={{ width: '16px', height: '16px' }} />
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Records Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Inventory History ({filteredRecords.length})
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Date & Time
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Product
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Type
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Change
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Previous
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  New
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                    No inventory records yet
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.record_id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '14px' }}>
                      {formatDate(record.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                      {record.product_name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: record.change_type === 'add' ? '#D1FAE5' : '#DBEAFE',
                        color: record.change_type === 'add' ? '#065F46' : '#1E40AF'
                      }}>
                        {record.change_type === 'add' ? 'Addition' : record.change_type === 'adjust' ? 'Adjustment' : 'Deduction'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: record.quantity_change >= 0 ? '#10B981' : '#EF4444' }}>
                      {record.quantity_change >= 0 ? '+' : ''}{record.quantity_change}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6B7280' }}>
                      {record.previous_stock}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#111827', fontWeight: '500' }}>
                      {record.new_stock}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '14px' }}>
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              {adjustType === 'add' ? 'Add Stock' : 'Adjust Stock'} - {selectedProduct.product_name}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                Current Stock: <strong>{selectedProduct.stock_quantity}</strong>
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                {adjustType === 'add' ? 'Quantity to Add' : 'New Stock Quantity'}
              </label>
              <input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                min="1"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                autoFocus
              />
            </div>

            {adjustType === 'adjust' && adjustQuantity && !isNaN(parseInt(adjustQuantity)) && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Change: <strong style={{ color: parseInt(adjustQuantity) - selectedProduct.stock_quantity >= 0 ? '#10B981' : '#EF4444' }}>
                    {parseInt(adjustQuantity) - selectedProduct.stock_quantity >= 0 ? '+' : ''}
                    {parseInt(adjustQuantity) - selectedProduct.stock_quantity}
                  </strong>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                Notes (Optional)
              </label>
              <textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedProduct(null);
                  setAdjustQuantity('');
                  setAdjustNotes('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                disabled={adjusting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAdjustment}
                disabled={adjusting || !adjustQuantity}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: adjusting || !adjustQuantity ? '#9CA3AF' : '#5FA9FF',
                  color: 'white',
                  border: 'none',
                  cursor: adjusting || !adjustQuantity ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {adjusting ? 'Saving...' : adjustType === 'add' ? 'Add Stock' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryRecords;

