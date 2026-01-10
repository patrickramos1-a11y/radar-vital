-- Create demand status enum
CREATE TYPE public.demand_status AS ENUM ('CONCLUIDO', 'EM_EXECUCAO', 'NAO_FEITO', 'CANCELADO');

-- Create demands table
CREATE TABLE public.demands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT,
  data DATE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  empresa_excel TEXT NOT NULL,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  status demand_status NOT NULL DEFAULT 'NAO_FEITO',
  topico TEXT,
  subtopico TEXT,
  plano TEXT,
  comentario TEXT,
  origem TEXT,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on codigo to detect duplicates
CREATE UNIQUE INDEX demands_codigo_unique ON public.demands(codigo) WHERE codigo IS NOT NULL AND codigo != '';

-- Enable Row Level Security
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Allow public read access on demands"
ON public.demands
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access on demands"
ON public.demands
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access on demands"
ON public.demands
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access on demands"
ON public.demands
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_demands_updated_at
BEFORE UPDATE ON public.demands
FOR EACH ROW
EXECUTE FUNCTION public.update_clients_updated_at();

-- Create function to recalculate client demand counts
CREATE OR REPLACE FUNCTION public.recalculate_client_demands(p_client_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_completed INT;
  v_in_progress INT;
  v_not_started INT;
  v_cancelled INT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'CONCLUIDO'),
    COUNT(*) FILTER (WHERE status = 'EM_EXECUCAO'),
    COUNT(*) FILTER (WHERE status = 'NAO_FEITO'),
    COUNT(*) FILTER (WHERE status = 'CANCELADO')
  INTO v_completed, v_in_progress, v_not_started, v_cancelled
  FROM public.demands
  WHERE client_id = p_client_id;

  UPDATE public.clients
  SET 
    demands_completed = COALESCE(v_completed, 0),
    demands_in_progress = COALESCE(v_in_progress, 0),
    demands_not_started = COALESCE(v_not_started, 0),
    demands_cancelled = COALESCE(v_cancelled, 0)
  WHERE id = p_client_id;
END;
$$;