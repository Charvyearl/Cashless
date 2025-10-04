-- Cashless Canteen Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS cashless_canteen;
USE cashless_canteen;

-- Categories table for product categories
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table for canteen menu and inventory
CREATE TABLE IF NOT EXISTS PRODUCT (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_name (product_name),
    INDEX idx_category (category),
    INDEX idx_available (is_available)
);

-- System settings
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    rfid_card_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rfid (rfid_card_id),
    INDEX idx_email (email)
);

-- Personnel table
CREATE TABLE personnel (
    personnel_id INT PRIMARY KEY AUTO_INCREMENT,
    rfid_card_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rfid (rfid_card_id),
    INDEX idx_email (email)
);

-- New TRANSACTIONS table for canteen staff orders
CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    personnel_id INT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('rfid', 'cash') DEFAULT 'rfid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_product_id (product_id)
);

-- Add foreign key constraints after all tables are created
ALTER TABLE TRANSACTIONS 
ADD CONSTRAINT fk_transactions_user_id 
FOREIGN KEY (user_id) REFERENCES students(user_id) ON DELETE CASCADE;

ALTER TABLE TRANSACTIONS 
ADD CONSTRAINT fk_transactions_personnel_id 
FOREIGN KEY (personnel_id) REFERENCES personnel(personnel_id) ON DELETE CASCADE;

ALTER TABLE TRANSACTION_ITEMS 
ADD CONSTRAINT fk_transaction_items_transaction_id 
FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id) ON DELETE CASCADE;

ALTER TABLE TRANSACTION_ITEMS 
ADD CONSTRAINT fk_transaction_items_product_id 
FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE;

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
('Food', 'Main dishes and meals'),
('Beverage', 'Drinks and beverages'),
('Snacks', 'Light snacks and treats')
ON DUPLICATE KEY UPDATE name = name;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('system_name', 'Cashless Canteen System', 'Name of the canteen system'),
('currency', 'PHP', 'Default currency'),
('min_balance', '0.00', 'Minimum wallet balance'),
('max_balance', '10000.00', 'Maximum wallet balance'),
('rfid_timeout', '30', 'RFID reader timeout in seconds');
