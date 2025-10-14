import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ArrowLeftIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { reportsAPI } from '../services/api';

interface RegistrationTrend {
  date: string;
  new_users: number;
  students: number;
  personnel: number;
}

interface ActivityMetric {
  metric: string;
  value: number;
}

const UserReports: React.FC = () => {
  const navigate = useNavigate();
  const [trends, setTrends] = useState<RegistrationTrend[]>([]);
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [selectedDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trendsResponse, activityResponse] = await Promise.all([
        reportsAPI.getUserRegistrationTrends(selectedDays),
        reportsAPI.getUserActivitySummary()
      ]);

      if (trendsResponse.data.success) {
        setTrends(trendsResponse.data.data.trends);
      }

      if (activityResponse.data.success) {
        setActivityMetrics(activityResponse.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalNewUsers = () => {
    return trends.reduce((sum, trend) => sum + trend.new_users, 0);
  };

  const getAverageDailyRegistrations = () => {
    return trends.length > 0 ? Math.round(getTotalNewUsers() / trends.length) : 0;
  };

  if (loading) {
    return (
      <div className="p-6">
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
              User Reports
            </h1>
            <p className="text-sm text-gray-600">User registration trends and activity insights</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Report Period:</label>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {activityMetrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{metric.metric}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metric.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Trends Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {getTotalNewUsers()}
            </div>
            <p className="text-sm text-gray-600">Total New Users ({selectedDays} days)</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {getAverageDailyRegistrations()}
            </div>
            <p className="text-sm text-gray-600">Average Daily Registrations</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {trends.length > 0 ? Math.round((trends[0]?.new_users || 0) / Math.max(getAverageDailyRegistrations(), 1) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Today vs Average</p>
          </div>
        </div>
      </div>

      {/* Registration Trends Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Registration Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total New Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personnel
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trends.map((trend, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(trend.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.new_users}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.personnel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {trends.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No registration data available for the selected period.
          </div>
        )}
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

export default UserReports;
