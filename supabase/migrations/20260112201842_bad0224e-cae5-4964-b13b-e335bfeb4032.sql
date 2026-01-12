-- Create client_comments table
CREATE TABLE public.client_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Patrick',
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster queries
CREATE INDEX idx_client_comments_client_id ON public.client_comments(client_id);
CREATE INDEX idx_client_comments_created_at ON public.client_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read comments"
ON public.client_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON public.client_comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update comments"
ON public.client_comments
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete comments"
ON public.client_comments
FOR DELETE
USING (true);

-- Add comment_count column to clients for faster filtering
ALTER TABLE public.clients ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update comment count
CREATE OR REPLACE FUNCTION public.update_client_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients SET comment_count = comment_count + 1 WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients SET comment_count = comment_count - 1 WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to auto-update comment count
CREATE TRIGGER update_comment_count_trigger
AFTER INSERT OR DELETE ON public.client_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_client_comment_count();