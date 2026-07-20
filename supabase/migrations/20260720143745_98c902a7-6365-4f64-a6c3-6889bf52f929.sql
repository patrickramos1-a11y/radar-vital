
CREATE TABLE public.collaborator_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_name TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT 'observacao',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborator_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborator_comments TO anon;
GRANT ALL ON public.collaborator_comments TO service_role;

ALTER TABLE public.collaborator_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read collaborator_comments" ON public.collaborator_comments FOR SELECT USING (true);
CREATE POLICY "Public insert collaborator_comments" ON public.collaborator_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update collaborator_comments" ON public.collaborator_comments FOR UPDATE USING (true);
CREATE POLICY "Public delete collaborator_comments" ON public.collaborator_comments FOR DELETE USING (true);

CREATE INDEX idx_collab_comments_collaborator ON public.collaborator_comments (collaborator_name);
CREATE INDEX idx_collab_comments_created ON public.collaborator_comments (created_at DESC);

CREATE TRIGGER trg_collab_comments_updated_at
BEFORE UPDATE ON public.collaborator_comments
FOR EACH ROW EXECUTE FUNCTION public.update_collaborators_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.collaborator_comments;
