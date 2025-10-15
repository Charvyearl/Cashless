import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ArrowLeftIcon, CalendarIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { dashboardAPI } from '../services/api';

interface RevenueData {
  total_revenue: number;
  daily_revenue: number;
}

const RevenueSummary: React.FC = () => {
  const navigate = useNavigate();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats();
        if (response.data.success) {
          setRevenueData({
            total_revenue: response.data.data.total_revenue,
            daily_revenue: response.data.data.daily_revenue,
          });
        } else {
          setError('Failed to fetch revenue data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const printReport = () => {
    if (!revenueData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dailyRevenueShare = revenueData.total_revenue > 0 
      ? ((revenueData.daily_revenue / revenueData.total_revenue) * 100).toFixed(1)
      : '0';
    
    const averageDailyRevenue = revenueData.total_revenue > 0
      ? formatCurrency(revenueData.total_revenue / 30)
      : formatCurrency(0);

    const printContent = `<!DOCTYPE html>
<html>
  <head>
    <title>Revenue Summary Report</title>
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
        grid-template-columns: repeat(2, 1fr); 
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
      .total-revenue { color: #059669; }
      .daily-revenue { color: #2563eb; }
      .daily-share { color: #059669; }
      .avg-daily { color: #2563eb; }
      @media print { 
        body { margin: 0; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Revenue Summary Report</h1>
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
        <div class="metric-value total-revenue">${formatCurrency(revenueData.total_revenue)}</div>
        <div class="metric-label">Total Revenue</div>
      </div>
      <div class="metric">
        <div class="metric-value daily-revenue">${formatCurrency(revenueData.daily_revenue)}</div>
        <div class="metric-label">Today's Revenue</div>
      </div>
    </div>
    
    <div class="summary">
      <h2>Revenue Analysis</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value daily-share">
            ${dailyRevenueShare}%
          </div>
          <div class="summary-label">Daily Revenue Share</div>
        </div>
        <div class="summary-item">
          <div class="summary-value avg-daily">
            ${averageDailyRevenue}
          </div>
          <div class="summary-label">Average Daily Revenue</div>
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
              <ChartBarIcon className="h-6 w-6 mr-2 text-green-600" />
              Revenue Summary
            </h1>
            <p className="text-sm text-gray-600">Comprehensive revenue analytics and trends</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(revenueData?.total_revenue || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(revenueData?.daily_revenue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {revenueData && revenueData.total_revenue > 0 
                ? `${((revenueData.daily_revenue / revenueData.total_revenue) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-sm text-gray-600">Daily Revenue Share</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {revenueData && revenueData.total_revenue > 0
                ? formatCurrency(revenueData.total_revenue / 30)
                : formatCurrency(0)
              }
            </div>
            <p className="text-sm text-gray-600">Average Daily Revenue</p>
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

export default RevenueSummary;
