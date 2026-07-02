-- SkillHire AI - Supabase & Cloud SQL Schema
-- Official BDApps Subscription & OTP Tables

-- 1. Users (formerly profiles)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'candidate',
  title TEXT,
  bio TEXT,
  skills JSONB DEFAULT '[]',
  reputation_score INTEGER DEFAULT 300,
  verified_skills JSONB DEFAULT '{}',
  subscribed BOOLEAN DEFAULT FALSE,
  phone TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  subscriber_id TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  phone TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, 
  subscriber_id TEXT, 
  operator TEXT, 
  activation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  billing_status TEXT DEFAULT 'ACTIVE',
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Billing History
CREATE TABLE IF NOT EXISTS billing_history (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  action TEXT NOT NULL,
  amount TEXT DEFAULT '3.00 BDT',
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. OTP Logs
CREATE TABLE IF NOT EXISTS otp_logs (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  phone TEXT NOT NULL,
  reference_no TEXT,
  otp_code TEXT,
  status TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  source TEXT DEFAULT 'BDApps',
  payload JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
