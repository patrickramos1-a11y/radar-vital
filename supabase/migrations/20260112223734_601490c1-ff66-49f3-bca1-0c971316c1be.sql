-- Criar tabela de usuários simples para o sistema de login por nome
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir os 5 usuários fixos
INSERT INTO public.app_users (name, display_name) VALUES
  ('patrick', 'Patrick'),
  ('celine', 'Celine'),
  ('gabi', 'Gabi'),
  ('darley', 'Darley'),
  ('vanessa', 'Vanessa');

-- Habilitar RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um autenticado pode ler
CREATE POLICY "Anyone can read app_users"
ON public.app_users
FOR SELECT
USING (true);

-- Criar tabela de log de atividades/notificações
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um autenticado pode ler e inserir
CREATE POLICY "Authenticated users can read activity_logs"
ON public.activity_logs
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert activity_logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Habilitar realtime para activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;