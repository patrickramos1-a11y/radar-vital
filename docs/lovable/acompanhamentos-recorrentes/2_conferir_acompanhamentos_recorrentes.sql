-- Acompanhamentos recorrentes: conferencia depois de aplicar 1_aplicar_acompanhamentos_recorrentes.sql.
-- So leitura.

-- 1. Esperado: 7 linhas (as colunas novas existem).
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND column_name IN (
    'recurrence_anchor_date', 'recurrence_anchor_label', 'recurrence_first',
    'recurrence_end_date', 'recurrence_max_count', 'recurrence_lead_days', 'recurrence_paused_at'
  )
ORDER BY column_name;

-- 2. Esperado: 4 linhas (as regras novas existem).
SELECT conname
FROM pg_constraint
WHERE conname IN (
  'tasks_recurrence_first_check', 'tasks_recurrence_max_count_check',
  'tasks_recurrence_lead_days_check', 'tasks_recurrence_end_after_anchor_check'
)
ORDER BY conname;
