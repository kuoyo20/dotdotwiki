-- 銷售軍師 v0.6 Supabase schema (Phase 6)
-- Run this in Supabase Studio → SQL Editor → New query.
-- After running: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env
-- to enable the teacher dashboard (/teacher) and real student progress sync.

-- 1. Student progress summary (one row per student PIN).
--    Frontend pushes counts only — full payload stays in student_data.
CREATE TABLE IF NOT EXISTS student_progress (
  pin           TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL DEFAULT '',
  m1_filled     INT  NOT NULL DEFAULT 0,
  m1_total      INT  NOT NULL DEFAULT 9,
  m2_filled     INT  NOT NULL DEFAULT 0,
  m2_total      INT  NOT NULL DEFAULT 5,
  m3_filled     INT  NOT NULL DEFAULT 0,
  m3_total      INT  NOT NULL DEFAULT 1,
  m4_filled     INT  NOT NULL DEFAULT 0,
  m4_total      INT  NOT NULL DEFAULT 12,
  last_saved    TIMESTAMPTZ
);

-- 2. Full student data payload (JSONB blob mirroring localStorage shape).
--    Used by demo / screen mode (大螢幕示範模式 §10.5).
CREATE TABLE IF NOT EXISTS student_data (
  pin         TEXT PRIMARY KEY REFERENCES student_progress(pin) ON DELETE CASCADE,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Row-Level Security
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_data     ENABLE ROW LEVEL SECURITY;

-- Public read for teacher dashboard (anon key only sees aggregated counts;
-- payload sits behind authenticated/teacher role).
CREATE POLICY IF NOT EXISTS read_progress_anon
  ON student_progress FOR SELECT
  USING (true);

-- Anon can upsert their own row by PIN. PIN auth is workshop-only — this is
-- not strong security, but matches the spec's "PIN 登入" model.
CREATE POLICY IF NOT EXISTS upsert_progress_anon
  ON student_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS update_progress_anon
  ON student_progress FOR UPDATE
  USING (true) WITH CHECK (true);

-- student_data 只允許 service role 讀(老師端走 service role 拉學員作品)
CREATE POLICY IF NOT EXISTS service_only_data
  ON student_data FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
