CREATE OR REPLACE FUNCTION public.delete_audit(
  p_audit_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_title TEXT;
BEGIN
  SELECT title
  INTO audit_title
  FROM public.audits
  WHERE id = p_audit_id
  FOR UPDATE;

  IF audit_title IS NULL THEN
    RAISE EXCEPTION 'Audit not found';
  END IF;

  DELETE FROM public.audits
  WHERE id = p_audit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_audit(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_audit(UUID, TEXT)
  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
