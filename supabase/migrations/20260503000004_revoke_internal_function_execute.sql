-- ============================================================
-- 0004 — Revoke EXECUTE on internal functions from anon role
-- Addresses Supabase advisors: anon_security_definer_function_executable
-- See docs/02-data-model.md §9 — these are RLS-internal helpers.
-- ============================================================

-- set_updated_at is a trigger function, never meant for RPC.
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- is_workspace_member and current_student_id are intentionally callable by
-- authenticated users (RLS policies need them) but should NOT be callable by anon.
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_student_id() FROM anon;
