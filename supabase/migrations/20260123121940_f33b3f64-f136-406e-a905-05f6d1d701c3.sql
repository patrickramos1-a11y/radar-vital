-- Create collaborators table to manage team members
CREATE TABLE public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  initials TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Create policies for collaborators (accessible to authenticated users)
CREATE POLICY "Authenticated users can read collaborators"
  ON public.collaborators
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert collaborators"
  ON public.collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update collaborators"
  ON public.collaborators
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete collaborators"
  ON public.collaborators
  FOR DELETE
  TO authenticated
  USING (true);

-- Create profiles table for user metadata
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default collaborators (matching current system)
INSERT INTO public.collaborators (name, email, color, initials) VALUES
  ('Patrick', NULL, '#6366f1', 'PA'),
  ('Celine', NULL, '#ec4899', 'CE'),
  ('Gabi', NULL, '#f97316', 'GA'),
  ('Darley', NULL, '#22c55e', 'DA'),
  ('Vanessa', NULL, '#8b5cf6', 'VA');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_collaborators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collaborators_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collaborators_updated_at();

-- Revert clients table to allow authenticated access (fix current issue)
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

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