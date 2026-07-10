CREATE TABLE public.deliverable_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  rater_name TEXT NOT NULL,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('thumbs','star','superstar')),
  value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id, rater_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliverable_ratings TO anon, authenticated;
GRANT ALL ON public.deliverable_ratings TO service_role;

ALTER TABLE public.deliverable_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read deliverable_ratings" ON public.deliverable_ratings FOR SELECT USING (true);
CREATE POLICY "Public insert deliverable_ratings" ON public.deliverable_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update deliverable_ratings" ON public.deliverable_ratings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete deliverable_ratings" ON public.deliverable_ratings FOR DELETE USING (true);

CREATE TRIGGER update_deliverable_ratings_updated_at
BEFORE UPDATE ON public.deliverable_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_collaborators_updated_at();

CREATE INDEX idx_deliverable_ratings_deliverable ON public.deliverable_ratings(deliverable_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_ratings;