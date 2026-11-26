-- Acompanhamentos recorrentes (docs/roadmap/PROCESSOS_RECORRENTES.md).
--
-- Migration aditiva: so acrescenta colunas opcionais ao processo-mae que se
-- repete. Nada existente muda; o app publicado continua funcionando.
-- Pode ser executada mais de uma vez.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence_anchor_date date,
  ADD COLUMN IF NOT EXISTS recurrence_anchor_label text,
  ADD COLUMN IF NOT EXISTS recurrence_first text,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date,
  ADD COLUMN IF NOT EXISTS recurrence_max_count integer,
  ADD COLUMN IF NOT EXISTS recurrence_lead_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recurrence_paused_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_first_check') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_first_check
      CHECK (recurrence_first IS NULL OR recurrence_first IN ('anchor', 'after_interval'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_max_count_check') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_max_count_check
      CHECK (recurrence_max_count IS NULL OR recurrence_max_count BETWEEN 1 AND 1000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_lead_days_check') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_lead_days_check
      CHECK (recurrence_lead_days BETWEEN 0 AND 365);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_end_after_anchor_check') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_end_after_anchor_check
      CHECK (recurrence_end_date IS NULL OR recurrence_anchor_date IS NULL OR recurrence_end_date >= recurrence_anchor_date);
  END IF;
END $$;

COMMENT ON COLUMN public.tasks.recurrence_anchor_date IS
  'Marco do acompanhamento recorrente (ex.: emissao da licenca). As datas seguem o marco.';
COMMENT ON COLUMN public.tasks.recurrence_anchor_label IS
  'O que e o marco (ex.: Emissao da LO 123/2026).';
COMMENT ON COLUMN public.tasks.recurrence_first IS
  'anchor = a primeira vez e no proprio marco; after_interval = um periodo depois do marco.';
COMMENT ON COLUMN public.tasks.recurrence_end_date IS
  'Ultima data possivel do acompanhamento (ex.: validade da licenca).';
COMMENT ON COLUMN public.tasks.recurrence_max_count IS
  'Numero maximo de vezes do acompanhamento.';
COMMENT ON COLUMN public.tasks.recurrence_lead_days IS
  'Dias de antecedencia: a etapa fica planejada para N dias antes do vencimento.';
COMMENT ON COLUMN public.tasks.recurrence_paused_at IS
  'Preenchido enquanto o acompanhamento esta pausado: nao nascem novas etapas.';
