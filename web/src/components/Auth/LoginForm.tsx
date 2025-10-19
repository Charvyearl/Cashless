import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCardIcon, UserGroupIcon, CogIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [rfidCardId, setRfidCardId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'canteen' | 'admin' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'canteen' | 'admin') => {
    setSelectedRole(role);
    setError('');
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setRfidCardId('');
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');

    try {
      if (selectedRole === 'canteen') {
        // Canteen staff login with username/password
        if (username === 'staff' && password === 'staff123') {
          await login('STAFF001'); // Use a default RFID for canteen staff
          navigate('/');
        } else {
          setError('Invalid username or password. Use: staff / staff123');
        }
      } else {
        // Admin login with username/password
        if (username === 'admin' && password === 'admin123') {
          await login('ADMIN001'); // Use a default RFID for admin
          navigate('/');
        } else {
          setError('Invalid username or password. Use: admin / admin123');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6F7FB' }}>
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8 bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-xl" style={{ maxWidth: '800px' }}>
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <CreditCardIcon className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Cashless Canteen System
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {!selectedRole ? 'Select your role to continue' : 'Sign in with your RFID card'}
            </p>
          </div>
        
        {!selectedRole ? (
          // Role Selection
          <div className="space-y-4 bg-white rounded-lg" style={{ padding: '32px' }}>
            <div className="grid grid-cols-2 gap-6">
              {/* Canteen Staff Option */}
              <button
                onClick={() => handleRoleSelect('canteen')}
                className="relative border border-gray-300 rounded-lg hover:border-orange-500 transition-colors text-center overflow-hidden"
                style={{
                  padding: '40px',
                  minHeight: '350px',
                  backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(/canteen.png)',
                  backgroundSize: '120%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                
                <div className="flex flex-col items-center relative z-10">
                  <div className="h-16 w-16 rounded-full bg-opacity-20 flex items-center justify-center mb-4">
                    <UserGroupIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Canteen Staff</h3>
                  <p className="text-sm text-white">Process orders, manage menu items, and update availability</p>
                </div>
              </button>

              {/* Admin Option */}
              <button
                onClick={() => handleRoleSelect('admin')}
                className="relative border border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center overflow-hidden"
                style={{
                  padding: '40px',
                  minHeight: '350px',
                  backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(/finance.png)',
                  backgroundSize: '120%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div className="flex flex-col items-center relative z-10">
                  <div className="h-16 w-16 rounded-full bg-opacity-20 flex items-center justify-center mb-4">
                    <CogIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Admin</h3>
                  <p className="text-sm text-white">Manage user accounts, monitor transactions, and generate reports</p>
                </div>
              </button>
            </div>
          </div>
         ) : selectedRole === 'canteen' ? (
           // Canteen Staff Login - Username/Password
           <div className="bg-white rounded-lg p-6">
             <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Canteen Staff Login</h3>
                 <button
                   type="button"
                   onClick={handleBackToRoleSelection}
                   className="text-sm text-blue-600 hover:text-blue-500"
                 >
                   ← Back to role selection
                 </button>
               </div>

               <div>
                 <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                   Username
                 </label>
                 <input
                   id="username"
                   name="username"
                   type="text"
                   required
                   className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your username"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
               </div>

               <div>
                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                   Password
                 </label>
                 <input
                   id="password"
                   name="password"
                   type="password"
                   required
                   className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </div>

               {error && (
                 <div className="rounded-md bg-red-50 p-4">
                   <div className="text-sm text-red-700">{error}</div>
                 </div>
               )}

               <div>
                 <button
                   type="submit"
                   disabled={loading}
                   className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {loading ? 'Signing in...' : 'Sign in'}
                 </button>
               </div>

               <div className="text-center">
                 <p className="text-sm text-gray-600">
                   Demo Credentials: <br />
                   <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                     Username: staff, Password: staff123
                   </span>
                 </p>
               </div>
             </form>
           </div>
         ) : (
           // Admin Login - Username/Password
           <div className="bg-white rounded-lg p-6">
             <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Admin Login</h3>
                 <button
                   type="button"
                   onClick={handleBackToRoleSelection}
                   className="text-sm text-blue-600 hover:text-blue-500"
                 >
                   ← Back to role selection
                 </button>
               </div>

               <div>
                 <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">
                   Username
                 </label>
                 <input
                   id="admin-username"
                   name="username"
                   type="text"
                   required
                   className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your username"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
               </div>

               <div>
                 <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                   Password
                 </label>
                 <input
                   id="admin-password"
                   name="password"
                   type="password"
                   required
                   className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </div>

               {error && (
                 <div className="rounded-md bg-red-50 p-4">
                   <div className="text-sm text-red-700">{error}</div>
                 </div>
               )}

               <div>
                 <button
                   type="submit"
                   disabled={loading}
                   className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {loading ? 'Signing in...' : 'Sign in'}
                 </button>
               </div>

               <div className="text-center">
                 <p className="text-sm text-gray-600">
                   Demo Credentials: <br />
                   <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                     Username: admin, Password: admin123
                   </span>
                 </p>
               </div>
             </form>
           </div>
         )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
