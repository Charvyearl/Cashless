-- Migration: Add PIN column to students and personnel tables
-- Run this script to add PIN support for payment verification

-- Add PIN column to students table
ALTER TABLE students 
ADD COLUMN pin VARCHAR(255) NULL AFTER password;

-- Add PIN column to personnel table
ALTER TABLE personnel 
ADD COLUMN pin VARCHAR(255) NULL AFTER password;
