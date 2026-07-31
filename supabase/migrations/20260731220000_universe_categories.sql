ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS universe_category TEXT;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_universe_category_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_universe_category_check
  CHECK (
    universe_category IS NULL
    OR universe_category IN ('EMPRESA', 'SETOR', 'COLABORADOR', 'PROJETO')
  );

CREATE INDEX IF NOT EXISTS clients_universe_category_idx
  ON public.clients (client_type, universe_category, is_active, display_order);
