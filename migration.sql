-- Migration SQL to setup Supabase Tables for SkillHire AI
-- This script contains table definitions for:
-- profiles, companies, jobs, applications, subscriptions, ai_scores, certificates, notifications

-- 1. PROFILES Table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'company', 'admin')),
  title VARCHAR(255),
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  reputation_score INT DEFAULT 500,
  verified_skills JSONB DEFAULT '{}'::jsonb,
  subscribed BOOLEAN DEFAULT false,
  phone VARCHAR(50),
  github_url TEXT,
  portfolio_url TEXT,
  subscriber_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure profiles table has subscriber_id if it already exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscriber_id VARCHAR(255);

-- 2. COMPANIES Table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  title VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. JOBS Table
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  location VARCHAR(255),
  salary_range VARCHAR(255),
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  skills_required TEXT[] DEFAULT '{}',
  tasks_count INT DEFAULT 0,
  difficulty_level VARCHAR(100),
  required_skills_list TEXT[] DEFAULT '{}',
  optional_skills_list TEXT[] DEFAULT '{}',
  skill_matrix JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. APPLICATIONS Table
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(255) PRIMARY KEY,
  job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
  resume_text TEXT,
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'interviewing', 'accepted', 'rejected', 'shortlisted')),
  score INT,
  ai_ranking INT,
  shortlisted BOOLEAN DEFAULT false,
  match_score FLOAT,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure applications table has new columns if it already exists
ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_ranking INT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlisted BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_score FLOAT;

-- 10. INTERVIEWS Table
CREATE TABLE IF NOT EXISTS interviews (
  id VARCHAR(255) PRIMARY KEY,
  job_id VARCHAR(255) REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  meeting_link TEXT,
  meeting_type VARCHAR(50) CHECK (meeting_type IN ('zoom', 'google_meet', 'custom')),
  difficulty_level VARCHAR(50) DEFAULT 'Intermediate',
  questions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. INTERVIEW_SUMMARIES Table
CREATE TABLE IF NOT EXISTS interview_summaries (
  id VARCHAR(255) PRIMARY KEY,
  interview_id VARCHAR(255) UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  recommendation TEXT,
  feedback TEXT,
  overall_score INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimizing
CREATE INDEX IF NOT EXISTS idx_interviews_job ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_summaries_interview ON interview_summaries(interview_id);

-- 5. SUBSCRIPTIONS Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  phone VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5b. SUBSCRIPTION_HISTORY Table
CREATE TABLE IF NOT EXISTS subscription_history (
  id VARCHAR(255) PRIMARY KEY,
  phone VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'subscribe', 'unsubscribe', 'renew', 'check'
  amount VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 6. AI_SCORES Table
CREATE TABLE IF NOT EXISTS ai_scores (
  id VARCHAR(255) PRIMARY KEY,
  candidate_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
  skill VARCHAR(100) NOT NULL,
  score INT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CERTIFICATES Table
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(255) PRIMARY KEY,
  candidate_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
  skill VARCHAR(100) NOT NULL,
  score INT NOT NULL,
  issue_date DATE NOT NULL,
  cert_hash VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimizing
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_candidate ON ai_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 9. TASK_SUBMISSIONS Table
CREATE TABLE IF NOT EXISTS task_submissions (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  candidate_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  score INT DEFAULT 0,
  ai_review TEXT,
  submission_type VARCHAR(50) DEFAULT 'code',
  github_url TEXT,
  portfolio_url TEXT,
  pdf_data_url TEXT,
  evaluation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_candidate ON task_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON task_submissions(task_id);

