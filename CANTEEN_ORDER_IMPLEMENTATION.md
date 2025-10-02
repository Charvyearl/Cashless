# Canteen Order System Implementation

This document describes the new canteen order functionality that has been implemented in the Cashless Canteen System.

## Overview

The canteen order system allows canteen staff to:
1. Create orders by selecting products and quantities
2. Calculate total amounts and subtotals automatically
3. Process payments via RFID card scanning
4. Track transactions and update inventory

## Database Changes

### New Tables Added

1. **TRANSACTIONS** - Main transaction records for canteen orders
   - `transaction_id` (PK) - Auto-incrementing primary key
   - `user_id` (FK) - References users table (for students)
   - `personnel_id` (FK) - References personnel table (for staff)
   - `total_amount` - Total amount of the transaction
   - `transaction_date` - When the transaction occurred
   - `status` - pending, completed, cancelled
   - `payment_method` - rfid, cash

2. **TRANSACTION_ITEMS** - Individual items in each transaction
   - `transaction_item_id` (PK) - Auto-incrementing primary key
   - `transaction_id` (FK) - References TRANSACTIONS table
   - `product_id` (FK) - References PRODUCT table
   - `quantity` - Number of items ordered
   - `unit_price` - Price per unit at time of order
   - `subtotal` - quantity × unit_price

### Database Migration

To add the new tables to your database, run the SQL script:
```sql
-- Located at: backend/migrations/add_canteen_tables.sql
```

## Backend Implementation

### New Models

1. **CanteenTransaction** (`backend/models/CanteenTransaction.js`)
   - Handles CRUD operations for transactions
   - Includes methods for status updates and getting transaction details

2. **TransactionItem** (`backend/models/TransactionItem.js`)
   - Manages individual transaction items
   - Supports batch creation and automatic subtotal calculation

### New API Routes

Base URL: `/api/canteen-orders`

- `POST /create` - Create a new order
- `POST /:transactionId/complete` - Complete order with RFID payment
- `GET /` - Get all orders (with pagination and filters)
- `GET /:transactionId` - Get specific order details
- `POST /:transactionId/cancel` - Cancel a pending order
- `POST /verify-rfid` - Verify customer RFID before payment

## Frontend Implementation

### New Components

1. **OrderModal** (`web/src/components/Order/OrderModal.tsx`)
   - Product selection interface
   - Quantity controls (+/- buttons)
   - Real-time price calculation
   - Order summary with total

2. **RFIDScanModal** (`web/src/components/Order/RFIDScanModal.tsx`)
   - RFID card scanning interface
   - Customer verification
   - Balance checking
   - Payment processing

### Updated Components

1. **CanteenDashboard** (`web/src/pages/CanteenDashboard.tsx`)
   - Added "Order" button in header
   - Integrated order and RFID modals
   - Handles order flow state management

## How to Use the System

### For Canteen Staff:

1. **Creating an Order:**
   - Click the "Order" button in the Canteen Dashboard
   - Browse and search for products
   - Click "Add" to add items to the order
   - Use +/- buttons to adjust quantities
   - Review order summary on the right panel
   - Click "Proceed to Payment" when ready

2. **Processing Payment:**
   - The RFID scanning modal will open
   - Ask customer to scan their RFID card or enter card ID manually
   - System will verify customer and show their balance
   - Review order total and customer balance
   - Click "Confirm Payment" to complete the transaction
   - System will deduct amount from customer balance and update inventory

### Features:

- **Real-time Inventory:** Stock levels are checked and updated automatically
- **Balance Verification:** System prevents orders if customer has insufficient balance
- **Automatic Calculations:** Unit prices, subtotals, and totals calculated automatically
- **Transaction Tracking:** All orders are logged with timestamps and customer details
- **Error Handling:** Comprehensive error messages for various scenarios

## API Usage Examples

### Create Order
```javascript
POST /api/canteen-orders/create
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

### Complete Payment
```javascript
POST /api/canteen-orders/123/complete
{
  "customer_rfid": "ABC123456"
}
```

### Verify Customer
```javascript
POST /api/canteen-orders/verify-rfid
{
  "rfid_card_id": "ABC123456"
}
```

## Security Features

- JWT token authentication required for all endpoints
- RFID verification before payment processing
- Balance validation before transaction completion
- Inventory stock checking to prevent overselling

## Error Handling

The system handles various error scenarios:
- Invalid or missing RFID cards
- Insufficient customer balance
- Out of stock products
- Invalid product IDs
- Network connectivity issues

## Future Enhancements

Potential improvements that could be added:
- Order history and reporting
- Batch order processing
- Receipt printing integration
- Real-time order status updates
- Customer notification system
- Analytics and sales reporting

## Testing

To test the implementation:
1. Ensure database tables are created
2. Add some products to the PRODUCT table
3. Create test users/personnel with RFID cards and balances
4. Start the backend server
5. Access the Canteen Dashboard in the web interface
6. Try creating and completing an order

## Support

For issues or questions about this implementation, check:
- Database connection and table creation
- Product availability and stock levels
- User/personnel RFID card setup
- Balance sufficient for test transactions
