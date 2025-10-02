import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { FunnelIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

type InventoryStatus = 'available' | 'out_of_stock' | 'disabled';

interface MenuItemRow {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: InventoryStatus;
  prepTimeMin: number;
}


const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const StatCard: React.FC<{ title: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode }>
  = ({ title, value, sub, color = 'text-gray-800', icon }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        {icon}
      </div>
    </div>
  );
};

const Badge: React.FC<{ tone: 'gray' | 'green' | 'red' | 'yellow'; label: string }>
  = ({ tone, label }) => {
  const styles: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700'
  };
  return <span className={`px-2 py-1 text-xs rounded ${styles[tone]}`}>{label}</span>;
};

const CanteenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'analytics'>('menu');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');

  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'All Categories') return menuItems;
    return menuItems.filter(i => i.category === categoryFilter);
  }, [categoryFilter, menuItems]);

  const totals = useMemo(() => {
    const totalItems = menuItems.length;
    const available = menuItems.filter(i => i.stock > 0 && i.status === 'available').length;
    const outOfStock = menuItems.filter(i => i.stock === 0).length;
    const inventoryValue = menuItems.reduce((acc, i) => acc + i.price * Math.max(i.stock, 0), 0);
    return { totalItems, available, outOfStock, inventoryValue };
  }, [menuItems]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await menuAPI.getProducts({ available_only: false });
        const rows = (res.data?.data || []).map((p: any) => ({
          id: p.product_id,
          name: p.product_name,
          description: p.description,
          category: p.category,
          price: p.price,
          stock: p.stock_quantity,
          status: p.is_available ? 'available' : 'disabled',
          prepTimeMin: 0
        })) as MenuItemRow[];
        setMenuItems(rows);
      } catch (e) {
        console.error('Failed to load products', e);
      }
    };
    load();
  }, []);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canteen Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Manage orders, menu items, and inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
          <button 
            onClick={() => navigate('/canteen/order')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            <PlusIcon className="w-5 h-5" />
             Order
          </button>
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Orders" value={8} sub="Awaiting preparation" />
        <StatCard title="Completed Today" value={156} sub="+12% from yesterday" color="text-green-700" />
        <StatCard title="Today's Revenue" value={currency(3650.75)} sub="+8.5% from yesterday" color="text-blue-700" />
        <StatCard title="Average Order" value={currency(23.4)} sub="+3.2% from yesterday" color="text-purple-700" />
      </div>

      {/* Tabs */}
      <div className="rounded-full border border-gray-300 flex overflow-hidden w-full">
        <button onClick={() => setActiveTab('orders')} className={`flex-1 px-4 py-2 text-sm ${activeTab === 'orders' ? 'bg-gray-100' : ''}`}>Order Management</button>
        <button onClick={() => setActiveTab('menu')} className={`flex-1 px-4 py-2 text-sm ${activeTab === 'menu' ? 'bg-gray-100' : ''}`}>Menu & Inventory</button>
        <button onClick={() => setActiveTab('analytics')} className={`flex-1 px-4 py-2 text-sm ${activeTab === 'analytics' ? 'bg-gray-100' : ''}`}>Analytics</button>
      </div>

      {/* Inventory summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={totals.totalItems} />
        <StatCard title="Available Items" value={totals.available} />
        <StatCard title="Out of Stock" value={totals.outOfStock} />
        <StatCard title="Inventory Value" value={currency(totals.inventoryValue)} />
      </div>

      {/* Menu Items table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">All Categories</label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Categories</option>
                <option>Food</option>
                <option>Beverage</option>
              </select>
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-2 top-2.5" />
            </div>
          </div>
          <button onClick={() => navigate('/canteen/add')} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
            <PlusIcon className="w-5 h-5" />
            Add Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Prep Time</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.name}</div>
                    <div className="text-gray-500 text-xs">{row.description}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone="gray" label={row.category} /></td>
                  <td className="px-4 py-3">{currency(row.price)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{row.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'available' && <Badge tone="green" label="Available" />}
                    {row.status === 'out_of_stock' && <Badge tone="red" label="Out of Stock" />}
                    {row.status === 'disabled' && <Badge tone="yellow" label="Disabled" />}
                  </td>
                  <td className="px-4 py-3">{row.prepTimeMin} min</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={async () => {
                          try {
                            await menuAPI.toggleProductAvailability(row.id);
                            const list = await menuAPI.getProducts({ available_only: false });
                            const rows = (list.data?.data || []).map((p: any) => ({
                              id: p.product_id,
                              name: p.product_name,
                              description: p.description,
                              category: p.category,
                              price: p.price,
                              stock: p.stock_quantity,
                              status: p.is_available ? 'available' : 'disabled',
                              prepTimeMin: 0
                            })) as MenuItemRow[];
                            setMenuItems(rows);
                          } catch (e) {
                            console.error(e);
                            alert('Failed to toggle availability');
                          }
                        }}
                        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                      >
                        {row.status === 'available' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => navigate(`/canteen/edit/${row.id}`)}
                        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          const proceed = window.confirm('Delete this product?');
                          if (!proceed) return;
                          try {
                            await menuAPI.deleteProduct(row.id);
                            setMenuItems(prev => prev.filter(i => i.id !== row.id));
                          } catch (e) {
                            console.error(e);
                            alert('Failed to delete product');
                          }
                        }}
                        className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CanteenDashboard;


