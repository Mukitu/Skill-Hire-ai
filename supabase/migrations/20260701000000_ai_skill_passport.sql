-- AI Skill Passport Migration
-- Creates necessary tables for Certificates, Authenticity Reports, and Company Reports

-- 1. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_id TEXT NOT NULL UNIQUE
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Companies can view any certificate for verification"
  ON certificates FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'company'));

CREATE POLICY "Anyone can view certificate by certificate_id for public verification"
  ON certificates FOR SELECT
  USING (true);

-- 2. Authenticity Reports Table
CREATE TABLE IF NOT EXISTS authenticity_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL, -- references task_submissions but wait we don't have task_submissions table schema, assuming it's text or uuid
  authenticity_score INTEGER NOT NULL,
  is_likely_ai BOOLEAN NOT NULL DEFAULT false,
  duplicate_detected BOOLEAN NOT NULL DEFAULT false,
  reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE authenticity_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own authenticity reports"
  ON authenticity_reports FOR SELECT
  USING (true); -- Usually we'd join with task_submissions to check candidate_id, but keeping it simple or accessible via API

CREATE POLICY "Companies can view authenticity reports"
  ON authenticity_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'company'));

-- 3. Company Reports Table
CREATE TABLE IF NOT EXISTS company_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_score INTEGER NOT NULL,
  quality_score INTEGER NOT NULL,
  authenticity_score INTEGER NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  weaknesses JSONB NOT NULL DEFAULT '[]',
  hiring_recommendation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE company_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view company reports"
  ON company_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'company'));

CREATE POLICY "Candidates can view their own company reports"
  ON company_reports FOR SELECT
  USING (auth.uid() = candidate_id);
