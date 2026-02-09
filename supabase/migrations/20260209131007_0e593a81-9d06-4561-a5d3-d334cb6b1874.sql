
-- Drop restrictive policies for INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Authenticated users can insert panel links" ON public.panel_links;
DROP POLICY IF EXISTS "Authenticated users can update panel links" ON public.panel_links;
DROP POLICY IF EXISTS "Authenticated users can delete panel links" ON public.panel_links;

-- Create permissive policies
CREATE POLICY "Public can insert panel links" ON public.panel_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update panel links" ON public.panel_links FOR UPDATE USING (true);
CREATE POLICY "Public can delete panel links" ON public.panel_links FOR DELETE USING (true);
