-- Drop existing permissive policies on processes
DROP POLICY IF EXISTS "Anyone can read processes" ON public.processes;
DROP POLICY IF EXISTS "Anyone can insert processes" ON public.processes;
DROP POLICY IF EXISTS "Anyone can update processes" ON public.processes;
DROP POLICY IF EXISTS "Anyone can delete processes" ON public.processes;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can read processes"
  ON public.processes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert processes"
  ON public.processes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update processes"
  ON public.processes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete processes"
  ON public.processes
  FOR DELETE
  TO authenticated
  USING (true);