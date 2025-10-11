import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CanteenDashboard from './pages/CanteenDashboard';
import CreateOrder from './pages/CreateOrder';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import CanteenOrderDetails from './pages/CanteenOrderDetails';
import CanteenTransactionDetails from './pages/CanteenTransactionDetails';
import AdminTransactionDetails from './pages/AdminTransactionDetails';
import RevenueSummary from './pages/RevenueSummary';
import TransactionAnalysis from './pages/TransactionAnalysis';
import UserActivitySummary from './pages/UserActivitySummary';
import DailySummary from './pages/DailySummary';
import Login from './pages/Login';

import Users from './pages/Users';
import Menu from './pages/Menu';
import Transactions from './pages/Transactions';
const Settings = () => <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>Coming soon...</p></div>;

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={user?.user_type === 'staff' ? <CanteenDashboard /> : <Dashboard />} />
        <Route path="canteen" element={<CanteenDashboard />} />
        <Route path="canteen/order" element={<CreateOrder />} />
        <Route path="canteen/orders/:id" element={<CanteenOrderDetails />} />
        <Route path="canteen/transactions/:id" element={<CanteenTransactionDetails />} />
            <Route path="admin/transactions/:id" element={<AdminTransactionDetails />} />
            <Route path="admin/reports/revenue-summary" element={<RevenueSummary />} />
            <Route path="admin/reports/transaction-analysis" element={<TransactionAnalysis />} />
            <Route path="admin/reports/user-activity" element={<UserActivitySummary />} />
            <Route path="admin/reports/daily-summary" element={<DailySummary />} />
        <Route path="canteen/add" element={<AddProduct />} />
        <Route path="canteen/edit/:id" element={<EditProduct />} />
        <Route path="users" element={<Users />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="menu" element={<Menu />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;