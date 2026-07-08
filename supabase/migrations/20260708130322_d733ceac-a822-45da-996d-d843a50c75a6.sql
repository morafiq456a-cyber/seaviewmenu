-- Defense-in-depth: has_role() is only ever invoked internally by the
-- SECURITY DEFINER helper is_admin() (which runs as the function owner), and by
-- RLS policies through is_admin(). No client role needs to call it directly, so
-- revoke EXECUTE from the exposed API roles to shrink the SECURITY DEFINER
-- attack surface flagged by the linter. is_admin() keeps working because it runs
-- as its owner, who retains EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;