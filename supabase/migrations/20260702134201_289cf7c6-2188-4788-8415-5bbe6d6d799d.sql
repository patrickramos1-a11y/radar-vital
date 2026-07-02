
-- 1) priorities table
CREATE TABLE public.priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to TEXT[] NOT NULL DEFAULT '{}',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'aberta',
  weight INTEGER NOT NULL DEFAULT 3,
  category TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT priorities_status_check CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
  CONSTRAINT priorities_weight_check CHECK (weight BETWEEN 1 AND 5)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.priorities TO anon, authenticated;
GRANT ALL ON public.priorities TO service_role;
ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read priorities" ON public.priorities FOR SELECT USING (true);
CREATE POLICY "Public insert priorities" ON public.priorities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update priorities" ON public.priorities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete priorities" ON public.priorities FOR DELETE USING (true);

CREATE TRIGGER priorities_updated_at
BEFORE UPDATE ON public.priorities
FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at();

CREATE INDEX idx_priorities_client ON public.priorities(client_id);
CREATE INDEX idx_priorities_status ON public.priorities(status);

-- 2) deliverables
CREATE TABLE public.deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT[] NOT NULL DEFAULT '{}',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT deliverables_status_check CHECK (status IN ('aberto','em_andamento','concluido','cancelado'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliverables TO anon, authenticated;
GRANT ALL ON public.deliverables TO service_role;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read deliverables" ON public.deliverables FOR SELECT USING (true);
CREATE POLICY "Public insert deliverables" ON public.deliverables FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update deliverables" ON public.deliverables FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete deliverables" ON public.deliverables FOR DELETE USING (true);

CREATE TRIGGER deliverables_updated_at
BEFORE UPDATE ON public.deliverables
FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at();

-- 3) deliverable_items (N:N)
CREATE TABLE public.deliverable_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT deliverable_items_type_check CHECK (item_type IN ('priority','task')),
  UNIQUE(deliverable_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliverable_items TO anon, authenticated;
GRANT ALL ON public.deliverable_items TO service_role;
ALTER TABLE public.deliverable_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read deliverable_items" ON public.deliverable_items FOR SELECT USING (true);
CREATE POLICY "Public insert deliverable_items" ON public.deliverable_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update deliverable_items" ON public.deliverable_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete deliverable_items" ON public.deliverable_items FOR DELETE USING (true);

CREATE INDEX idx_deliverable_items_deliv ON public.deliverable_items(deliverable_id);
CREATE INDEX idx_deliverable_items_item ON public.deliverable_items(item_type, item_id);

-- 4) tasks.priority_id
ALTER TABLE public.tasks ADD COLUMN priority_id UUID REFERENCES public.priorities(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_priority_id ON public.tasks(priority_id);
