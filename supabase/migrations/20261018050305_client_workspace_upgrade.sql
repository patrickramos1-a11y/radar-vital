-- Central do Cliente: contexto, subtarefas, dependencias, recorrencia e modelos.
-- A migration e aditiva e mantem compatibilidade com o campo legado completed.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_comment_id uuid REFERENCES public.client_comments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_origin_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.tasks
SET status = CASE WHEN completed THEN 'concluida' ELSE 'pendente' END
WHERE status IS NULL OR status = 'pendente';

UPDATE public.tasks
SET updated_at = COALESCE(completed_at, created_at, now());

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check,
  ADD CONSTRAINT tasks_status_check CHECK (
    status IN (
      'pendente',
      'em_andamento',
      'aguardando_cliente',
      'aguardando_terceiro',
      'bloqueada',
      'em_validacao',
      'concluida',
      'cancelada'
    )
  ),
  DROP CONSTRAINT IF EXISTS tasks_recurrence_check,
  ADD CONSTRAINT tasks_recurrence_check CHECK (
    recurrence IN ('none', 'weekly', 'monthly')
  ),
  DROP CONSTRAINT IF EXISTS tasks_parent_not_self_check,
  ADD CONSTRAINT tasks_parent_not_self_check CHECK (parent_task_id IS NULL OR parent_task_id <> id),
  DROP CONSTRAINT IF EXISTS tasks_recurrence_origin_not_self_check,
  ADD CONSTRAINT tasks_recurrence_origin_not_self_check CHECK (recurrence_origin_id IS NULL OR recurrence_origin_id <> id);

CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS tasks_source_comment_id_idx ON public.tasks(source_comment_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_recurrence_origin_id_idx ON public.tasks(recurrence_origin_id);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_recurring_occurrence_unique
  ON public.tasks(recurrence_origin_id, due_date)
  WHERE recurrence_origin_id IS NOT NULL AND due_date IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_task_operational_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' THEN
    IF NEW.completed OR NEW.status = 'concluida' THEN
      NEW.completed := true;
      NEW.status := 'concluida';
      NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSIF NEW.status = 'cancelada' THEN
      NEW.completed := false;
      NEW.completed_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.completed IS DISTINCT FROM OLD.completed THEN
    IF NEW.completed THEN
      NEW.status := 'concluida';
      NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSE
      IF NEW.status = 'concluida' THEN
        NEW.status := 'pendente';
      END IF;
      NEW.completed_at := NULL;
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'concluida' THEN
      NEW.completed := true;
      NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSE
      NEW.completed := false;
      NEW.completed_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_task_operational_status_trigger ON public.tasks;
CREATE TRIGGER sync_task_operational_status_trigger
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_task_operational_status();

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, depends_on_task_id),
  CONSTRAINT task_dependencies_not_self_check CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS task_dependencies_depends_on_task_id_idx
  ON public.task_dependencies(depends_on_task_id);

CREATE OR REPLACE FUNCTION public.validate_task_dependency_clients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  task_client_id uuid;
  dependency_client_id uuid;
BEGIN
  SELECT client_id INTO task_client_id FROM public.tasks WHERE id = NEW.task_id;
  SELECT client_id INTO dependency_client_id FROM public.tasks WHERE id = NEW.depends_on_task_id;

  IF task_client_id IS DISTINCT FROM dependency_client_id THEN
    RAISE EXCEPTION 'Task dependencies must belong to the same client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_task_dependency_clients_trigger ON public.task_dependencies;
CREATE TRIGGER validate_task_dependency_clients_trigger
BEFORE INSERT OR UPDATE ON public.task_dependencies
FOR EACH ROW EXECUTE FUNCTION public.validate_task_dependency_clients();

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read task dependencies" ON public.task_dependencies;
CREATE POLICY "Public read task dependencies"
  ON public.task_dependencies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert task dependencies" ON public.task_dependencies;
CREATE POLICY "Public insert task dependencies"
  ON public.task_dependencies FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update task dependencies" ON public.task_dependencies;
CREATE POLICY "Public update task dependencies"
  ON public.task_dependencies FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete task dependencies" ON public.task_dependencies;
CREATE POLICY "Public delete task dependencies"
  ON public.task_dependencies FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_dependencies TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  default_title text NOT NULL,
  default_description text,
  default_priority text NOT NULL DEFAULT 'normal'
    CHECK (default_priority IN ('baixa', 'normal', 'alta', 'urgente')),
  subtasks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(subtasks) = 'array'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read task templates" ON public.task_templates;
CREATE POLICY "Public read task templates"
  ON public.task_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert task templates" ON public.task_templates;
CREATE POLICY "Public insert task templates"
  ON public.task_templates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update task templates" ON public.task_templates;
CREATE POLICY "Public update task templates"
  ON public.task_templates FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete task templates" ON public.task_templates;
CREATE POLICY "Public delete task templates"
  ON public.task_templates FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_templates TO anon, authenticated, service_role;

INSERT INTO public.task_templates (
  name,
  description,
  default_title,
  default_description,
  default_priority,
  subtasks
) VALUES
  (
    'Solicitacao de documentos',
    'Organiza a coleta, conferencia e retorno de documentos do cliente.',
    'Solicitar e conferir documentos',
    'Registrar quais documentos sao necessarios, solicitar ao cliente e conferir o material recebido.',
    'normal',
    '["Listar documentos necessarios", "Solicitar documentos ao cliente", "Conferir documentos recebidos", "Registrar pendencias", "Confirmar recebimento ao cliente"]'::jsonb
  ),
  (
    'Protocolo ambiental',
    'Etapas essenciais para preparar e protocolar uma demanda ambiental.',
    'Preparar protocolo ambiental',
    'Consolidar documentos, revisar o processo, realizar o protocolo e registrar o comprovante.',
    'alta',
    '["Conferir documentos do processo", "Preparar requerimento", "Realizar revisao final", "Protocolar no orgao", "Registrar numero e comprovante"]'::jsonb
  ),
  (
    'Retorno ao cliente',
    'Fluxo curto para organizar acompanhamento e devolutiva.',
    'Realizar retorno ao cliente',
    'Reunir o contexto da demanda, confirmar o andamento e registrar a devolutiva realizada.',
    'normal',
    '["Reunir informacoes atualizadas", "Preparar devolutiva", "Contatar o cliente", "Registrar resultado do contato"]'::jsonb
  )
ON CONFLICT (name) DO NOTHING;
