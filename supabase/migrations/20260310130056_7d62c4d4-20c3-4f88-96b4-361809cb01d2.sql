
-- Junction table for client-collaborator assignments
CREATE TABLE public.client_collaborator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, collaborator_id)
);

ALTER TABLE public.client_collaborator_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read client_collaborator_assignments" ON public.client_collaborator_assignments FOR SELECT TO public USING (true);
CREATE POLICY "Public insert client_collaborator_assignments" ON public.client_collaborator_assignments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public delete client_collaborator_assignments" ON public.client_collaborator_assignments FOR DELETE TO public USING (true);
CREATE POLICY "Public update client_collaborator_assignments" ON public.client_collaborator_assignments FOR UPDATE TO public USING (true);

-- Migrate existing boolean assignments to junction table
INSERT INTO public.client_collaborator_assignments (client_id, collaborator_id)
SELECT c.id, col.id
FROM public.clients c
CROSS JOIN public.collaborators col
WHERE
  (LOWER(col.name) LIKE 'celine%' AND c.collaborator_celine = true) OR
  (LOWER(col.name) LIKE 'gabi%' AND c.collaborator_gabi = true) OR
  (LOWER(col.name) LIKE 'darley%' AND c.collaborator_darley = true) OR
  (LOWER(col.name) LIKE 'vanessa%' AND c.collaborator_vanessa = true)
ON CONFLICT DO NOTHING;

-- Backfill read_timestamps on existing comments from legacy boolean columns
UPDATE public.client_comments
SET read_timestamps = (
  COALESCE(read_timestamps, '{}'::jsonb) ||
  CASE WHEN read_celine THEN jsonb_build_object('Celine', created_at::text) ELSE '{}'::jsonb END ||
  CASE WHEN read_gabi THEN jsonb_build_object('Gabi', created_at::text) ELSE '{}'::jsonb END ||
  CASE WHEN read_darley THEN jsonb_build_object('Darley', created_at::text) ELSE '{}'::jsonb END ||
  CASE WHEN read_vanessa THEN jsonb_build_object('Vanessa', created_at::text) ELSE '{}'::jsonb END ||
  CASE WHEN read_patrick THEN jsonb_build_object('Patrick', created_at::text) ELSE '{}'::jsonb END
)
WHERE read_celine OR read_gabi OR read_darley OR read_vanessa OR read_patrick;
