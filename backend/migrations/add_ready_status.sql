-- Add 'ready' to TRANSACTIONS.status enum to support kitchen-ready state
ALTER TABLE TRANSACTIONS 
  MODIFY COLUMN status ENUM('pending','ready','completed','cancelled') DEFAULT 'pending';


