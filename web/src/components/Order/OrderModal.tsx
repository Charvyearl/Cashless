import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { menuAPI } from '../../services/api';

interface Product {
  product_id: number;
  product_name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  is_available: boolean;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (orderData: any) => void;
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onOrderComplete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getProducts({ available_only: true });
      setProducts(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.is_available && product.stock_quantity > 0;
  });

  const categories = ['All Categories', ...Array.from(new Set(products.map(p => p.category)))];

  const addToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.product_id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        updateQuantity(product.product_id, existingItem.quantity + 1);
      }
    } else {
      const newItem: OrderItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.product_id !== productId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity, subtotal: item.unit_price * newQuantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleProceedToPayment = () => {
    if (orderItems.length === 0) {
      alert('Please add items to your order');
      return;
    }

    const orderData = {
      items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      total_amount: getTotalAmount()
    };

    onOrderComplete(orderData);
  };

  const getProductQuantityInOrder = (productId: number) => {
    const orderItem = orderItems.find(item => item.product_id === productId);
    return orderItem ? orderItem.quantity : 0;
  };

  const getMaxQuantityForProduct = (product: Product) => {
    return product.stock_quantity;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Products List */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-4 space-y-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const quantityInOrder = getProductQuantityInOrder(product.product_id);
                  const maxQuantity = getMaxQuantityForProduct(product);
                  
                  return (
                    <div key={product.product_id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-semibold text-green-600">
                          {currency(product.price)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Stock: {product.stock_quantity}
                        </span>
                      </div>
                      
                      {quantityInOrder === 0 ? (
                        <button
                          onClick={() => addToOrder(product)}
                          className="mt-2 text-white px-4 py-2 text-base rounded border-0 inline-flex items-center gap-2"
                          style={{ backgroundColor: '#5FA9FF', border: 'none' }}
                        >
                          <PlusIcon className="w-5 h-5" />
                          Add
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="w-80 border-l bg-gray-50 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="flex-1 overflow-y-auto">
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items in order</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={item.product_id} className="bg-white p-3 rounded-md border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{item.product_name}</h4>
                        <button
                          onClick={() => updateQuantity(item.product_id, 0)}
                          className="text-white text-xs px-2 py-1 rounded border-0"
                          style={{ backgroundColor: '#5FA9FF', border: 'none' }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 border-0"
                            style={{ border: 'none' }}
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                          <span className="font-medium min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 border-0"
                            style={{ border: 'none' }}
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{currency(item.unit_price)} each</div>
                          <div className="font-semibold">{currency(item.subtotal)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total and Checkout */}
            {orderItems.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    {currency(getTotalAmount())}
                  </span>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  className="w-full text-white py-3 rounded-md font-medium border-0"
                  style={{ backgroundColor: '#5FA9FF', border: 'none' }}
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
