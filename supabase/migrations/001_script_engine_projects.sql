-- Script Engine Projects Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ajsbopbuejhhaxwtbbku/sql

-- Main projects table
CREATE TABLE IF NOT EXISTS script_engine_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT DEFAULT 'cc-internal-001',
  owner_email TEXT DEFAULT 'sam@channelchangers.co',

  -- Metadata
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  logline TEXT,
  format TEXT,
  tone TEXT,

  -- Content (JSONB for flexibility)
  characters JSONB DEFAULT '[]'::jsonb,
  character_profiles JSONB DEFAULT '[]'::jsonb,
  locations JSONB DEFAULT '[]'::jsonb,
  beats JSONB DEFAULT '[]'::jsonb,

  -- Script content
  script_content TEXT DEFAULT '',
  scenes_written INTEGER DEFAULT 0,
  production_notes JSONB DEFAULT '[]'::jsonb,

  -- Visual assets (references to storage)
  visuals JSONB DEFAULT '[]'::jsonb,

  -- Workflow
  current_phase INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

-- Snapshots table (version history)
CREATE TABLE IF NOT EXISTS script_engine_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES script_engine_projects(id) ON DELETE CASCADE,
  label TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sep_tenant ON script_engine_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sep_owner ON script_engine_projects(owner_email);
CREATE INDEX IF NOT EXISTS idx_sep_updated ON script_engine_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ses_project ON script_engine_snapshots(project_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sep_updated_at ON script_engine_projects;
CREATE TRIGGER update_sep_updated_at
  BEFORE UPDATE ON script_engine_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - for future multi-user)
ALTER TABLE script_engine_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_engine_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (single tenant)
CREATE POLICY "Allow all for tenant" ON script_engine_projects
  FOR ALL
  USING (tenant_id = 'cc-internal-001');

CREATE POLICY "Allow all snapshots for tenant" ON script_engine_snapshots
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM script_engine_projects WHERE tenant_id = 'cc-internal-001'
    )
  );
