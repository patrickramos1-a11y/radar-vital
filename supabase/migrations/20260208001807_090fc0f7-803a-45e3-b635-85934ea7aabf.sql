
-- Create panel_links table for managing navigation links between panels
CREATE TABLE public.panel_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  panel_type TEXT NOT NULL DEFAULT 'Operacional',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.panel_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read active panel links (no auth required for reading)
CREATE POLICY "Anyone can view panel links"
  ON public.panel_links
  FOR SELECT
  USING (true);

-- Only authenticated users can manage panel links
CREATE POLICY "Authenticated users can insert panel links"
  ON public.panel_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update panel links"
  ON public.panel_links
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete panel links"
  ON public.panel_links
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_panel_links_updated_at
  BEFORE UPDATE ON public.panel_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_updated_at();

-- Insert default panel links
INSERT INTO public.panel_links (name, url, panel_type, display_order, description) VALUES
  ('Painel PT', '', 'Operacional', 1, 'Painel de Permissão de Trabalho'),
  ('Distribuição de Serviços', '', 'Operacional', 2, 'Painel de distribuição e alocação de serviços'),
  ('Boletim Ambiental', '', 'Relatório', 3, 'Painel do Boletim Ambiental'),
  ('Diagnóstico Ambiental', '', 'Diagnóstico', 4, 'Painel de Diagnóstico Ambiental'),
  ('Projetos', '', 'Estratégico', 5, 'Painel de acompanhamento de Projetos'),
  ('Ficha de Serviços', '', 'Operacional', 6, 'Painel da Ficha de Serviços');
