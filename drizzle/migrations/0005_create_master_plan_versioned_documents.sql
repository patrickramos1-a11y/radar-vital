-- A versioned document lets the Plano Mestre go live without modifying the
-- operational clients, challenges, tasks or comments tables.
CREATE TABLE IF NOT EXISTS public.master_plan_documents (
  document_key text PRIMARY KEY CHECK (document_key = 'universo-ramos'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  payload jsonb NOT NULL CHECK (
    jsonb_typeof(payload) = 'object'
    AND payload->>'version' = '1'
    AND octet_length(payload::text) <= 2000000
  ),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.master_plan_documents TO anon, authenticated;
GRANT UPDATE (revision, payload) ON public.master_plan_documents TO anon, authenticated;
GRANT ALL ON public.master_plan_documents TO service_role;
ALTER TABLE public.master_plan_documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.master_plan_document_revisions (
  document_key text NOT NULL REFERENCES public.master_plan_documents(document_key),
  revision bigint NOT NULL CHECK (revision >= 0),
  payload jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (document_key, revision)
);
GRANT ALL ON public.master_plan_document_revisions TO service_role;
ALTER TABLE public.master_plan_document_revisions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'master_plan_documents' AND policyname = 'master_plan_documents_read') THEN
    CREATE POLICY master_plan_documents_read ON public.master_plan_documents
      FOR SELECT TO anon, authenticated USING (document_key = 'universo-ramos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'master_plan_documents' AND policyname = 'master_plan_documents_update') THEN
    CREATE POLICY master_plan_documents_update ON public.master_plan_documents
      FOR UPDATE TO anon, authenticated
      USING (document_key = 'universo-ramos')
      WITH CHECK (document_key = 'universo-ramos');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_master_plan_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.revision <> OLD.revision + 1 THEN
    RAISE EXCEPTION 'master_plan_revision_mismatch';
  END IF;
  INSERT INTO public.master_plan_document_revisions (document_key, revision, payload)
  VALUES (OLD.document_key, OLD.revision, OLD.payload);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_master_plan_document() FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'master_plan_document_archive' AND tgrelid = 'public.master_plan_documents'::regclass) THEN
    CREATE TRIGGER master_plan_document_archive
      BEFORE UPDATE ON public.master_plan_documents
      FOR EACH ROW EXECUTE FUNCTION public.archive_master_plan_document();
  END IF;
END;
$$;