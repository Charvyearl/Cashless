import React, { useState, useEffect } from 'react';
import { XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Student, Personnel } from '../../types';
import { walletsAPI } from '../../services/api';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Student | Personnel | null;
  accountType: 'student' | 'personnel';
  onSuccess: () => void;
}

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  account,
  accountType,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account && isOpen) {
      setAmount('');
    }
  }, [account, isOpen]);

  const formatBalance = (balance: any): string => {
    if (typeof balance === 'number') {
      return balance.toFixed(2);
    }
    if (typeof balance === 'string') {
      const numBalance = parseFloat(balance);
      return isNaN(numBalance) ? '0.00' : numBalance.toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (numAmount > 10000) {
      setError('Amount cannot exceed ₱10,000');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = 'user_id' in account ? account.user_id : account.personnel_id;
      await walletsAPI.topUp(
        userId,
        numAmount,
        undefined,
        accountType
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add money to account');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  if (!isOpen || !account) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative z-[10000]"
        style={{ position: 'relative', zIndex: 10000, border: '1px solid #000000' }}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-600" />
            Add Money
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Account Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Account Details</h3>
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {account.first_name} {account.last_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>RFID:</strong> {account.rfid_card_id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current Balance:</strong> 
              <span className="font-semibold text-green-600 ml-1">
                ₱{formatBalance(account.balance)}
              </span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₱)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                max="10000"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Amounts
              </label>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map(quickAmount => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border"
                  >
                    ₱{quickAmount}
                  </button>
                ))}
              </div>
            </div>


            <div className="flex justify-end space-x-6 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white rounded-md border-0"
                style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white rounded-md border-0 disabled:opacity-50"
                style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
              >
                {loading ? 'Adding...' : 'Add Money'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMoneyModal;
