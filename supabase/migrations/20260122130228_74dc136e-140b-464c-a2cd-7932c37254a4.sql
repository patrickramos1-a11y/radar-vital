-- Create APT demands table
CREATE TABLE public.apt_demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  setor TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  descricao TEXT NOT NULL,
  feito_responsavel TEXT NOT NULL DEFAULT 'pendente', -- pendente, executado, nao_realizado
  aprovado_gestor TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, nao_aprovado
  repeticoes INTEGER NOT NULL DEFAULT 1,
  semana_limite INTEGER NOT NULL DEFAULT 1, -- 1 a 5
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apt_demands ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for now, matching existing pattern)
CREATE POLICY "Anyone can read apt_demands"
  ON public.apt_demands FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert apt_demands"
  ON public.apt_demands FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update apt_demands"
  ON public.apt_demands FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete apt_demands"
  ON public.apt_demands FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_apt_demands_updated_at
  BEFORE UPDATE ON public.apt_demands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_updated_at();