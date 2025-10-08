import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { canteenOrdersAPI } from '../services/api';
import RFIDScanModal from '../components/Order/RFIDScanModal';

const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);

const CanteenOrderDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [details, setDetails] = useState<any>(null);
  const [payOpen, setPayOpen] = useState<boolean>(false);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await canteenOrdersAPI.getOrderDetails(Number(id));
      setDetails(res.data?.data || null);
    } catch (e) {
      console.error('Failed to load order details', e);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const markReady = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await canteenOrdersAPI.updateStatus(Number(id), 'ready');
      await load();
      alert('Order marked as ready');
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const proceedToPayment = async () => {
    setPayOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          {details && (
            <p className="mt-1 text-sm text-gray-600">Transaction #{details.transaction?.transaction_id} · Status: {details.transaction?.status}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/canteen')} className="px-3 py-2 border border-gray-300 rounded-md">Back</button>
          <button onClick={markReady} disabled={saving || loading} className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50">
            {saving ? 'Saving…' : 'Mark Ready'}
          </button>
          {details?.transaction?.status === 'ready' && (
            <button onClick={proceedToPayment} className="px-3 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
              Proceed to Payment
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4">
          {loading && <div className="text-gray-500">Loading…</div>}
          {!loading && details && (
            <>
              <div className="mb-4">
                <div className="text-sm text-gray-600">Payment: {details.transaction?.payment_method?.toUpperCase?.() || 'N/A'}</div>
                <div className="text-sm text-gray-600">Date: {new Date(details.transaction?.transaction_date || details.transaction?.created_at).toLocaleString()}</div>
                <div className="text-sm text-gray-900 font-medium mt-1">Total: {currency(details.transaction?.total_amount)}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Quantity</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Unit Price</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(details.items || []).map((it: any) => (
                      <tr key={it.transaction_item_id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{it.product_name}</div>
                          <div className="text-gray-500 text-xs">{it.description}</div>
                        </td>
                        <td className="px-4 py-3">{it.quantity}</td>
                        <td className="px-4 py-3">{currency(it.unit_price)}</td>
                        <td className="px-4 py-3">{currency(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <RFIDScanModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        orderData={{ items: (details?.items || []).map((it: any) => ({ product_id: it.product_id, quantity: it.quantity })), total_amount: details?.transaction?.total_amount || 0 }}
        onPaymentComplete={() => { setPayOpen(false); load(); }}
        existingTransactionId={Number(id)}
      />
    </div>
  );
};

export default CanteenOrderDetails;


