-- Add process-related columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS proc_total_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS proc_deferido_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS proc_em_analise_orgao_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS proc_em_analise_ramos_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS proc_notificado_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS proc_reprovado_count integer NOT NULL DEFAULT 0;

-- Create processes table for complete mode
CREATE TABLE IF NOT EXISTS public.processes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  empresa_excel text NOT NULL,
  tipo_processo text,
  numero_processo text,
  data_protocolo date,
  status text NOT NULL DEFAULT 'OUTROS',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- RLS policies for processes
CREATE POLICY "Allow public read access on processes" 
ON public.processes FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on processes" 
ON public.processes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on processes" 
ON public.processes FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on processes" 
ON public.processes FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processes_client_id ON public.processes(client_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);