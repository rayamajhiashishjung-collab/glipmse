-- Glimpse Audit Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audits table: stores audit jobs and their status
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  root_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit results table: stores the final report JSON
CREATE TABLE IF NOT EXISTS audit_results (
  audit_id UUID PRIMARY KEY REFERENCES audits(id) ON DELETE CASCADE,
  report_json JSONB,
  pages_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_audits_updated_at ON audits;
CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- For MVP: Permissive RLS policies (no auth required)
-- WARNING: This is for MVP only. Add proper auth in production!

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- Allow all operations for MVP (no auth)
DROP POLICY IF EXISTS "Allow all reads on audits" ON audits;
CREATE POLICY "Allow all reads on audits" ON audits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all inserts on audits" ON audits;
CREATE POLICY "Allow all inserts on audits" ON audits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all updates on audits" ON audits;
CREATE POLICY "Allow all updates on audits" ON audits
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all reads on audit_results" ON audit_results;
CREATE POLICY "Allow all reads on audit_results" ON audit_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all inserts on audit_results" ON audit_results;
CREATE POLICY "Allow all inserts on audit_results" ON audit_results
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all updates on audit_results" ON audit_results;
CREATE POLICY "Allow all updates on audit_results" ON audit_results
  FOR UPDATE USING (true);

-- Verify tables were created
SELECT 'Schema created successfully!' AS message;

