import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UsersIcon, 
  ChartBarIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  AcademicCapIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../components/Dashboard/StatsCard';
import { canteenOrdersAPI, adminAPI, dashboardAPI } from '../services/api';
import { Student, Personnel } from '../types';
import CreateAccountModal from '../components/Admin/CreateAccountModal';
import EditAccountModal from '../components/Admin/EditAccountModal';
import AddMoneyModal from '../components/Admin/AddMoneyModal';
import AccountList from '../components/Admin/AccountList';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  total_users: number;
  total_transactions: number;
  total_revenue: number;
  active_wallets: number;
  daily_transactions: number;
  daily_revenue: number;
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const Badge: React.FC<{ tone: 'gray' | 'green' | 'red' | 'yellow' | 'blue'; label: string }>
  = ({ tone, label }) => {
  const styles: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700'
  };
  return <span className={`px-2 py-1 text-xs rounded ${styles[tone]}`}>{label}</span>;
};

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_transactions: 0,
    total_revenue: 0,
    active_wallets: 0,
    daily_transactions: 0,
    daily_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // User management state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Student | Personnel | null>(null);
  const [userManagementTab, setUserManagementTab] = useState<'students' | 'personnel'>('students');
  

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats();
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          console.error('Failed to fetch dashboard stats:', response.data.message);
          // Fallback to default values
          setStats({
            total_users: 0,
            total_transactions: 0,
            total_revenue: 0,
            active_wallets: 0,
            daily_transactions: 0,
            daily_revenue: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Fallback to default values
        setStats({
          total_users: 0,
          total_transactions: 0,
          total_revenue: 0,
          active_wallets: 0,
          daily_transactions: 0,
          daily_revenue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const response = await canteenOrdersAPI.getOrders({ limit: 100 });
      setTransactions(response.data?.data?.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // User management handlers
  const handleEdit = (account: Student | Personnel) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleAddMoney = (account: Student | Personnel) => {
    setSelectedAccount(account);
    setShowAddMoneyModal(true);
  };

  const handleDelete = async (id: number) => {
    console.log('Delete clicked for ID:', id, 'Type:', userManagementTab);
    if (window.confirm('Delete this account?')) {
      try {
        if (userManagementTab === 'students') {
          console.log('Calling deleteStudent with ID:', id);
          const response = await adminAPI.deleteStudent(id);
          console.log('Delete response:', response.data);
        } else {
          console.log('Calling deletePersonnel with ID:', id);
          const response = await adminAPI.deletePersonnel(id);
          console.log('Delete response:', response.data);
        }
        console.log('Delete successful!');
        alert('Account deleted successfully!');
      } catch (err: any) {
        console.error('Delete failed:', err);
        console.error('Error details:', err.response?.data);
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', name: 'User Management' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'reports', name: 'Reports' }
  ];

  return (
    <div className="space-y-6">
      {/* Finance Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage accounts, monitor transactions, and generate reports.
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <StatsCard
          title="Active Users"
          value={stats.total_users.toLocaleString()}
     
          changeType="increase"
          icon={UsersIcon}
          color="blue"
        />
        <StatsCard
          title="Total Transactions"
          value={stats.total_transactions}
          changeType="increase"
          icon={ChartBarIcon}
          color="blue"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Management Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-600">Manage student and personnel accounts</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* User Management Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setUserManagementTab('students')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  userManagementTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Students
              </button>
              <button
                onClick={() => setUserManagementTab('personnel')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  userManagementTab === 'personnel'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Personnel
              </button>
            </nav>
          </div>

          {/* User Management Content */}
          {userManagementTab === 'students' && (
            <AccountList
              accountType="student"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddMoney={handleAddMoney}
            />
          )}

          {userManagementTab === 'personnel' && (
            <AccountList
              accountType="personnel"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddMoney={handleAddMoney}
            />
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Transaction ID</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingTransactions && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Loading transactions…</td>
                  </tr>
                )}
                {!loadingTransactions && transactions.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>No transactions found</td>
                  </tr>
                )}
                {!loadingTransactions && transactions.map((t: any) => (
                  <tr key={t.transaction_id}>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">#{t.transaction_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {(t.personnel_last_name) ? `${t.personnel_last_name}` :
                         (t.user_last_name) ? `${t.user_last_name}` : '—'}
                      </div>
                      <div className="text-gray-500 text-xs">{t.personnel_rfid || t.user_rfid || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">{currency(t.total_amount)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'pending' && <Badge tone="yellow" label="Pending" />}
                      {t.status === 'ready' && <Badge tone="green" label="Ready" />}
                      {t.status === 'completed' && <Badge tone="blue" label="Completed" />}
                      {t.status === 'cancelled' && <Badge tone="red" label="Cancelled" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{new Date(t.transaction_date).toLocaleDateString()}</div>
                      <div className="text-gray-500 text-xs">{new Date(t.transaction_date).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/admin/transactions/${t.transaction_id}`)}
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-600">View system analytics and generate reports</p>
          </div>

          {/* Financial Reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
              Financial Reports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button 
                 onClick={() => navigate('/admin/reports/revenue-summary')}
                 className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
               >
                 <h4 className="font-medium text-gray-900">Revenue Summary</h4>
                 <p className="text-sm text-gray-500 mt-1">Total revenue and trends</p>
               </button>
               <button 
                 onClick={() => navigate('/admin/reports/transaction-analysis')}
                 className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
               >
                 <h4 className="font-medium text-gray-900">Transaction Analysis</h4>
                 <p className="text-sm text-gray-500 mt-1">Transaction patterns and insights</p>
               </button>
            </div>
          </div>

          {/* User Reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-blue-600" />
              User Reports
            </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <button 
                 onClick={() => navigate('/admin/reports/user-activity')}
                 className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
               >
                 <h4 className="font-medium text-gray-900">Activity Summary</h4>
                 <p className="text-sm text-gray-500 mt-1">User activity and engagement</p>
               </button>
               <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                 <h4 className="font-medium text-gray-900">Registration Trends</h4>
                 <p className="text-sm text-gray-500 mt-1">New user signups over time</p>
               </button>
               <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                 <h4 className="font-medium text-gray-900">Balance Distribution</h4>
                 <p className="text-sm text-gray-500 mt-1">User wallet balance ranges</p>
               </button>
             </div>
          </div>

          {/* Operational Reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <EyeIcon className="h-5 w-5 mr-2 text-purple-600" />
              Operational Reports
            </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <button 
                 onClick={() => navigate('/admin/reports/daily-summary')}
                 className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
               >
                 <h4 className="font-medium text-gray-900">Daily Summary</h4>
                 <p className="text-sm text-gray-500 mt-1">Today's performance overview</p>
               </button>
               <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                 <h4 className="font-medium text-gray-900">Weekly Performance</h4>
                 <p className="text-sm text-gray-500 mt-1">Week-over-week analysis</p>
               </button>
               <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                 <h4 className="font-medium text-gray-900">Peak Hours</h4>
                 <p className="text-sm text-gray-500 mt-1">Busiest transaction times</p>
               </button>
             </div>
          </div>

          {/* Export Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2 text-orange-600" />
              Export Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <h4 className="font-medium text-gray-900">PDF Download</h4>
                <p className="text-sm text-gray-500 mt-1">Generate PDF reports</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <h4 className="font-medium text-gray-900">CSV Export</h4>
                <p className="text-sm text-gray-500 mt-1">Export data to CSV</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <h4 className="font-medium text-gray-900">Print Report</h4>
                <p className="text-sm text-gray-500 mt-1">Print-friendly reports</p>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* User Management Modals */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />

      <EditAccountModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        accountType={userManagementTab === 'students' ? 'student' : 'personnel'}
        onSuccess={() => setShowEditModal(false)}
      />

      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => {
          setShowAddMoneyModal(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        accountType={userManagementTab === 'students' ? 'student' : 'personnel'}
        onSuccess={() => setShowAddMoneyModal(false)}
      />
    </div>
  );
};

export default Dashboard;
