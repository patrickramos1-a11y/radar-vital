-- =============================================
-- BACKLOG DE PRODUTO - SISTEMA RADAR-VITAL
-- =============================================

-- Tabela principal: backlog_items
CREATE TABLE public.backlog_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  categoria text NOT NULL,
  modulos_impactados text[] NOT NULL DEFAULT '{}',
  descricao_detalhada text,
  status_backlog text NOT NULL DEFAULT 'IDEIA',
  prioridade text NOT NULL DEFAULT 'MEDIA',
  impacto_esperado text NOT NULL DEFAULT 'MEDIO',
  estimativa_esforco text NOT NULL DEFAULT 'MEDIO',
  dependente_de_creditos boolean NOT NULL DEFAULT false,
  responsavel_produto text NOT NULL,
  responsavel_tecnico text,
  data_criacao timestamptz NOT NULL DEFAULT now(),
  data_inicio_implementacao date,
  data_conclusao date,
  data_lancamento date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints para validar valores
  CONSTRAINT backlog_categoria_check CHECK (categoria IN (
    'NOVA_FUNCIONALIDADE',
    'MELHORIA_EXISTENTE',
    'CORRECAO_BUG',
    'AJUSTE_TECNICO',
    'UX_UI_VISUAL',
    'RELATORIOS',
    'SEGURANCA',
    'INFRAESTRUTURA'
  )),
  CONSTRAINT backlog_status_check CHECK (status_backlog IN (
    'IDEIA',
    'EM_ANALISE',
    'REFINADO',
    'AGUARDANDO_CREDITOS',
    'EM_IMPLEMENTACAO',
    'EM_TESTES',
    'IMPLEMENTADO',
    'LANCADO',
    'ARQUIVADO'
  )),
  CONSTRAINT backlog_prioridade_check CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA')),
  CONSTRAINT backlog_impacto_check CHECK (impacto_esperado IN ('BAIXO', 'MEDIO', 'ALTO')),
  CONSTRAINT backlog_esforco_check CHECK (estimativa_esforco IN ('PEQUENO', 'MEDIO', 'GRANDE'))
);

-- Tabela de anexos
CREATE TABLE public.backlog_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id uuid NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  uploaded_by text NOT NULL DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de histórico (imutável)
CREATE TABLE public.backlog_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id uuid NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text NOT NULL,
  user_name text NOT NULL DEFAULT 'Sistema',
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT backlog_history_event_type_check CHECK (event_type IN (
    'CREATED',
    'STATUS_CHANGED',
    'ATTACHMENT_ADDED',
    'ATTACHMENT_REMOVED',
    'PRIORITY_CHANGED',
    'DATE_CHANGED',
    'MARKED_IMPLEMENTED',
    'MARKED_LAUNCHED',
    'IMPLEMENTATION_ADDED',
    'IMPLEMENTATION_REMOVED',
    'FIELD_UPDATED'
  ))
);

-- Tabela de implementações
CREATE TABLE public.backlog_implementations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backlog_item_id uuid NOT NULL REFERENCES public.backlog_items(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  responsavel text NOT NULL,
  status text NOT NULL DEFAULT 'NAO_EXECUTADO',
  data_execucao date,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT backlog_impl_status_check CHECK (status IN ('EXECUTADO', 'NAO_EXECUTADO'))
);

-- Enable RLS on all tables
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_implementations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backlog_items (public access)
CREATE POLICY "Public read backlog_items" ON public.backlog_items
  FOR SELECT USING (true);

CREATE POLICY "Public insert backlog_items" ON public.backlog_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update backlog_items" ON public.backlog_items
  FOR UPDATE USING (true);

CREATE POLICY "Public delete backlog_items" ON public.backlog_items
  FOR DELETE USING (true);

-- RLS Policies for backlog_attachments
CREATE POLICY "Public read backlog_attachments" ON public.backlog_attachments
  FOR SELECT USING (true);

CREATE POLICY "Public insert backlog_attachments" ON public.backlog_attachments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete backlog_attachments" ON public.backlog_attachments
  FOR DELETE USING (true);

-- RLS Policies for backlog_history (read-only, insert only)
CREATE POLICY "Public read backlog_history" ON public.backlog_history
  FOR SELECT USING (true);

CREATE POLICY "Public insert backlog_history" ON public.backlog_history
  FOR INSERT WITH CHECK (true);
-- Note: No UPDATE or DELETE policies - history is immutable

-- RLS Policies for backlog_implementations
CREATE POLICY "Public read backlog_implementations" ON public.backlog_implementations
  FOR SELECT USING (true);

CREATE POLICY "Public insert backlog_implementations" ON public.backlog_implementations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update backlog_implementations" ON public.backlog_implementations
  FOR UPDATE USING (true);

CREATE POLICY "Public delete backlog_implementations" ON public.backlog_implementations
  FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_backlog_items_updated_at
  BEFORE UPDATE ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_updated_at();

-- Create storage bucket for backlog files
INSERT INTO storage.buckets (id, name, public)
VALUES ('backlog-files', 'backlog-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for backlog-files bucket
CREATE POLICY "Public read backlog files" ON storage.objects
  FOR SELECT USING (bucket_id = 'backlog-files');

CREATE POLICY "Public insert backlog files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'backlog-files');

CREATE POLICY "Public delete backlog files" ON storage.objects
  FOR DELETE USING (bucket_id = 'backlog-files');

-- Create indexes for better query performance
CREATE INDEX idx_backlog_items_status ON public.backlog_items(status_backlog);
CREATE INDEX idx_backlog_items_categoria ON public.backlog_items(categoria);
CREATE INDEX idx_backlog_items_prioridade ON public.backlog_items(prioridade);
CREATE INDEX idx_backlog_items_creditos ON public.backlog_items(dependente_de_creditos);
CREATE INDEX idx_backlog_history_item ON public.backlog_history(backlog_item_id);
CREATE INDEX idx_backlog_attachments_item ON public.backlog_attachments(backlog_item_id);
CREATE INDEX idx_backlog_implementations_item ON public.backlog_implementations(backlog_item_id);