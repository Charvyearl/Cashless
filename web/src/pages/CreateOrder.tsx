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
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
          <div className="text-center">

            <button
              onClick={() => setIsOrderModalOpen(true)}
              disabled={isOrderModalOpen || isRFIDModalOpen}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isOrderModalOpen ? 'Order In Progress...' : 'Start New Order'}
            </button>
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
