import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canteenOrdersAPI } from '../services/api';

const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const CanteenTransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const res = await canteenOrdersAPI.getOrderDetails(Number(id));
        if (res.data.success) {
          setTransaction(res.data.data);
        } else {
          setError(res.data.message || 'Failed to fetch transaction details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch transaction details');
        console.error('Error fetching transaction details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded ${badgeClasses[status as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading transaction details...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!transaction) return <div className="p-6">Transaction not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transaction #{transaction.transaction.transaction_id}</h1>
        <button
          onClick={() => navigate('/canteen')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Transaction ID</p>
            <p className="text-lg font-medium text-gray-900">#{transaction.transaction.transaction_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">{getStatusBadge(transaction.transaction.status)}</div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-lg font-medium text-gray-900">{currency(transaction.transaction.total_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="text-lg font-medium text-gray-900">{transaction.transaction.payment_method}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="text-lg font-medium text-gray-900">
              {transaction.customer ? `${transaction.customer.first_name} ${transaction.customer.last_name}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transaction Date</p>
            <p className="text-lg font-medium text-gray-900">{new Date(transaction.transaction.transaction_date).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Transaction Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transaction.items.map((item: any) => (
                <tr key={item.transaction_item_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{currency(item.unit_price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{currency(item.subtotal)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Total:
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  {currency(transaction.transaction.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CanteenTransactionDetails;
