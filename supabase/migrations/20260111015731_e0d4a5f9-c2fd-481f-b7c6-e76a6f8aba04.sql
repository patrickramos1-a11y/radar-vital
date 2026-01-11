-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy for user_roles: only admins can manage roles, users can see their own
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop all public policies on clients
DROP POLICY IF EXISTS "Allow public read access" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert access" ON public.clients;
DROP POLICY IF EXISTS "Allow public update access" ON public.clients;
DROP POLICY IF EXISTS "Allow public delete access" ON public.clients;

-- Drop all public policies on demands
DROP POLICY IF EXISTS "Allow public read access on demands" ON public.demands;
DROP POLICY IF EXISTS "Allow public insert access on demands" ON public.demands;
DROP POLICY IF EXISTS "Allow public update access on demands" ON public.demands;
DROP POLICY IF EXISTS "Allow public delete access on demands" ON public.demands;

-- Drop all public policies on tasks
DROP POLICY IF EXISTS "Allow public read access on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete access on tasks" ON public.tasks;

-- Drop all public policies on licenses
DROP POLICY IF EXISTS "Allow public read access on licenses" ON public.licenses;
DROP POLICY IF EXISTS "Allow public insert access on licenses" ON public.licenses;
DROP POLICY IF EXISTS "Allow public update access on licenses" ON public.licenses;
DROP POLICY IF EXISTS "Allow public delete access on licenses" ON public.licenses;

-- Drop all public policies on processes
DROP POLICY IF EXISTS "Allow public read access on processes" ON public.processes;
DROP POLICY IF EXISTS "Allow public insert access on processes" ON public.processes;
DROP POLICY IF EXISTS "Allow public update access on processes" ON public.processes;
DROP POLICY IF EXISTS "Allow public delete access on processes" ON public.processes;

-- Create authenticated-only policies for clients
CREATE POLICY "Authenticated users can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (true);

-- Create authenticated-only policies for demands
CREATE POLICY "Authenticated users can read demands"
  ON public.demands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert demands"
  ON public.demands FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update demands"
  ON public.demands FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete demands"
  ON public.demands FOR DELETE
  TO authenticated
  USING (true);

-- Create authenticated-only policies for tasks
CREATE POLICY "Authenticated users can read tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create authenticated-only policies for licenses
CREATE POLICY "Authenticated users can read licenses"
  ON public.licenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert licenses"
  ON public.licenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update licenses"
  ON public.licenses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete licenses"
  ON public.licenses FOR DELETE
  TO authenticated
  USING (true);

-- Create authenticated-only policies for processes
CREATE POLICY "Authenticated users can read processes"
  ON public.processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert processes"
  ON public.processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update processes"
  ON public.processes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete processes"
  ON public.processes FOR DELETE
  TO authenticated
  USING (true);