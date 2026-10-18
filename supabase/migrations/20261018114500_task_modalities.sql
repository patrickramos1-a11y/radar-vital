-- Modalidades operacionais para classificar tarefas da Central do Cliente.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS modality text NOT NULL DEFAULT 'levantamento';

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_modality_check,
  ADD CONSTRAINT tasks_modality_check CHECK (
    modality IN (
      'levantamento',
      'elaboracao',
      'regularizacao',
      'acompanhamento',
      'execucao_operacional'
    )
  );
