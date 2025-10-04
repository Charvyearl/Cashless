-- Add categories table migration
-- Run this to add the categories table to your existing database

USE cashless_canteen;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
('Food', 'Main dishes and meals'),
('Beverage', 'Drinks and beverages'),
('Snacks', 'Light snacks and treats')
ON DUPLICATE KEY UPDATE name = name;
