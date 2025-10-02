import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderModal from '../components/Order/OrderModal';
import RFIDScanModal from '../components/Order/RFIDScanModal';

interface OrderData {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total_amount: number;
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(true);
  const [isRFIDModalOpen, setIsRFIDModalOpen] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState<OrderData | null>(null);

  const handleOrderComplete = (orderData: OrderData) => {
    setCurrentOrderData(orderData);
    setIsOrderModalOpen(false);
    setIsRFIDModalOpen(true);
  };

  const handlePaymentComplete = (result: any) => {
    console.log('Payment completed:', result);
    setIsRFIDModalOpen(false);
    setCurrentOrderData(null);
    
    // Show success message and redirect back to canteen dashboard
    alert('Order completed successfully!');
    navigate('/canteen');
  };

  const handleCloseRFIDModal = () => {
    setIsRFIDModalOpen(false);
    setCurrentOrderData(null);
    navigate('/canteen');
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    navigate('/canteen');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Select products and process customer payment
                </p>
              </div>
              <button
                onClick={() => navigate('/canteen')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Order Process
            </h2>
            <p className="text-gray-600 mb-6">
              The order creation process will open automatically.
            </p>
            
            {/* Process Steps */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  isOrderModalOpen ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm text-gray-600">Select Products</span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  isRFIDModalOpen ? 'bg-blue-600' : !isOrderModalOpen ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm text-gray-600">RFID Payment</span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  !isOrderModalOpen && !isRFIDModalOpen ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm text-gray-600">Complete</span>
              </div>
            </div>

            <button
              onClick={() => setIsOrderModalOpen(true)}
              disabled={isOrderModalOpen || isRFIDModalOpen}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isOrderModalOpen ? 'Order In Progress...' : 'Start New Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        onOrderComplete={handleOrderComplete}
      />

      {/* RFID Scan Modal */}
      <RFIDScanModal
        isOpen={isRFIDModalOpen}
        onClose={handleCloseRFIDModal}
        orderData={currentOrderData}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default CreateOrder;
