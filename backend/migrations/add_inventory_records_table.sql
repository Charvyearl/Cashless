-- Migration: Add inventory_records table for tracking inventory adjustments
-- Run this script to add the inventory_records table to your database

USE cashless_canteen;

-- Create inventory_records table
CREATE TABLE IF NOT EXISTS inventory_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    change_type ENUM('add', 'adjust', 'deduct') NOT NULL,
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    notes TEXT,
    user_id INT NULL,
    personnel_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_personnel_id (personnel_id),
    FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES students(user_id) ON DELETE SET NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel(personnel_id) ON DELETE SET NULL
);

