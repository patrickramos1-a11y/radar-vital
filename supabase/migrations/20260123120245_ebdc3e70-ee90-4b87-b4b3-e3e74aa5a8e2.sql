-- Drop existing permissive policies on clients
DROP POLICY IF EXISTS "Anyone can read clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON public.clients;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can read clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (true);