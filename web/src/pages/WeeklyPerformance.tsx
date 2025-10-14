import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ArrowLeftIcon, CalendarIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { reportsAPI } from '../services/api';

interface WeeklyPerformanceData {
  week: number;
  week_start: string;
  total_transactions: number;
  total_revenue: number;
  avg_transaction_value: number;
  unique_users: number;
}

interface PeakHourData {
  hour: number;
  transaction_count: number;
  total_revenue: number;
  avg_transaction_value: number;
  unique_users: number;
}

interface DailyPatternData {
  day_name: string;
  day_number: number;
  transaction_count: number;
  total_revenue: number;
  avg_transaction_value: number;
}

const WeeklyPerformance: React.FC = () => {
  const navigate = useNavigate();
  const [weeklyData, setWeeklyData] = useState<WeeklyPerformanceData[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<PeakHourData[]>([]);
  const [dailyPatterns, setDailyPatterns] = useState<DailyPatternData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [selectedWeeks, selectedDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weeklyResponse, peakHoursResponse] = await Promise.all([
        reportsAPI.getWeeklyPerformance(selectedWeeks),
        reportsAPI.getPeakHours(selectedDays)
      ]);

      if (weeklyResponse.data.success) {
        setWeeklyData(weeklyResponse.data.data.weekly_performance);
      }

      if (peakHoursResponse.data.success) {
        setPeakHoursData(peakHoursResponse.data.data.peak_hours);
        setDailyPatterns(peakHoursResponse.data.data.daily_patterns);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatWeek = (weekStart: string) => {
    const date = new Date(weekStart);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getTopPeakHours = () => {
    return peakHoursData.slice(0, 5);
  };

  const getTotalWeeklyRevenue = () => {
    return weeklyData.reduce((sum, week) => sum + week.total_revenue, 0);
  };

  const getTotalWeeklyTransactions = () => {
    return weeklyData.reduce((sum, week) => sum + week.total_transactions, 0);
  };

  const getAverageWeeklyRevenue = () => {
    return weeklyData.length > 0 ? getTotalWeeklyRevenue() / weeklyData.length : 0;
  };

  const exportToCSV = () => {
    // Prepare weekly performance data
    const weeklyCSV = [
      ['Week', 'Week Start', 'Total Transactions', 'Total Revenue', 'Avg Transaction Value', 'Unique Users'],
      ...weeklyData.map(week => [
        `Week ${week.week}`,
        formatWeek(week.week_start),
        week.total_transactions.toString(),
        week.total_revenue.toString(),
        week.avg_transaction_value.toString(),
        week.unique_users.toString()
      ])
    ];

    // Prepare peak hours data
    const peakHoursCSV = [
      ['Hour', 'Transaction Count', 'Total Revenue', 'Avg Transaction Value', 'Unique Users'],
      ...peakHoursData.map(peak => [
        formatHour(peak.hour),
        peak.transaction_count.toString(),
        peak.total_revenue.toString(),
        peak.avg_transaction_value.toString(),
        peak.unique_users.toString()
      ])
    ];

    // Prepare daily patterns data
    const dailyPatternsCSV = [
      ['Day', 'Transaction Count', 'Total Revenue', 'Avg Transaction Value'],
      ...dailyPatterns.map(day => [
        day.day_name,
        day.transaction_count.toString(),
        day.total_revenue.toString(),
        day.avg_transaction_value.toString()
      ])
    ];

    // Combine all data
    const allData = [
      ['WEEKLY PERFORMANCE REPORT'],
      ['Generated on:', new Date().toLocaleString()],
      ['Period:', `${selectedWeeks} weeks`],
      [''],
      ...weeklyCSV,
      [''],
      ['PEAK HOURS ANALYSIS'],
      ['Period:', `${selectedDays} days`],
      [''],
      ...peakHoursCSV,
      [''],
      ['DAILY PATTERNS'],
      [''],
      ...dailyPatternsCSV
    ];

    // Convert to CSV string
    const csvContent = allData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `weekly-performance-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Create a simple HTML table for PDF generation
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Weekly Performance & Peak Hours Report</h1>
        <p style="color: #666; margin-bottom: 30px;">Generated on: ${new Date().toLocaleString()}</p>
        
        <h2 style="color: #374151; margin-bottom: 15px;">Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
          <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 5px 0; color: #374151;">Total Revenue</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2563eb;">${formatCurrency(getTotalWeeklyRevenue())}</p>
          </div>
          <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 5px 0; color: #374151;">Total Transactions</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #059669;">${getTotalWeeklyTransactions().toLocaleString()}</p>
          </div>
          <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 5px 0; color: #374151;">Average Weekly Revenue</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #7c3aed;">${formatCurrency(getAverageWeeklyRevenue())}</p>
          </div>
          <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 5px 0; color: #374151;">Peak Hour</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #d97706;">${peakHoursData.length > 0 ? formatHour(peakHoursData[0].hour) : 'N/A'}</p>
          </div>
        </div>

        <h2 style="color: #374151; margin-bottom: 15px;">Weekly Performance</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Week</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Transactions</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Revenue</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Avg Transaction</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Unique Users</th>
            </tr>
          </thead>
          <tbody>
            ${weeklyData.map(week => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">Week of ${formatWeek(week.week_start)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${week.total_transactions.toLocaleString()}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${formatCurrency(week.total_revenue)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${formatCurrency(week.avg_transaction_value)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${week.unique_users}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="color: #374151; margin-bottom: 15px;">Top Peak Hours</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Hour</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Transactions</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Revenue</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Unique Users</th>
            </tr>
          </thead>
          <tbody>
            ${getTopPeakHours().map(peak => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${formatHour(peak.hour)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${peak.transaction_count.toLocaleString()}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${formatCurrency(peak.total_revenue)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${peak.unique_users}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="color: #374151; margin-bottom: 15px;">Daily Patterns</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Day</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Transactions</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Revenue</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Avg Transaction</th>
            </tr>
          </thead>
          <tbody>
            ${dailyPatterns.map(day => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${day.day_name}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${day.transaction_count.toLocaleString()}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${formatCurrency(day.total_revenue)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${formatCurrency(day.avg_transaction_value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Open new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Weekly Performance Report</title>
            <style>
              @media print {
                body { margin: 0; }
                table { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePrint = () => {
    // Add print-specific styles
    const printStyles = `
      <style>
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      </style>
    `;
    
    // Add print class to the main content
    const mainContent = document.querySelector('.p-6.space-y-6');
    if (mainContent) {
      mainContent.classList.add('print-content');
      
      // Temporarily hide non-printable elements
      const noPrintElements = mainContent.querySelectorAll('button, .flex.justify-end');
      noPrintElements.forEach(el => el.classList.add('no-print'));
      
      // Print
      window.print();
      
      // Clean up
      mainContent.classList.remove('print-content');
      noPrintElements.forEach(el => el.classList.remove('no-print'));
    }
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
              <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-green-600" />
              Weekly Performance & Peak Hours
            </h1>
            <p className="text-sm text-gray-600">Performance trends and peak activity analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Period Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Weekly Performance Period:</label>
            <select
              value={selectedWeeks}
              onChange={(e) => setSelectedWeeks(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={2}>Last 2 weeks</option>
              <option value={4}>Last 4 weeks</option>
              <option value={8}>Last 8 weeks</option>
            </select>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Peak Hours Period:</label>
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
      </div>

      {/* Weekly Performance Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(getTotalWeeklyRevenue())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getTotalWeeklyTransactions().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Weekly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(getAverageWeeklyRevenue())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Peak Hour</p>
              <p className="text-2xl font-semibold text-gray-900">
                {peakHoursData.length > 0 ? formatHour(peakHoursData[0].hour) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Users
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weeklyData.map((week, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Week of {formatWeek(week.week_start)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {week.total_transactions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(week.total_revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(week.avg_transaction_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {week.unique_users}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {weeklyData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No weekly performance data available for the selected period.
          </div>
        )}
      </div>

      {/* Peak Hours Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Peak Hours */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Peak Hours</h3>
          <div className="space-y-3">
            {getTopPeakHours().map((peak, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{formatHour(peak.hour)}</p>
                    <p className="text-sm text-gray-500">{peak.transaction_count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(peak.total_revenue)}</p>
                  <p className="text-sm text-gray-500">{peak.unique_users} users</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Patterns */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Patterns</h3>
          <div className="space-y-3">
            {dailyPatterns.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{day.day_name}</p>
                  <p className="text-sm text-gray-500">{day.transaction_count} transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(day.total_revenue)}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(day.avg_transaction_value)} avg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={exportToPDF}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export PDF</span>
        </button>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export CSV</span>
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Report</span>
        </button>
      </div>
    </div>
  );
};

export default WeeklyPerformance;
