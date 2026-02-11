
CREATE TABLE public.backlog_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id UUID NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backlog_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read backlog_messages" ON public.backlog_messages FOR SELECT USING (true);
CREATE POLICY "Public insert backlog_messages" ON public.backlog_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update backlog_messages" ON public.backlog_messages FOR UPDATE USING (true);
CREATE POLICY "Public delete backlog_messages" ON public.backlog_messages FOR DELETE USING (true);

CREATE INDEX idx_backlog_messages_item_id ON public.backlog_messages(backlog_item_id);
CREATE INDEX idx_backlog_messages_created_at ON public.backlog_messages(created_at);
