-- ============================================================
-- 0003 — Row-Level Security policies + helper functions
-- All user-facing tables enable RLS with the standard pattern:
--   1. Owner can read/write own rows
--   2. Workspace coach/admin can read/write all rows in their workspace
-- See docs/02-data-model.md §9 for the pattern reference.
-- ============================================================

-- ─────────────────────────────────────────────
-- Helper functions (depend on workspace_members)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_workspace_member(
  ws_id UUID,
  required_role TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND (
        required_role IS NULL
        OR role = required_role
        OR role = 'admin'
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────
-- workspaces
-- ─────────────────────────────────────────────

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspaces_select_member ON workspaces FOR SELECT
  USING (public.is_workspace_member(id));

CREATE POLICY workspaces_insert_owner ON workspaces FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY workspaces_update_admin ON workspaces FOR UPDATE
  USING (public.is_workspace_member(id, 'admin'))
  WITH CHECK (public.is_workspace_member(id, 'admin'));

-- ─────────────────────────────────────────────
-- workspace_members
-- ─────────────────────────────────────────────

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY wm_select_member ON workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY wm_admin_all ON workspace_members FOR ALL
  USING (public.is_workspace_member(workspace_id, 'admin'))
  WITH CHECK (public.is_workspace_member(workspace_id, 'admin'));

-- ─────────────────────────────────────────────
-- students
-- ─────────────────────────────────────────────

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_select_self ON students FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY students_select_coach ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = students.user_id
        AND public.is_workspace_member(wm.workspace_id, 'coach')
    )
  );

CREATE POLICY students_insert_self ON students FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY students_update_self ON students FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- cohorts
-- ─────────────────────────────────────────────

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohorts_select_member ON cohorts FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY cohorts_coach_all ON cohorts FOR ALL
  USING (public.is_workspace_member(workspace_id, 'coach'))
  WITH CHECK (public.is_workspace_member(workspace_id, 'coach'));

-- ─────────────────────────────────────────────
-- cohort_students
-- ─────────────────────────────────────────────

ALTER TABLE cohort_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY cs_select_self_or_coach ON cohort_students FOR SELECT
  USING (
    student_id = public.current_student_id()
    OR EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_students.cohort_id
        AND public.is_workspace_member(c.workspace_id, 'coach')
    )
  );

CREATE POLICY cs_coach_write ON cohort_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_students.cohort_id
        AND public.is_workspace_member(c.workspace_id, 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_students.cohort_id
        AND public.is_workspace_member(c.workspace_id, 'coach')
    )
  );

-- ─────────────────────────────────────────────
-- cohort_module_config
-- ─────────────────────────────────────────────

ALTER TABLE cohort_module_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY cmc_select_member ON cohort_module_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_module_config.cohort_id
        AND public.is_workspace_member(c.workspace_id)
    )
  );

CREATE POLICY cmc_coach_write ON cohort_module_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_module_config.cohort_id
        AND public.is_workspace_member(c.workspace_id, 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_module_config.cohort_id
        AND public.is_workspace_member(c.workspace_id, 'coach')
    )
  );

-- ─────────────────────────────────────────────
-- companies
-- ─────────────────────────────────────────────

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_owner_all ON companies FOR ALL
  USING (owner_student_id = public.current_student_id())
  WITH CHECK (
    owner_student_id = public.current_student_id()
    AND public.is_workspace_member(workspace_id)
  );

CREATE POLICY companies_coach_select ON companies FOR SELECT
  USING (public.is_workspace_member(workspace_id, 'coach'));

-- ─────────────────────────────────────────────
-- company_members
-- ─────────────────────────────────────────────

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY cmem_self_or_owner ON company_members FOR ALL
  USING (
    student_id = public.current_student_id()
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_members.company_id
        AND c.owner_student_id = public.current_student_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = company_members.company_id
        AND c.owner_student_id = public.current_student_id()
    )
  );

-- ─────────────────────────────────────────────
-- module_data
-- ─────────────────────────────────────────────

ALTER TABLE module_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY md_owner_all ON module_data FOR ALL
  USING (student_id = public.current_student_id())
  WITH CHECK (
    student_id = public.current_student_id()
    AND public.is_workspace_member(workspace_id)
  );

CREATE POLICY md_coach_select ON module_data FOR SELECT
  USING (public.is_workspace_member(workspace_id, 'coach'));

-- ─────────────────────────────────────────────
-- module_data_links
-- ─────────────────────────────────────────────

ALTER TABLE module_data_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY mdl_select_via_module ON module_data_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_data md
      WHERE md.id IN (source_module_data_id, target_module_data_id)
        AND (
          md.student_id = public.current_student_id()
          OR public.is_workspace_member(md.workspace_id, 'coach')
        )
    )
  );

CREATE POLICY mdl_insert_via_owner ON module_data_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module_data md
      WHERE md.id = source_module_data_id
        AND md.student_id = public.current_student_id()
    )
  );

-- ─────────────────────────────────────────────
-- student_module_access
-- ─────────────────────────────────────────────

ALTER TABLE student_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY sma_self_select ON student_module_access FOR SELECT
  USING (student_id = public.current_student_id());

CREATE POLICY sma_coach_all ON student_module_access FOR ALL
  USING (public.is_workspace_member(workspace_id, 'coach'))
  WITH CHECK (public.is_workspace_member(workspace_id, 'coach'));

-- ─────────────────────────────────────────────
-- entitlements / products / subscriptions / content_items
-- (Phase 2/3 reserved — admins only for now)
-- ─────────────────────────────────────────────

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY ent_self_select ON entitlements FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY ent_admin_all ON entitlements FOR ALL
  USING (workspace_id IS NULL OR public.is_workspace_member(workspace_id, 'admin'))
  WITH CHECK (workspace_id IS NULL OR public.is_workspace_member(workspace_id, 'admin'));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select_active ON products FOR SELECT
  USING (is_active OR public.is_workspace_member(workspace_id, 'admin'));
CREATE POLICY products_admin_write ON products FOR ALL
  USING (public.is_workspace_member(workspace_id, 'admin'))
  WITH CHECK (public.is_workspace_member(workspace_id, 'admin'));

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subs_self_select ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY ci_public_select ON content_items FOR SELECT
  USING (visibility = 'public' OR public.is_workspace_member(workspace_id));
CREATE POLICY ci_admin_write ON content_items FOR ALL
  USING (public.is_workspace_member(workspace_id, 'coach'))
  WITH CHECK (public.is_workspace_member(workspace_id, 'coach'));
