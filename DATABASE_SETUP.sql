-- ========================================
-- GYM MEMBERSHIP & PAYMENT SYSTEM
-- Database Setup Script for XAMPP MySQL
-- ========================================

-- Create database
CREATE DATABASE IF NOT EXISTS gymdb_app;
USE gymdb_app;

-- Drop existing tables (if needed for fresh setup)
-- DROP TABLE IF EXISTS payments;
-- DROP TABLE IF EXISTS user_memberships;
-- DROP TABLE IF EXISTS auth_tokens;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS memberships;

-- ========================================
-- Create USERS Table
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Create MEMBERSHIPS Table
-- ========================================
CREATE TABLE IF NOT EXISTS memberships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Create USER_MEMBERSHIPS Table (Junction Table)
-- ========================================
CREATE TABLE IF NOT EXISTS user_memberships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    membership_id BIGINT NOT NULL,
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_membership_id (membership_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Create PAYMENTS Table
-- ========================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    membership_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_reference VARCHAR(255) NOT NULL UNIQUE,
    payment_method VARCHAR(100) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_membership_id (membership_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Create AUTH_TOKENS Table
-- ========================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_is_valid (is_valid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Insert DEFAULT MEMBERSHIP PLANS
-- ========================================
INSERT INTO memberships (id, name, duration_months, price, description) VALUES
(1, 'Basic', 1, 1500.00, 'Access to gym facilities during regular hours (8 AM - 10 PM)'),
(2, 'Premium', 6, 7500.00, 'Access to gym facilities, group classes, and personal training sessions (max 2 per month)'),
(3, 'Annual', 12, 12000.00, 'Full access to all facilities, classes, and priority booking')
ON DUPLICATE KEY UPDATE id=id;

-- ========================================
-- Insert DEMO ADMIN USER (Optional)
-- ========================================
-- Password: admin123 (hashed with bcrypt)
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxw
INSERT INTO users (id, firstname, lastname, email, password_hash, role) VALUES
(1, 'Admin', 'User', 'admin@gym.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxw', 'ADMIN')
ON DUPLICATE KEY UPDATE id=id;

-- ========================================
-- Verification Query
-- ========================================
SELECT '✅ Database setup completed!' as status;
SELECT COUNT(*) as total_memberships FROM memberships;
SELECT COUNT(*) as total_users FROM users;

SHOW TABLES;
