import React, { useState } from 'react';
import { XMarkIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { adminAPI, rfidAPI } from '../../services/api';
import { CreateStudentRequest, CreatePersonnelRequest } from '../../types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AccountType = 'student' | 'personnel';

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  console.log('CreateAccountModal rendered with isOpen:', isOpen);
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rfid_card_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    balance: 0
  });
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [useAutoFill, setUseAutoFill] = useState(true); // no-session auto mode
  const [pollTimer, setPollTimer] = useState<number | undefined>(undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (!formData.rfid_card_id) {
        setError('RFID card is required. Click Scan RFID to read a card.');
        setLoading(false);
        return;
      }

      // Prepare data for API
      const { confirmPassword, ...apiData } = formData;
      const submitData = {
        ...apiData,
        balance: parseFloat(formData.balance.toString()) || 0
      };

      // Call appropriate API based on account type
      if (accountType === 'student') {
        await adminAPI.createStudent(submitData as CreateStudentRequest);
      } else {
        await adminAPI.createPersonnel(submitData as CreatePersonnelRequest);
      }

      // Reset form and close modal
      setFormData({
        rfid_card_id: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        balance: 0
      });
      setScanning(false);
      setScanComplete(false);
      setSessionId(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const startAutoFill = () => {
    setScanning(true);
    setScanComplete(false);
    const startedAt = Date.now();
    
    // Clear any previous RFID data first
    setFormData(prev => ({ ...prev, rfid_card_id: '' }));
    
    const poll = async () => {
      try {
        const res = await rfidAPI.getLatest();
        const latest = res?.data?.data;
        
        // Only accept RFID scans that happened AFTER we started scanning
        if (latest?.rfid_card_id && latest?.scanned_at) {
          const scanTime = new Date(latest.scanned_at).getTime();
          if (scanTime >= startedAt) {
            setFormData(prev => ({ ...prev, rfid_card_id: latest.rfid_card_id }));
            setScanComplete(true);
            setScanning(false);
            return;
          }
        }
      } catch (_) {}
      
      if (Date.now() - startedAt < 60_000) {
        const id = window.setTimeout(poll, 800);
        setPollTimer(id);
      } else {
        setScanning(false);
        setError('No recent scans detected. Try again.');
      }
    };
    poll();
  };

  const startScan = async () => {
    setError(null);
    setScanning(true);
    setScanComplete(false);
    setSessionId(null);
    if (useAutoFill) {
      startAutoFill();
      return;
    }
    try {
      const { data } = await rfidAPI.createSession();
      const id = data?.data?.session_id as string;
      setSessionId(id);

      const startedAt = Date.now();
      const poll = async () => {
        try {
          const res = await rfidAPI.getSession(id);
          const uid = res?.data?.data?.rfid_card_id as string | null;
          if (uid) {
            setFormData(prev => ({ ...prev, rfid_card_id: uid }));
            setScanComplete(true);
            setScanning(false);
            return;
          }
        } catch (_) {}
        if (Date.now() - startedAt < 60_000) {
          setTimeout(poll, 1000);
        } else {
          setScanning(false);
          setError('Scan timed out. Try again.');
        }
      };
      setTimeout(poll, 750);
    } catch (e: any) {
      setScanning(false);
      setError(e?.response?.data?.message || 'Failed to start scan');
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      rfid_card_id: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      balance: 0
    });
    setScanning(false);
    setScanComplete(false);
    setSessionId(null);
    if (pollTimer) window.clearTimeout(pollTimer);
    onClose();
  };

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        rfid_card_id: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        balance: 0
      });
      setScanning(false);
      setScanComplete(false);
      setError(null);
      setSessionId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative z-[10000]"
        style={{ position: 'relative', zIndex: 10000, border: '1px solid #000000' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Account
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Account Type Selection */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('student')}
              className={`flex items-center justify-center p-3 rounded-lg transition-colors mr-2 ${
                accountType === 'student'
                  ? 'text-white'
                  : 'text-gray-700 hover:opacity-80'
              }`}
              style={{
                backgroundColor: accountType === 'student' ? '#5FA9FF' : '#F3F4F6',
                border: 'none'
              }}
            >
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setAccountType('personnel')}
              className={`flex items-center justify-center p-3 rounded-lg transition-colors ml-2 ${
                accountType === 'personnel'
                  ? 'text-white'
                  : 'text-gray-700 hover:opacity-80'
              }`}
              style={{
                backgroundColor: accountType === 'personnel' ? '#5FA9FF' : '#F3F4F6',
                border: 'none'
              }}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Personnel
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFID Card ID *
            </label>
            {!scanComplete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startScan}
                  disabled={scanning}
                  className="px-6 py-2 text-sm font-medium text-white rounded-md hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: '#5FA9FF',
                    border: 'none'
                  }}
                >
                  {scanning ? 'Waiting for tap…' : 'Scan RFID'}
                </button>
                <input
                  type="text"
                  name="rfid_card_id"
                  value={formData.rfid_card_id}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                  placeholder="(or enter manually)"
                />
              </div>
            ) : (
              <input
                type="text"
                name="rfid_card_id"
                value={formData.rfid_card_id}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 mt-2"
              />
            )}
            <div className="mt-2 text-xs text-gray-500">
              Auto mode: waits for the most recent scan from any connected reader. For pairing a specific reader, switch to session mode.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 my-2"
              placeholder="email@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Balance (PHP)
            </label>
            <input
              type="number"
              name="balance"
              value={formData.balance}
              onChange={handleInputChange}
              min="0"
              max="10000"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 my-2"
              placeholder="0.00"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3"
              style={{
                backgroundColor: '#5FA9FF',
                border: 'none'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ml-2"
              style={{
                backgroundColor: '#5FA9FF',
                border: 'none'
              }}
            >
              {loading ? 'Creating...' : `Create ${accountType === 'student' ? 'Student' : 'Personnel'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountModal;
