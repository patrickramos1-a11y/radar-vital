BEGIN;

DO $$
DECLARE
  table_name TEXT;
  policy_record RECORD;
  standard_tables TEXT[] := ARRAY[
    'app_users',
    'apt_demands',
    'backlog_attachments',
    'backlog_history',
    'backlog_implementations',
    'backlog_items',
    'backlog_messages',
    'client_collaborator_assignments',
    'client_comments',
    'clients',
    'collaborator_comments',
    'collaborators',
    'deliverable_items',
    'deliverables',
    'demands',
    'licenses',
    'municipalities',
    'notifications',
    'panel_links',
    'pdf_client_aliases',
    'pdf_detected_clients',
    'pdf_imports',
    'pdf_metrics',
    'priorities',
    'processes',
    'tasks'
  ];
BEGIN
  FOREACH table_name IN ARRAY standard_tables
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      table_name
    );

    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        policy_record.policyname,
        table_name
      );
    END LOOP;

    EXECUTE format(
      'CREATE POLICY roadmap_read ON public.%I
       FOR SELECT TO anon, authenticated
       USING (NOT public.is_auth_enforced() OR auth.role() = ''authenticated'')',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY roadmap_insert ON public.%I
       FOR INSERT TO anon, authenticated
       WITH CHECK (NOT public.is_auth_enforced() OR auth.role() = ''authenticated'')',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY roadmap_update ON public.%I
       FOR UPDATE TO anon, authenticated
       USING (NOT public.is_auth_enforced() OR auth.role() = ''authenticated'')
       WITH CHECK (NOT public.is_auth_enforced() OR auth.role() = ''authenticated'')',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY roadmap_delete ON public.%I
       FOR DELETE TO anon, authenticated
       USING (NOT public.is_auth_enforced() OR auth.role() = ''authenticated'')',
      table_name
    );
  END LOOP;
END
$$;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  IF to_regclass('public.activity_logs') IS NOT NULL THEN
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'activity_logs'
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.activity_logs',
        policy_record.policyname
      );
    END LOOP;

    CREATE POLICY activity_logs_read
      ON public.activity_logs
      FOR SELECT
      TO anon, authenticated
      USING (
        NOT public.is_auth_enforced()
        OR auth.role() = 'authenticated'
      );

    CREATE POLICY activity_logs_insert
      ON public.activity_logs
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        NOT public.is_auth_enforced()
        OR (
          auth.role() = 'authenticated'
          AND actor_user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  IF to_regclass('public.deliverable_ratings') IS NOT NULL THEN
    ALTER TABLE public.deliverable_ratings ENABLE ROW LEVEL SECURITY;

    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'deliverable_ratings'
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.deliverable_ratings',
        policy_record.policyname
      );
    END LOOP;

    CREATE POLICY deliverable_ratings_read
      ON public.deliverable_ratings
      FOR SELECT
      TO anon, authenticated
      USING (
        NOT public.is_auth_enforced()
        OR auth.role() = 'authenticated'
      );

    CREATE POLICY deliverable_ratings_admin_insert
      ON public.deliverable_ratings
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        NOT public.is_auth_enforced()
        OR public.is_admin()
      );

    CREATE POLICY deliverable_ratings_admin_update
      ON public.deliverable_ratings
      FOR UPDATE
      TO anon, authenticated
      USING (
        NOT public.is_auth_enforced()
        OR public.is_admin()
      )
      WITH CHECK (
        NOT public.is_auth_enforced()
        OR public.is_admin()
      );

    CREATE POLICY deliverable_ratings_admin_delete
      ON public.deliverable_ratings
      FOR DELETE
      TO anon, authenticated
      USING (
        NOT public.is_auth_enforced()
        OR public.is_admin()
      );
  END IF;
END
$$;

DROP POLICY IF EXISTS cph_read ON storage.objects;
DROP POLICY IF EXISTS cph_insert ON storage.objects;
DROP POLICY IF EXISTS cph_update ON storage.objects;
DROP POLICY IF EXISTS cph_delete ON storage.objects;

CREATE POLICY cph_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'collaborator-photos'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY cph_insert
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'collaborator-photos'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY cph_update
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (
    bucket_id = 'collaborator-photos'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  )
  WITH CHECK (
    bucket_id = 'collaborator-photos'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY cph_delete
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'collaborator-photos'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

DROP POLICY IF EXISTS "Anyone can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS roadmap_pdf_read ON storage.objects;
DROP POLICY IF EXISTS roadmap_pdf_insert ON storage.objects;
DROP POLICY IF EXISTS roadmap_pdf_delete ON storage.objects;

CREATE POLICY roadmap_pdf_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'pdf-reports'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY roadmap_pdf_insert
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'pdf-reports'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY roadmap_pdf_delete
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'pdf-reports'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

DROP POLICY IF EXISTS "Public read backlog files" ON storage.objects;
DROP POLICY IF EXISTS "Public insert backlog files" ON storage.objects;
DROP POLICY IF EXISTS "Public delete backlog files" ON storage.objects;
DROP POLICY IF EXISTS roadmap_backlog_read ON storage.objects;
DROP POLICY IF EXISTS roadmap_backlog_insert ON storage.objects;
DROP POLICY IF EXISTS roadmap_backlog_delete ON storage.objects;

CREATE POLICY roadmap_backlog_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'backlog-files'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY roadmap_backlog_insert
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'backlog-files'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

CREATE POLICY roadmap_backlog_delete
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'backlog-files'
    AND (
      NOT public.is_auth_enforced()
      OR auth.role() = 'authenticated'
    )
  );

COMMIT;
