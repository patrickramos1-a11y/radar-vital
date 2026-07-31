BEGIN;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'clients'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%client_type%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.clients DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;
END
$$;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_client_type_check
  CHECK (client_type IN ('AC', 'AV', 'UNIVERSO_RAMOS'));

CREATE INDEX IF NOT EXISTS clients_active_type_order_idx
  ON public.clients (client_type, is_active, display_order);

COMMIT;