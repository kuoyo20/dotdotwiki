-- ============================================================
-- 0002 — Core Phase 1 tables
-- Domains: tenancy / cohorts / companies / module_data / access
-- See docs/02-data-model.md for the full data model.
-- ============================================================

-- ─────────────────────────────────────────────
-- Domain 1: Identity & Tenancy
-- ─────────────────────────────────────────────

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  brand_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_workspaces_updated
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_students_updated
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'student')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- ─────────────────────────────────────────────
-- Domain 2: Course / Cohort
-- ─────────────────────────────────────────────

CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  invite_password TEXT,
  starts_at DATE,
  ends_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_workspace ON cohorts(workspace_id);

CREATE TRIGGER trg_cohorts_updated
  BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE cohort_students (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, student_id)
);

CREATE INDEX idx_cohort_students_student ON cohort_students(student_id);

CREATE TABLE cohort_module_config (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  PRIMARY KEY (cohort_id, module_type)
);

-- ─────────────────────────────────────────────
-- Domain 3: Subject (Companies)
-- ─────────────────────────────────────────────

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_type TEXT NOT NULL DEFAULT 'own'
    CHECK (company_type IN ('own', 'client')),
  client_of_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  industry TEXT,
  size_band TEXT,
  founded_year INT,
  website TEXT,
  description TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_of_only_for_clients CHECK (
    company_type = 'client' OR client_of_company_id IS NULL
  )
);

CREATE INDEX idx_companies_owner_type ON companies(owner_student_id, company_type);
CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_client_of ON companies(client_of_company_id)
  WHERE client_of_company_id IS NOT NULL;

CREATE TRIGGER trg_companies_updated
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE company_members (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, student_id)
);

-- ─────────────────────────────────────────────
-- Domain 4: Module Data (the universal payload table)
-- ─────────────────────────────────────────────

CREATE TABLE module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed')),
  ai_input JSONB,
  ai_output JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, module_type)
);

CREATE INDEX idx_module_data_company_module ON module_data(company_id, module_type);
CREATE INDEX idx_module_data_student ON module_data(student_id);
CREATE INDEX idx_module_data_workspace_module ON module_data(workspace_id, module_type);

CREATE TRIGGER trg_module_data_updated
  BEFORE UPDATE ON module_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE module_data_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module_data_id UUID NOT NULL REFERENCES module_data(id) ON DELETE CASCADE,
  target_module_data_id UUID NOT NULL REFERENCES module_data(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_module_data_id <> target_module_data_id)
);

CREATE INDEX idx_module_data_links_source ON module_data_links(source_module_data_id);
CREATE INDEX idx_module_data_links_target ON module_data_links(target_module_data_id);

-- ─────────────────────────────────────────────
-- Domain 5: Access Control (per-student module gates)
-- ─────────────────────────────────────────────

CREATE TABLE student_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('cohort', 'manual', 'purchase')),
  source_ref UUID,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE (student_id, workspace_id, module_type)
);

CREATE INDEX idx_student_module_access_student ON student_module_access(student_id, workspace_id);

-- ─────────────────────────────────────────────
-- Domain 6: Future reserved (Phase 2/3 — empty for now)
-- ─────────────────────────────────────────────

CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('public', 'free', 'student', 'pro', 'admin')),
  source TEXT NOT NULL,
  source_ref UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',
  product_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, sku)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT,
  status TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_module_data_id UUID REFERENCES module_data(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT,
  body JSONB,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'workspace', 'public')),
  published_at TIMESTAMPTZ,
  seo_meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE TRIGGER trg_content_items_updated
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
