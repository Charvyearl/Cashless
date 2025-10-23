import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCardIcon, UserGroupIcon, CogIcon, UserIcon, LockClosedIcon, ArrowLeftIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
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
    <div
      className="min-h-screen"
      style={
        selectedRole === 'canteen' || selectedRole === 'admin'
          ? {
              backgroundImage:
                "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(/smcbackground.jpg)",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed'
            }
          : { backgroundColor: '#F6F7FB' }
      }
    >
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8 bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-xl" style={{ maxWidth: '800px' }}>
          <div>
            <div style={{
              margin: '0 auto',
              height: '80px',
              width: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(95, 169, 255, 0.1)',
              padding: '0'
            }}>
              <CreditCardIcon style={{ 
                height: '40px', 
                width: '40px', 
                color: '#5FA9FF' 
              }} />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ 
              color: selectedRole === 'canteen' || selectedRole === 'admin' ? 'white' : 'black' 
            }}>
              Cashless Canteen System
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {!selectedRole ? 'Select your role to continue' : ''}
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
           <div style={{ 
             backgroundColor: 'white', 
             borderRadius: '12px', 
             padding: '20px',
             boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
             border: '1px solid #E5E7EB',
             maxWidth: '500px',
             margin: '0 auto'
           }}>
             <form onSubmit={handleSubmit} style={{ 
               marginTop: '20px', 
               display: 'flex', 
               flexDirection: 'column', 
               gap: '16px' 
             }}>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'space-between', 
                 marginBottom: '12px' 
               }}>
                 <h3 style={{ 
                   fontSize: '18px', 
                   fontWeight: '600', 
                   color: '#111827',
                   margin: 0
                 }}>
                   Canteen Staff Login
                 </h3>
                 <button
                   type="button"
                   onClick={handleBackToRoleSelection}
                   style={{
                     fontSize: '14px',
                     color: '#2563EB',
                     backgroundColor: 'transparent',
                     border: 'none',
                     cursor: 'pointer',
                     padding: '8px',
                     borderRadius: '6px',
                     transition: 'all 0.2s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.color = '#1D4ED8';
                     e.currentTarget.style.backgroundColor = '#EFF6FF';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.color = '#2563EB';
                     e.currentTarget.style.backgroundColor = 'transparent';
                   }}
                 >
                   <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
                   Back to role selection
                 </button>
               </div>

               <div>
                 <label htmlFor="username" style={{ 
                   display: 'block', 
                   fontSize: '14px', 
                   fontWeight: '500', 
                   color: '#374151', 
                   marginBottom: '8px' 
                 }}>
                   Username
                 </label>
                 <div style={{ position: 'relative' }}>
                   <div style={{
                     position: 'absolute',
                     left: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     zIndex: 1,
                     color: '#6B7280'
                   }}>
                     <UserIcon style={{ width: '20px', height: '20px' }} />
                   </div>
                 <input
                   id="username"
                   name="username"
                   type="text"
                   required
                     style={{
                       appearance: 'none',
                       borderRadius: '8px',
                       position: 'relative',
                       display: 'block',
                       width: '100%',
                       padding: '12px 16px 12px 44px',
                       border: '2px solid #D1D5DB',
                       backgroundColor: 'white',
                       color: '#111827',
                       fontSize: '14px',
                       outline: 'none',
                       transition: 'all 0.2s ease',
                       boxSizing: 'border-box'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#5FA9FF';
                       e.target.style.boxShadow = '0 0 0 3px rgba(95, 169, 255, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#D1D5DB';
                       e.target.style.boxShadow = 'none';
                     }}
                   placeholder="Enter your username"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
                 </div>
               </div>

               <div>
                 <label htmlFor="password" style={{ 
                   display: 'block', 
                   fontSize: '14px', 
                   fontWeight: '500', 
                   color: '#374151', 
                   marginBottom: '8px' 
                 }}>
                   Password
                 </label>
                 <div style={{ position: 'relative' }}>
                   <div style={{
                     position: 'absolute',
                     left: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     zIndex: 1,
                     color: '#6B7280'
                   }}>
                     <LockClosedIcon style={{ width: '20px', height: '20px' }} />
                   </div>
                 <input
                   id="password"
                   name="password"
                   type="password"
                   required
                     style={{
                       appearance: 'none',
                       borderRadius: '8px',
                       position: 'relative',
                       display: 'block',
                       width: '100%',
                       padding: '12px 16px 12px 44px',
                       border: '2px solid #D1D5DB',
                       backgroundColor: 'white',
                       color: '#111827',
                       fontSize: '14px',
                       outline: 'none',
                       transition: 'all 0.2s ease',
                       boxSizing: 'border-box'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#5FA9FF';
                       e.target.style.boxShadow = '0 0 0 3px rgba(95, 169, 255, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#D1D5DB';
                       e.target.style.boxShadow = 'none';
                     }}
                   placeholder="Enter your password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
                 </div>
               </div>

               {error && (
                 <div style={{
                   borderRadius: '8px',
                   backgroundColor: '#FEF2F2',
                   padding: '16px',
                   border: '1px solid #FECACA'
                 }}>
                   <div style={{ 
                     fontSize: '14px', 
                     color: '#DC2626' 
                   }}>
                     {error}
                   </div>
                 </div>
               )}

               <div>
                 <button
                   type="submit"
                   disabled={loading}
                   style={{
                     position: 'relative',
                     width: '100%',
                     display: 'flex',
                     justifyContent: 'center',
                     alignItems: 'center',
                     gap: '8px',
                     padding: '12px 16px',
                     border: 'none',
                     fontSize: '14px',
                     fontWeight: '500',
                     borderRadius: '8px',
                     color: 'white',
                     backgroundColor: '#5FA9FF',
                     cursor: loading ? 'not-allowed' : 'pointer',
                     opacity: loading ? 0.6 : 1,
                     transition: 'all 0.2s ease',
                     outline: 'none'
                   }}
                   onMouseEnter={(e) => {
                     if (!loading) {
                       e.currentTarget.style.backgroundColor = '#4A8FE7';
                       e.currentTarget.style.transform = 'translateY(-1px)';
                       e.currentTarget.style.boxShadow = '0 4px 12px rgba(95, 169, 255, 0.3)';
                     }
                   }}
                   onMouseLeave={(e) => {
                     if (!loading) {
                       e.currentTarget.style.backgroundColor = '#5FA9FF';
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = 'none';
                     }
                   }}
                   onFocus={(e) => {
                     e.currentTarget.style.boxShadow = '0 0 0 3px rgba(95, 169, 255, 0.2)';
                   }}
                   onBlur={(e) => {
                     e.currentTarget.style.boxShadow = 'none';
                   }}
                 >
                   <ArrowRightOnRectangleIcon style={{ width: '18px', height: '18px' }} />
                   {loading ? 'Signing in...' : 'Sign in'}
                 </button>
               </div>

               <div style={{ textAlign: 'center' }}>
                 <p style={{ 
                   fontSize: '14px', 
                   color: '#6B7280',
                   margin: 0
                 }}>
                    Credentials: <br />
                   <span style={{
                     fontFamily: 'monospace',
                     fontSize: '12px',
                     backgroundColor: '#F3F4F6',
                     padding: '4px 8px',
                     borderRadius: '4px',
                     display: 'inline-block',
                     marginTop: '4px'
                   }}>
                     Username: staff, Password: staff123
                   </span>
                 </p>
               </div>
             </form>
           </div>
         ) : (
           // Admin Login - Username/Password
           <div style={{ 
             backgroundColor: 'white', 
             borderRadius: '12px', 
             padding: '20px',
             boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
             border: '1px solid #E5E7EB',
             maxWidth: '500px',
             margin: '0 auto'
           }}>
             <form onSubmit={handleSubmit} style={{ 
               marginTop: '20px', 
               display: 'flex', 
               flexDirection: 'column', 
               gap: '16px' 
             }}>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'space-between', 
                 marginBottom: '12px' 
               }}>
                 <h3 style={{ 
                   fontSize: '18px', 
                   fontWeight: '600', 
                   color: '#111827',
                   margin: 0
                 }}>
                   Admin Login
                 </h3>
                 <button
                   type="button"
                   onClick={handleBackToRoleSelection}
                   style={{
                     fontSize: '14px',
                     color: '#2563EB',
                     backgroundColor: 'transparent',
                     border: 'none',
                     cursor: 'pointer',
                     padding: '8px',
                     borderRadius: '6px',
                     transition: 'all 0.2s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.color = '#1D4ED8';
                     e.currentTarget.style.backgroundColor = '#EFF6FF';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.color = '#2563EB';
                     e.currentTarget.style.backgroundColor = 'transparent';
                   }}
                 >
                   <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
                   Back to role selection
                 </button>
               </div>

               <div>
                 <label htmlFor="admin-username" style={{ 
                   display: 'block', 
                   fontSize: '14px', 
                   fontWeight: '500', 
                   color: '#374151', 
                   marginBottom: '8px' 
                 }}>
                   Username
                 </label>
                 <div style={{ position: 'relative' }}>
                   <div style={{
                     position: 'absolute',
                     left: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     zIndex: 1,
                     color: '#6B7280'
                   }}>
                     <UserIcon style={{ width: '20px', height: '20px' }} />
                   </div>
                 <input
                   id="admin-username"
                   name="username"
                   type="text"
                   required
                     style={{
                       appearance: 'none',
                       borderRadius: '8px',
                       position: 'relative',
                       display: 'block',
                       width: '100%',
                       padding: '12px 16px 12px 44px',
                       border: '2px solid #D1D5DB',
                       backgroundColor: 'white',
                       color: '#111827',
                       fontSize: '14px',
                       outline: 'none',
                       transition: 'all 0.2s ease',
                       boxSizing: 'border-box'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#5FA9FF';
                       e.target.style.boxShadow = '0 0 0 3px rgba(95, 169, 255, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#D1D5DB';
                       e.target.style.boxShadow = 'none';
                     }}
                   placeholder="Enter your username"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
                 </div>
               </div>

               <div>
                 <label htmlFor="admin-password" style={{ 
                   display: 'block', 
                   fontSize: '14px', 
                   fontWeight: '500', 
                   color: '#374151', 
                   marginBottom: '8px' 
                 }}>
                   Password
                 </label>
                 <div style={{ position: 'relative' }}>
                   <div style={{
                     position: 'absolute',
                     left: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     zIndex: 1,
                     color: '#6B7280'
                   }}>
                     <LockClosedIcon style={{ width: '20px', height: '20px' }} />
                   </div>
                 <input
                   id="admin-password"
                   name="password"
                   type="password"
                   required
                     style={{
                       appearance: 'none',
                       borderRadius: '8px',
                       position: 'relative',
                       display: 'block',
                       width: '100%',
                       padding: '12px 16px 12px 44px',
                       border: '2px solid #D1D5DB',
                       backgroundColor: 'white',
                       color: '#111827',
                       fontSize: '14px',
                       outline: 'none',
                       transition: 'all 0.2s ease',
                       boxSizing: 'border-box'
                     }}
                     onFocus={(e) => {
                       e.target.style.borderColor = '#5FA9FF';
                       e.target.style.boxShadow = '0 0 0 3px rgba(95, 169, 255, 0.1)';
                     }}
                     onBlur={(e) => {
                       e.target.style.borderColor = '#D1D5DB';
                       e.target.style.boxShadow = 'none';
                     }}
                   placeholder="Enter your password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
                 </div>
               </div>

               {error && (
                 <div style={{
                   borderRadius: '8px',
                   backgroundColor: '#FEF2F2',
                   padding: '16px',
                   border: '1px solid #FECACA'
                 }}>
                   <div style={{ 
                     fontSize: '14px', 
                     color: '#DC2626' 
                   }}>
                     {error}
                   </div>
                 </div>
               )}

               <div>
                 <button
                   type="submit"
                   disabled={loading}
                   style={{
                     position: 'relative',
                     width: '100%',
                     display: 'flex',
                     justifyContent: 'center',
                     alignItems: 'center',
                     gap: '8px',
                     padding: '12px 16px',
                     border: 'none',
                     fontSize: '14px',
                     fontWeight: '500',
                     borderRadius: '8px',
                     color: 'white',
                     backgroundColor: '#5FA9FF',
                     cursor: loading ? 'not-allowed' : 'pointer',
                     opacity: loading ? 0.6 : 1,
                     transition: 'all 0.2s ease',
                     outline: 'none'
                   }}
                   onMouseEnter={(e) => {
                     if (!loading) {
                       e.currentTarget.style.backgroundColor = '#4A8FE7';
                       e.currentTarget.style.transform = 'translateY(-1px)';
                       e.currentTarget.style.boxShadow = '0 4px 12px rgba(95, 169, 255, 0.3)';
                     }
                   }}
                   onMouseLeave={(e) => {
                     if (!loading) {
                       e.currentTarget.style.backgroundColor = '#5FA9FF';
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = 'none';
                     }
                   }}
                   onFocus={(e) => {
                     e.currentTarget.style.boxShadow = '0 0 0 3px rgba(95, 169, 255, 0.2)';
                   }}
                   onBlur={(e) => {
                     e.currentTarget.style.boxShadow = 'none';
                   }}
                 >
                   <ArrowRightOnRectangleIcon style={{ width: '18px', height: '18px' }} />
                   {loading ? 'Signing in...' : 'Sign in'}
                 </button>
               </div>

               <div style={{ textAlign: 'center' }}>
                 <p style={{ 
                   fontSize: '14px', 
                   color: '#6B7280',
                   margin: 0
                 }}>
                    Credentials: <br />
                   <span style={{
                     fontFamily: 'monospace',
                     fontSize: '12px',
                     backgroundColor: '#F3F4F6',
                     padding: '4px 8px',
                     borderRadius: '4px',
                     display: 'inline-block',
                     marginTop: '4px'
                   }}>
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
