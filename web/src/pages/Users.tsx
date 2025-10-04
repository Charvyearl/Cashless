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

  const handleDelete = async (id: number) => {
    console.log('Delete clicked for ID:', id, 'Type:', activeTab);
    if (window.confirm('Delete this account?')) {
      try {
        if (activeTab === 'students') {
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
        // Don't auto-refresh - let user see the console logs
        // window.location.reload();
      } catch (err: any) {
        console.error('Delete failed:', err);
        console.error('Error details:', err.response?.data);
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
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
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Account
        </button>
      </div>

      {/* Simple Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Students
          </button>
          <button
            onClick={() => setActiveTab('personnel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'personnel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
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
          onDelete={handleDelete}
          onAddMoney={handleAddMoney}
        />
      )}

      {activeTab === 'personnel' && (
        <AccountList
          accountType="personnel"
          onEdit={handleEdit}
          onDelete={handleDelete}
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
