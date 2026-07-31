BEGIN;

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'auth_enforced',
  'false'::jsonb,
  'Controls the final cutover from anonymous compatibility to authenticated access.'
)
ON CONFLICT (key) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS collaborators_user_id_unique
  ON public.collaborators (user_id)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role public.app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

CREATE OR REPLACE FUNCTION public.is_auth_enforced()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (value #>> '{}')::BOOLEAN
      FROM public.system_settings
      WHERE key = 'auth_enforced'
    ),
    FALSE
  )
$$;

CREATE OR REPLACE FUNCTION public.current_collaborator_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.collaborators
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_current_profile()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_email TEXT := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  matched_collaborator public.collaborators%ROWTYPE;
  display_name TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO matched_collaborator
  FROM public.collaborators
  WHERE user_id = current_user_id
     OR (
       user_id IS NULL
       AND email IS NOT NULL
       AND LOWER(email) = current_email
     )
  ORDER BY (user_id = current_user_id) DESC
  LIMIT 1;

  IF matched_collaborator.id IS NOT NULL
     AND matched_collaborator.user_id IS NULL THEN
    UPDATE public.collaborators
    SET user_id = current_user_id,
        updated_at = now()
    WHERE id = matched_collaborator.id
      AND user_id IS NULL;
  END IF;

  display_name := COALESCE(
    matched_collaborator.name,
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'display_name', ''),
    NULLIF(current_email, ''),
    'Usuario'
  );

  INSERT INTO public.profiles (
    user_id,
    display_name,
    collaborator_id
  )
  VALUES (
    current_user_id,
    display_name,
    matched_collaborator.id
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    collaborator_id = COALESCE(
      public.profiles.collaborator_id,
      EXCLUDED.collaborator_id
    ),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN matched_collaborator.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_auth_enforced(enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator role required';
  END IF;

  INSERT INTO public.system_settings (key, value, description, updated_by)
  VALUES (
    'auth_enforced',
    to_jsonb(enabled),
    'Controls the final cutover from anonymous compatibility to authenticated access.',
    auth.uid()
  )
  ON CONFLICT (key)
  DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now(),
    updated_by = auth.uid();

  UPDATE storage.buckets
  SET public = NOT enabled
  WHERE id IN ('pdf-reports', 'backlog-files');
END;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('collaborator-photos', 'collaborator-photos', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS actor_user_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'user_roles', 'system_settings')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

CREATE POLICY profiles_authenticated_read
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY profiles_self_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_roles_self_read
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_roles_admin_manage
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY system_settings_admin_read
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY system_settings_admin_manage
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_collaborator_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_current_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_auth_enforced(BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_auth_enforced()
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_collaborator_id()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_profile()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_auth_enforced(BOOLEAN)
  TO authenticated;

COMMIT;
