-- Drop existing permissive policy on app_users
DROP POLICY IF EXISTS "Anyone can read app_users" ON public.app_users;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can read app_users"
  ON public.app_users
  FOR SELECT
  TO authenticated
  USING (true);