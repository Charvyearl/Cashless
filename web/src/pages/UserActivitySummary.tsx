import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, ArrowLeftIcon, CalendarIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { dashboardAPI } from '../services/api';

interface UserActivityData {
  total_users: number;
  active_users: number;
  new_users_today: number;
}

const UserActivitySummary: React.FC = () => {
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState<UserActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        if (response.data.success) {
          setActivityData({
            total_users: response.data.data.total_users,
            active_users: response.data.data.active_users,
            new_users_today: response.data.data.new_users_today,
          });
        } else {
          setError('Failed to fetch user activity data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch user activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  const printReport = () => {
    if (!activityData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const userActivityRate = activityData.total_users > 0 
      ? ((activityData.active_users / activityData.total_users) * 100).toFixed(1)
      : '0';
    
    const averageDailyActiveUsers = activityData.total_users > 0
      ? Math.round(activityData.total_users / 30)
      : 0;

    const printContent = `<!DOCTYPE html>
<html>
  <head>
    <title>User Activity Summary Report</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 20px; 
        color: #333;
        line-height: 1.6;
      }
      .header { 
        text-align: center; 
        margin-bottom: 30px; 
        border-bottom: 2px solid #2563eb;
        padding-bottom: 20px;
      }
      .header h1 { 
        color: #2563eb; 
        margin: 0 0 10px 0; 
        font-size: 28px;
      }
      .header p { 
        color: #666; 
        margin: 0; 
        font-size: 14px;
      }
      .metrics { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 20px; 
        margin: 30px 0; 
      }
      .metric { 
        text-align: center; 
        padding: 25px; 
        border: 2px solid #e5e7eb; 
        border-radius: 12px; 
        background: #f9fafb;
      }
      .metric-value { 
        font-size: 28px; 
        font-weight: bold; 
        margin: 10px 0;
      }
      .metric-label { 
        color: #666; 
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .summary { 
        margin: 40px 0; 
        background: #f8fafc;
        padding: 30px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      .summary h2 { 
        color: #1e293b; 
        margin: 0 0 20px 0; 
        font-size: 22px;
        text-align: center;
      }
      .summary-grid { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 30px; 
        margin-top: 20px; 
      }
      .summary-item { 
        text-align: center; 
        padding: 25px; 
        border: 2px solid #e5e7eb; 
        border-radius: 12px; 
        background: white;
      }
      .summary-value { 
        font-size: 32px; 
        font-weight: bold; 
        margin: 10px 0;
      }
      .summary-label { 
        color: #666; 
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .total-users { color: #2563eb; }
      .active-users { color: #059669; }
      .new-users { color: #7c3aed; }
      .activity-rate { color: #2563eb; }
      .avg-daily { color: #059669; }
      @media print { 
        body { margin: 0; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>User Activity Summary Report</h1>
      <p>Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
    </div>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-value total-users">${activityData.total_users.toLocaleString()}</div>
        <div class="metric-label">Total Users</div>
      </div>
      <div class="metric">
        <div class="metric-value active-users">${activityData.active_users.toLocaleString()}</div>
        <div class="metric-label">Active Users</div>
      </div>
      <div class="metric">
        <div class="metric-value new-users">${activityData.new_users_today}</div>
        <div class="metric-label">New Users Today</div>
      </div>
    </div>
    
    <div class="summary">
      <h2>User Activity Analysis</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value activity-rate">
            ${userActivityRate}%
          </div>
          <div class="summary-label">User Activity Rate</div>
        </div>
        <div class="summary-item">
          <div class="summary-value avg-daily">
            ${averageDailyActiveUsers}
          </div>
          <div class="summary-label">Average Daily Active Users</div>
        </div>
      </div>
    </div>
  </body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
              <UsersIcon className="h-6 w-6 mr-2 text-blue-600" />
              User Activity Summary
            </h1>
            <p className="text-sm text-gray-600">User engagement and activity patterns</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activityData?.total_users.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activityData?.active_users.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Users Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activityData?.new_users_today || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {activityData ? `${((activityData.active_users / activityData.total_users) * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-sm text-gray-600">User Activity Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {activityData ? Math.round(activityData.total_users / 30) : 0}
            </div>
            <p className="text-sm text-gray-600">Average Daily Active Users</p>
          </div>
        </div>
      </div>

      {/* Print Option */}
      <div className="flex justify-end">
        <button
          onClick={printReport}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 transition-colors"
        >
          <PrinterIcon className="h-4 w-4" />
          <span>Print Report</span>
        </button>
      </div>
    </div>
  );
};

export default UserActivitySummary;