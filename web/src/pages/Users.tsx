import React, { useState } from 'react';
import { PlusIcon, AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';
import { Student, Personnel } from '../types';
import CreateAccountModal from '../components/Admin/CreateAccountModal';
import EditAccountModal from '../components/Admin/EditAccountModal';
import AddMoneyModal from '../components/Admin/AddMoneyModal';
import AccountList from '../components/Admin/AccountList';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';

const Users: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Student | Personnel | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'personnel'>('students');

  const handleEdit = (account: Student | Personnel) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleAddMoney = (account: Student | Personnel) => {
    setSelectedAccount(account);
    setShowAddMoneyModal(true);
  };

  const handleToggleActive = async (account: Student | Personnel) => {
    const action = account.is_active ? 'deactivate' : 'activate';
    const confirmMessage = account.is_active 
      ? 'Are you sure you want to make this account inactive?' 
      : 'Are you sure you want to make this account active?';
    
    if (window.confirm(confirmMessage)) {
      try {
        const userId = 'user_id' in account ? account.user_id : account.personnel_id;
        const updateData = { is_active: !account.is_active };
        
        if (activeTab === 'students') {
          await adminAPI.updateStudent(userId, updateData);
        } else {
          await adminAPI.updatePersonnel(userId, updateData);
        }
        
        alert(`Account ${action}d successfully!`);
        // Refresh the page to show updated status
        window.location.reload();
      } catch (err: any) {
        console.error('Toggle active failed:', err);
        alert(`Failed to ${action} account: ` + (err.response?.data?.message || err.message));
      }
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to access account management</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="text-gray-500">Manage student and personnel accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 text-white rounded-md hover:bg-blue-700"
          style={{ backgroundColor: '#5FA9FF' }}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Account
        </button>
      </div>

      {/* Simple Tab Navigation */}
      <div>
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-4 font-medium text-sm flex items-center rounded-lg ${
              activeTab === 'students'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === 'students' ? { backgroundColor: '#5FA9FF' } : {}}
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Students
          </button>
          <button
            onClick={() => setActiveTab('personnel')}
            className={`py-2 px-4 font-medium text-sm flex items-center rounded-lg ${
              activeTab === 'personnel'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === 'personnel' ? { backgroundColor: '#5FA9FF' } : {}}
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Personnel
          </button>
        </nav>
      </div>

      {/* Simple Content */}
      {activeTab === 'students' && (
        <AccountList
          accountType="student"
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onAddMoney={handleAddMoney}
        />
      )}

      {activeTab === 'personnel' && (
        <AccountList
          accountType="personnel"
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onAddMoney={handleAddMoney}
        />
      )}

      {/* Simple Modals */}
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
        accountType={activeTab === 'students' ? 'student' : 'personnel'}
        onSuccess={() => setShowEditModal(false)}
      />

      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => {
          setShowAddMoneyModal(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        accountType={activeTab === 'students' ? 'student' : 'personnel'}
        onSuccess={() => setShowAddMoneyModal(false)}
      />
    </div>
  );
};

export default Users;
