import React, { useState, useEffect } from 'react';
import { XMarkIcon, CreditCardIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { canteenOrdersAPI, rfidAPI } from '../../services/api';

interface Customer {
  id: number;
  rfid_card_id: string;
  first_name: string;
  last_name: string;
  balance: number;
  type: 'user' | 'personnel';
}

interface OrderData {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total_amount: number;
}

interface RFIDScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: OrderData | null;
  onPaymentComplete: (result: any) => void;
  existingTransactionId?: number;
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const RFIDScanModal: React.FC<RFIDScanModalProps> = ({ 
  isOpen, 
  onClose, 
  orderData, 
  onPaymentComplete,
  existingTransactionId
}) => {
  const [rfidInput, setRfidInput] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [step, setStep] = useState<'scan' | 'confirm' | 'pin' | 'processing' | 'success' | 'error'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState<NodeJS.Timeout | null>(null);
  const [pin, setPin] = useState('');

  const stopScanning = () => {
    if (scanInterval) {
      clearInterval(scanInterval);
      setScanInterval(null);
    }
    setIsScanning(false);
    console.log('🛑 RFID scan stopped by user');
  };

  const handleScanRfid = () => {
    setIsScanning(true);
    setRfidInput('');
    setError('');
    
    console.log('🔍 Starting RFID scan...');
    const startedAt = Date.now();
    
    // Use the same polling approach as registration with timestamp check
    const pollForRFID = async () => {
      try {
        const res = await rfidAPI.getLatest();
        const data = res.data;
        
        if (data.success && data.data && data.data.rfid_card_id) {
          // Only accept RFID scans that happened AFTER we started scanning
          if (data.data.scanned_at) {
            const scanTime = new Date(data.data.scanned_at).getTime();
            if (scanTime >= startedAt) {
              const scannedRfid = data.data.rfid_card_id;
              console.log('📱 RFID Scanned from Arduino:', scannedRfid);
              setRfidInput(scannedRfid);
              stopScanning();
              
              // Auto-verify the scanned RFID
              setTimeout(() => {
                verifyRFID(scannedRfid);
              }, 500);
              return true; // Stop polling
            }
          }
        }
      } catch (error) {
        console.error('Error polling RFID:', error);
      }
      return false; // Continue polling
    };
    
    // Poll every 500ms (same as registration)
    const pollInterval = setInterval(async () => {
      const found = await pollForRFID();
      if (found) {
        clearInterval(pollInterval);
        setScanInterval(null);
      }
    }, 500);
    
    setScanInterval(pollInterval);
  };

  useEffect(() => {
    if (isOpen) {
      setRfidInput('');
      setCustomer(null);
      setError('');
      setPin('');
      setStep('scan');
      setTransactionId(existingTransactionId ?? null);
      setIsScanning(false);
      
      // Automatically start scanning when modal opens
      setTimeout(() => {
        handleScanRfid();
      }, 500);
    } else {
      // Clean up scanning when modal closes
      stopScanning();
    }
  }, [isOpen, existingTransactionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const verifyRFID = async (rfid: string) => {
    if (!rfid.trim()) {
      setError('Please enter RFID card ID');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await canteenOrdersAPI.verifyRFID(rfid);
      console.log('Response data:', response.data);

      if (response.data.success) {
        setCustomer(response.data.data.customer);
        setStep('confirm');
      } else {
        setError(response.data.message || 'Customer not found');
      }
    } catch (err: any) {
      console.error('RFID verification error:', err);
      if (err.response) {
        console.log('Error response:', err.response.data);
        setError(err.response.data.message || 'Customer not found');
      } else {
        setError('Failed to verify RFID. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyRFID(rfidInput);
  };

  const createOrder = async () => {
    if (!orderData) return;

    try {
      const response = await canteenOrdersAPI.createOrder({
        items: orderData.items,
        customer_rfid: customer?.rfid_card_id
      });

      if (response.data.success) {
        return response.data.data.transaction.transaction_id;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create order');
      }
      throw error;
    }
  };


  const handleConfirmPayment = () => {
    if (!customer || !orderData) return;
    
    // Prevent multiple clicks
    if (isProcessing) return;

    // Check if customer has sufficient balance
    if (customer.balance < orderData.total_amount) {
      setError(`Insufficient balance. Required: ${currency(orderData.total_amount)}, Available: ${currency(customer.balance)}`);
      return;
    }

    // Move to PIN confirmation step
    setStep('pin');
    setError('');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !orderData) return;
    
    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setError('');

    try {
      let txId = existingTransactionId;
      if (!txId) {
        // Create a new order if no existing transaction is provided
        const newTransactionId = await createOrder();
        txId = newTransactionId;
        setTransactionId(newTransactionId);
      }
      
      // Complete the payment with the transaction ID and PIN
      const response = await canteenOrdersAPI.completeOrder(Number(txId), {
        customer_rfid: customer.rfid_card_id,
        pin: pin
      });

      if (response.data.success) {
        setStep('success');
        setTimeout(() => {
          onPaymentComplete(response.data.data);
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Payment failed');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Payment failed');
      } else {
        setError(err.message || 'Payment processing failed. Please try again.');
      }
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep('scan');
    setCustomer(null);
    setError('');
    setRfidInput('');
    setPin('');
    setTransactionId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'scan' && (isScanning ? 'Scanning RFID Card...' : 'Scan RFID Card')}
            {step === 'confirm' && 'Confirm Payment'}
            {step === 'pin' && 'Enter PIN'}
            {step === 'processing' && 'Processing Payment'}
            {step === 'success' && 'Payment Successful'}
            {step === 'error' && 'Payment Failed'}
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF6B6B', border: 'none' }}
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6">
          {/* RFID Scan Step */}
          {step === 'scan' && (
            <div className="space-y-4">
              <div className="text-center">
                <CreditCardIcon className={`w-16 h-16 mx-auto mb-4 ${
                  isScanning ? 'text-green-500 animate-pulse' : 'text-blue-500'
                }`} />
                <p className={`mb-4 ${isScanning ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                  {isScanning 
                    ? '🔍 Scanning... Please tap your RFID card on the reader' 
                    : 'Please scan the customer\'s RFID card or enter the card ID manually.'
                  }
                </p>
                {isScanning && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-green-700 text-sm">
                      📡 RFID Reader is active and waiting for card...
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleRfidSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFID Card ID
                  </label>
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder={isScanning ? "Ready to scan RFID card..." : "Scan or enter RFID card ID"}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 text-center text-lg ${
                      isScanning 
                        ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={isVerifying}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  {!isScanning ? (
                    <button
                      type="button"
                      onClick={handleScanRfid}
                      disabled={isVerifying}
                      className="flex-1 py-4 px-6 rounded-md font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed border-0 text-white disabled:bg-gray-300"
                      style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
                    >
                      <CreditCardIcon className="w-5 h-5" />
                      Scan RFID
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopScanning}
                      className="flex-1 py-4 px-6 rounded-md font-medium flex items-center justify-center gap-2 border-0 text-white animate-pulse"
                      style={{ backgroundColor: '#FF6B6B', border: 'none', margin: '0 8px' }}
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Stop Scanning
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isVerifying || !rfidInput.trim() || isScanning}
                    className="flex-1 text-white py-4 px-6 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed font-medium border-0"
                    style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Customer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Confirm Payment Step */}
          {step === 'confirm' && customer && orderData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Customer Details</h3>
                <p className="text-sm text-gray-600">
                  {customer.first_name} {customer.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  RFID: {customer.rfid_card_id}
                </p>
                <p className="text-sm text-gray-600">
                  Type: {customer.type === 'user' ? 'Student' : 'Personnel'}
                </p>
                <p className="text-sm font-medium text-green-600 mt-2">
                  Current Balance: {currency(customer.balance)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Order Total</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {currency(orderData.total_amount)}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">After Payment</h3>
                <p className="text-lg font-medium text-green-600">
                  Remaining Balance: {currency(customer.balance - orderData.total_amount)}
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 text-white py-4 px-6 rounded-md font-medium border-0"
                  style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={customer.balance < orderData.total_amount || isProcessing}
                  className="flex-1 text-white py-4 px-6 rounded-md disabled:bg-red-500 disabled:cursor-not-allowed font-medium border-0"
                  style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
                >
                  {isProcessing ? 'Processing...' : customer.balance < orderData.total_amount ? 'Insufficient Balance' : 'Continue to PIN'}
                </button>
              </div>
            </div>
          )}

          {/* PIN Confirmation Step */}
          {step === 'pin' && customer && orderData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
                <p className="text-sm text-gray-600">
                  Customer: {customer.first_name} {customer.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  Amount: <span className="font-medium text-blue-600">{currency(orderData.total_amount)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Remaining Balance: <span className="font-medium text-green-600">{currency(customer.balance - orderData.total_amount)}</span>
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 4-Digit PIN to Confirm Payment
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPin(value);
                    }}
                    placeholder="0000"
                    maxLength={4}
                    pattern="\d{4}"
                    className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                    style={{
                      borderColor: '#D1D5DB'
                    }}
                    autoFocus
                    required
                    inputMode="numeric"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Enter your 4-digit PIN to authorize this payment
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('confirm');
                      setPin('');
                      setError('');
                    }}
                    className="flex-1 text-white py-4 px-6 rounded-md font-medium border-0"
                    style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={pin.length !== 4 || isProcessing}
                    className="flex-1 text-white py-4 px-6 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed font-medium border-0"
                    style={{ backgroundColor: '#5FA9FF', border: 'none', margin: '0 8px' }}
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing payment...</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Order has been completed successfully.</p>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="text-white px-6 py-2 rounded-md font-medium border-0"
                style={{ backgroundColor: '#5FA9FF', border: 'none' }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFIDScanModal;
