import React, { useState, useEffect } from 'react';
import { XMarkIcon, CreditCardIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { canteenOrdersAPI } from '../../services/api';
import { rfidScanner } from '../../utils/rfidScanner';

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
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const RFIDScanModal: React.FC<RFIDScanModalProps> = ({ 
  isOpen, 
  onClose, 
  orderData, 
  onPaymentComplete 
}) => {
  const [rfidInput, setRfidInput] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [step, setStep] = useState<'scan' | 'confirm' | 'processing' | 'success' | 'error'>('scan');
  const [isScanning, setIsScanning] = useState(false);

  const handleScanRfid = () => {
    setIsScanning(true);
    setRfidInput('');
    setError('');
    
    console.log('🔍 Starting RFID scan...');
    const startedAt = Date.now();
    
    // Use the same polling approach as registration with timestamp check
    const pollForRFID = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/rfid/latest');
        const data = await response.json();
        
        if (data.success && data.data && data.data.rfid_card_id) {
          // Only accept RFID scans that happened AFTER we started scanning
          if (data.data.scanned_at) {
            const scanTime = new Date(data.data.scanned_at).getTime();
            if (scanTime >= startedAt) {
              const scannedRfid = data.data.rfid_card_id;
              console.log('📱 RFID Scanned from Arduino:', scannedRfid);
              setRfidInput(scannedRfid);
              setIsScanning(false);
              
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
      }
    }, 500);
    
    // Stop scanning after 10 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('⏰ RFID scan timeout');
      setIsScanning(false);
    }, 10000);
  };

  useEffect(() => {
    if (isOpen) {
      setRfidInput('');
      setCustomer(null);
      setError('');
      setStep('scan');
      setTransactionId(null);
      setIsScanning(false);
      
      // Automatically start scanning when modal opens
      setTimeout(() => {
        handleScanRfid();
      }, 500);
    } else {
      // Clean up RFID scanner when modal closes
      if (rfidScanner.isCurrentlyScanning()) {
        rfidScanner.stopScanning();
      }
      setIsScanning(false);
    }
    
    // Cleanup function
    return () => {
      if (rfidScanner.isCurrentlyScanning()) {
        rfidScanner.stopScanning();
      }
    };
  }, [isOpen]);

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

  const completePayment = async () => {
    if (!customer || !orderData || !transactionId) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const response = await canteenOrdersAPI.completeOrder(transactionId, {
        customer_rfid: customer.rfid_card_id
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
        setError('Payment processing failed. Please try again.');
      }
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!customer || !orderData) return;
    
    // Prevent multiple clicks
    if (isProcessing) return;

    // Check if customer has sufficient balance
    if (customer.balance < orderData.total_amount) {
      setError(`Insufficient balance. Required: ${currency(orderData.total_amount)}, Available: ${currency(customer.balance)}`);
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // First create the order
      const newTransactionId = await createOrder();
      console.log('Order created with transaction ID:', newTransactionId);
      
      // Set the transaction ID and wait for state update
      setTransactionId(newTransactionId);
      
      // Now complete the payment with the transaction ID
      const response = await canteenOrdersAPI.completeOrder(newTransactionId, {
        customer_rfid: customer.rfid_card_id
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
            {step === 'processing' && 'Processing Payment'}
            {step === 'success' && 'Payment Successful'}
            {step === 'error' && 'Payment Failed'}
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-6 h-6" />
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
                  <button
                    type="button"
                    onClick={handleScanRfid}
                    disabled={isVerifying || isScanning}
                    className={`flex-1 py-3 rounded-md font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                      isScanning 
                        ? 'bg-green-600 text-white animate-pulse' 
                        : 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300'
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    {isScanning ? 'Scanning...' : 'Scan RFID'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isVerifying || !rfidInput.trim() || isScanning}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
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
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={customer.balance < orderData.total_amount || isProcessing}
                  className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-red-500 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? 'Processing...' : customer.balance < orderData.total_amount ? 'Insufficient Balance' : 'Confirm Payment'}
                </button>
              </div>
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
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
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
