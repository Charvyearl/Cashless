import React from 'react';

const Menu: React.FC = () => {
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-500">Manage canteen menu items and categories</p>
      </div>

      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
      </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Management</h3>
        <p className="text-gray-500">Menu management features will be available in the canteen section.</p>
          </div>
    </div>
  );
};

export default Menu;
