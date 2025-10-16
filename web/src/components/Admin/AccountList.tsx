import React, { useState, useEffect } from 'react';
import { 
  PencilIcon,
  XMarkIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../services/api';
import { Student, Personnel } from '../../types';

interface AccountListProps {
  accountType: 'student' | 'personnel';
  onEdit: (account: Student | Personnel) => void;
  onToggleActive: (account: Student | Personnel) => void;
  onAddMoney: (account: Student | Personnel) => void;
}

const AccountList: React.FC<AccountListProps> = ({
  accountType,
  onEdit,
  onToggleActive,
  onAddMoney
}) => {
  const [accounts, setAccounts] = useState<(Student | Personnel)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = accountType === 'student' 
        ? await adminAPI.getStudents({ limit: 100 })
        : await adminAPI.getPersonnel({ limit: 100 });
      
      setAccounts(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [accountType]);

  const filteredAccounts = accounts.filter(account => {
    const fullName = `${account.first_name} ${account.last_name}`.toLowerCase();
    const email = account.email?.toLowerCase() || '';
    const rfid = account.rfid_card_id.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || 
           email.includes(search) || 
           rfid.includes(search);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchAccounts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Search */}
      <div className="relative">
        <input
          type="text"
          placeholder={`Search ${accountType}s...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Simple Accounts List */}
      <div className="bg-white shadow rounded-md">
        {filteredAccounts.length === 0 ? (
          <div className="px-6 py-4 text-center text-gray-500">
            No {accountType}s found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAccounts.map((account) => (
              <div key={accountType === 'student' ? (account as Student).user_id : (account as Personnel).personnel_id} 
                   className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    account.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {account.first_name.charAt(0)}{account.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {account.first_name} {account.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {account.email || 'No email'} • RFID: {account.rfid_card_id}
                    </p>
                    <p className={`text-sm ${account.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onAddMoney(account)}
                      className="p-2 text-white rounded-lg border-0"
                      style={{ backgroundColor: '#5FA9FF', border: 'none' }}
                      title="Add money"
                    >
                      <CurrencyDollarIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onEdit(account)}
                      className="p-2 text-white rounded-lg border-0"
                      style={{ backgroundColor: '#5FA9FF', border: 'none' }}
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onToggleActive(account)}
                      className="p-2 text-white rounded-lg border-0"
                      style={{ backgroundColor: '#5FA9FF', border: 'none' }}
                      title={account.is_active ? "Make Inactive" : "Make Active"}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountList;
