import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { dashboardAPI } from '../services/api';

interface DailySummaryData {
  total_transactions: number;
  total_revenue: number;
  average_transaction_value: number;
}

const DailySummary: React.FC = () => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailySummary = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        if (response.data.success) {
          setSummaryData({
            total_transactions: response.data.data.daily_transactions,
            total_revenue: response.data.data.daily_revenue,
            average_transaction_value: response.data.data.daily_revenue / response.data.data.daily_transactions,
          });
        } else {
          setError('Failed to fetch daily summary data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch daily summary data');
      } finally {
        setLoading(false);
      }
    };

    fetchDailySummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-purple-600" />
              Daily Summary
            </h1>
            <p className="text-sm text-gray-600">Today's performance overview</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summaryData?.total_transactions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summaryData?.total_revenue || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Transaction</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summaryData?.average_transaction_value || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {summaryData && summaryData.total_transactions > 0 ? 'Good' : 'No Activity'}
            </div>
            <p className="text-sm text-gray-600">Transaction Activity</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {summaryData && summaryData.total_revenue > 0 ? 'Active' : 'Inactive'}
            </div>
            <p className="text-sm text-gray-600">Revenue Status</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => alert('PDF export functionality coming soon!')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Export PDF
        </button>
        <button
          onClick={() => alert('CSV export functionality coming soon!')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Print Report
        </button>
      </div>
    </div>
  );
};

export default DailySummary;