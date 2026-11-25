CREATE ROLE anon; CREATE ROLE authenticated;

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  client_type text NOT NULL DEFAULT 'AC', is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE public.priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  client_id uuid REFERENCES public.clients(id), assigned_to text[] NOT NULL DEFAULT '{}',
  due_date date, status text NOT NULL DEFAULT 'aberta', weight integer NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 5),
  category text, created_by text, source_task_id uuid, universe_item_id uuid,
  completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES public.clients(id),
  title text NOT NULL, description text, assigned_to text[] NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false, completed_at timestamptz, created_by text,
  due_date date, external_url text, modality text NOT NULL DEFAULT 'levantamento',
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta','urgente')),
  priority_id uuid REFERENCES public.priorities(id) ON DELETE SET NULL,
  recurrence text NOT NULL DEFAULT 'none', recurrence_origin_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  scheduled_for date, sort_order integer NOT NULL DEFAULT 0, source_comment_id uuid,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_recurrence_check CHECK (recurrence IN ('none','weekly','monthly')),
  CONSTRAINT tasks_single_assignee_check CHECK (coalesce(cardinality(assigned_to),0) <= 1));
ALTER TABLE public.priorities ADD FOREIGN KEY (source_task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX tasks_recurrence_origin_due_date_key ON public.tasks(recurrence_origin_id, due_date)
  WHERE recurrence_origin_id IS NOT NULL AND due_date IS NOT NULL;

CREATE TABLE public.client_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES public.clients(id),
  comment_text text NOT NULL, author_name text NOT NULL DEFAULT 'x', created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL, assigned_to text[] NOT NULL DEFAULT '{}',
  due_date date, status text NOT NULL DEFAULT 'concluido', created_by text, requester text,
  source_priority_id uuid REFERENCES public.priorities(id) ON DELETE CASCADE,
  completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deliverables_source_priority_id_key UNIQUE (source_priority_id));

CREATE TABLE public.deliverable_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deliverable_id uuid NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('priority','task')), item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_name text, action_type text, entity_type text,
  entity_id uuid, entity_name text, description text, old_value text, new_value text,
  created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE public.task_priority_policies (
  id boolean PRIMARY KEY DEFAULT true CHECK (id), enabled boolean NOT NULL DEFAULT true,
  promotion_after_days integer NOT NULL DEFAULT 45, weight_step_days integer NOT NULL DEFAULT 15,
  maximum_weight integer NOT NULL DEFAULT 5, updated_at timestamptz NOT NULL DEFAULT now(), updated_by text);
INSERT INTO public.task_priority_policies (id) VALUES (true);

-- status operacional (copia de 20261018050305)
CREATE OR REPLACE FUNCTION public.sync_task_operational_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    IF NEW.completed OR NEW.status = 'concluida' THEN NEW.completed := true; NEW.status := 'concluida'; NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSIF NEW.status = 'cancelada' THEN NEW.completed := false; NEW.completed_at := NULL; END IF;
    RETURN NEW;
  END IF;
  IF NEW.completed IS DISTINCT FROM OLD.completed THEN
    IF NEW.completed THEN NEW.status := 'concluida'; NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSE IF NEW.status = 'concluida' THEN NEW.status := 'pendente'; END IF; NEW.completed_at := NULL; END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'concluida' THEN NEW.completed := true; NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSE NEW.completed := false; NEW.completed_at := NULL; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER sync_task_operational_status_trigger BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_task_operational_status();
