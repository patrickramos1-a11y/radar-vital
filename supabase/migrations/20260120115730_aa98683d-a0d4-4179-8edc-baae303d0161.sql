-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  empresa_excel TEXT NOT NULL,
  numero_processo TEXT,
  numero_notificacao TEXT NOT NULL,
  descricao TEXT,
  data_recebimento DATE,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('ATENDIDA', 'PENDENTE')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice único para evitar duplicações (empresa + número da notificação)
CREATE UNIQUE INDEX idx_notifications_unique ON public.notifications(empresa_excel, numero_notificacao);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (mesmo padrão das outras tabelas)
CREATE POLICY "Anyone can read notifications" 
ON public.notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (true);

-- Adicionar colunas de contagem de notificações na tabela clients
ALTER TABLE public.clients 
ADD COLUMN notif_total_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN notif_pendente_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN notif_atendida_count INTEGER NOT NULL DEFAULT 0;

-- Criar função para recalcular contagens de notificações de um cliente
CREATE OR REPLACE FUNCTION public.recalculate_client_notifications(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total INT;
  v_pendente INT;
  v_atendida INT;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'PENDENTE'),
    COUNT(*) FILTER (WHERE status = 'ATENDIDA')
  INTO v_total, v_pendente, v_atendida
  FROM public.notifications
  WHERE client_id = p_client_id;

  UPDATE public.clients
  SET 
    notif_total_count = COALESCE(v_total, 0),
    notif_pendente_count = COALESCE(v_pendente, 0),
    notif_atendida_count = COALESCE(v_atendida, 0)
  WHERE id = p_client_id;
END;
$$;