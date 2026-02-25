ALTER TABLE public.client_comments
  ADD COLUMN reply_to_id uuid REFERENCES public.client_comments(id) ON DELETE SET NULL;