-- Migration: Add TRANSACTIONS and TRANSACTION_ITEMS tables for canteen staff orders
-- Run this script to add the new tables to your database

-- New TRANSACTIONS table for canteen staff orders
CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    personnel_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('rfid', 'cash') DEFAULT 'rfid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES personnel(personnel_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_personnel_id (personnel_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (status)
);

-- New TRANSACTION_ITEMS table for individual items in each transaction
CREATE TABLE IF NOT EXISTS TRANSACTION_ITEMS (
    transaction_item_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_product_id (product_id)
);
