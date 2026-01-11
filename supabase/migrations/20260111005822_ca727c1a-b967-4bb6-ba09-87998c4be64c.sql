-- Create tasks table for operational checklist
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to TEXT CHECK (assigned_to IN ('celine', 'gabi', 'darley', 'vanessa') OR assigned_to IS NULL),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
CREATE POLICY "Allow public read access on tasks"
  ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on tasks"
  ON public.tasks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on tasks"
  ON public.tasks FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on tasks"
  ON public.tasks FOR DELETE USING (true);

-- Create index for faster queries by client
CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);

-- Create index for filtering by completion status
CREATE INDEX idx_tasks_completed ON public.tasks(completed);

-- Create index for filtering by assigned collaborator
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);