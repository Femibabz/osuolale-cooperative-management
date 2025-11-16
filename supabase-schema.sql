-- OsuOlale Cooperative Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Societies table
CREATE TABLE IF NOT EXISTS societies (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
  admin_user_id TEXT,
  member_count INTEGER DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  total_loans NUMERIC DEFAULT 0,
  total_shares NUMERIC DEFAULT 0
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_first_login BOOLEAN DEFAULT true,
  society_id TEXT REFERENCES societies(id),
  is_active BOOLEAN DEFAULT true
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  society_id TEXT NOT NULL REFERENCES societies(id),
  member_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
  occupation TEXT,
  annual_income NUMERIC,
  shares_balance NUMERIC DEFAULT 0,
  savings_balance NUMERIC DEFAULT 0,
  loan_balance NUMERIC DEFAULT 0,
  interest_balance NUMERIC DEFAULT 0,
  society_dues NUMERIC DEFAULT 0,
  loan_start_date TIMESTAMPTZ,
  loan_duration_months INTEGER,
  loan_interest_rate NUMERIC,
  monthly_loan_payment NUMERIC
);

-- Membership Applications table
CREATE TABLE IF NOT EXISTS membership_applications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  society_id TEXT NOT NULL REFERENCES societies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  occupation TEXT NOT NULL,
  monthly_income NUMERIC NOT NULL,
  guarantor_name TEXT NOT NULL,
  guarantor_phone TEXT NOT NULL,
  guarantor_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_notes TEXT
);

-- Loan Applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  member_id TEXT NOT NULL REFERENCES members(id),
  amount NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_notes TEXT,
  disbursed_at TIMESTAMPTZ
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  member_id TEXT NOT NULL REFERENCES members(id),
  type TEXT NOT NULL CHECK (type IN (
    'shares_deposit', 'shares_withdrawal',
    'savings_deposit', 'savings_withdrawal',
    'loan_disbursement', 'loan_payment',
    'interest_charge', 'interest_payment',
    'dues_payment', 'profile_update'
  )),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  balance_after NUMERIC NOT NULL,
  reference_number TEXT,
  processed_by TEXT
);

-- ByLaws table
CREATE TABLE IF NOT EXISTS bylaws (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  society_id TEXT NOT NULL REFERENCES societies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('membership', 'financial', 'governance', 'general')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Login Sessions table
CREATE TABLE IF NOT EXISTS login_sessions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  society_id TEXT REFERENCES societies(id),
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMPTZ,
  device_info JSONB NOT NULL,
  location_info JSONB NOT NULL,
  session_active BOOLEAN DEFAULT true,
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reasons TEXT[]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_society ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_society ON members(society_id);
CREATE INDEX IF NOT EXISTS idx_applications_society ON membership_applications(society_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_apps_member ON loan_applications(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_apps_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_bylaws_society ON bylaws(society_id);
CREATE INDEX IF NOT EXISTS idx_bylaws_active ON bylaws(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON login_sessions(session_active);

-- Enable Row Level Security (RLS)
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bylaws ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can make these more restrictive later)
CREATE POLICY "Allow all operations" ON societies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON members FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON membership_applications FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON loan_applications FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bylaws FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON login_sessions FOR ALL USING (true);
