
-- 1) Add photo_url to collaborators
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2) Storage policies for collaborator-photos (anon+authenticated read/write since app uses local click-to-select auth)
DO $$ BEGIN
  DROP POLICY IF EXISTS "cph_read" ON storage.objects;
  DROP POLICY IF EXISTS "cph_insert" ON storage.objects;
  DROP POLICY IF EXISTS "cph_update" ON storage.objects;
  DROP POLICY IF EXISTS "cph_delete" ON storage.objects;
END $$;

CREATE POLICY "cph_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'collaborator-photos');
CREATE POLICY "cph_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'collaborator-photos');
CREATE POLICY "cph_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'collaborator-photos');
CREATE POLICY "cph_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'collaborator-photos');
