-- Drop existing permissive policies on activity_logs
DROP POLICY IF EXISTS "Anyone can read activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity_logs" ON public.activity_logs;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can read activity_logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity_logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);