
-- ClassSync COMPREHENSIVE Database Schema
-- Run this code in your Neon SQL Editor to fully initialize your database structure.

-- !!! IMPORTANT: MIGRATION FOR EXISTING DATABASES !!!
-- If you are seeing "null value in column 'date' violates not-null constraint", 
-- RUN THESE TWO LINES BELOW IN YOUR SQL EDITOR:
ALTER TABLE schedules ALTER COLUMN date DROP NOT NULL;
ALTER TABLE schedules ALTER COLUMN given_date DROP NOT NULL;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Core Profiles)
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password TEXT NOT NULL, 
    last_checked_notifications BIGINT DEFAULT 0,
    active_session_id VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE,
    is_subscribed BOOLEAN DEFAULT FALSE,
    expiry_date BIGINT, -- Stores Date.now() timestamp for expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Schedules Table (Core Academic Hub data)
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('class', 'assignment', 'activity')),
    course VARCHAR(50), 
    title VARCHAR(255), 
    date DATE NULL, -- Explicitly allowed NULL for unscheduled entries
    given_date DATE NULL, 
    time TIME NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Physical', 'Online')),
    location TEXT NOT NULL,
    instructions TEXT,
    attachment TEXT, 
    attachment_type VARCHAR(100),
    attachment_name VARCHAR(255),
    created_at_timestamp BIGINT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Guide Posts Table (Academic resources)
CREATE TABLE IF NOT EXISTS guide_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    link TEXT, 
    attachment TEXT, 
    attachment_type VARCHAR(100),
    attachment_name VARCHAR(255),
    created_at_timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Custom Icons Table (Branding)
CREATE TABLE IF NOT EXISTS custom_icons (
    course_code VARCHAR(50) PRIMARY KEY,
    icon_data TEXT NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'system', 
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indices for performance
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_timestamp ON schedules(created_at_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(active_session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email, is_read);
