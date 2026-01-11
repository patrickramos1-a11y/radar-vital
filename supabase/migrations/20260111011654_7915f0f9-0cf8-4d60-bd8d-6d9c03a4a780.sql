-- Add license aggregate columns to clients table for quick import mode
-- These store counts by validity status (calculated from vencimento date)

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS lic_validas_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lic_proximo_venc_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lic_fora_validade_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lic_proxima_data_vencimento date DEFAULT NULL;

-- Create licenses table for complete import mode (optional storage)
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo_licenca text,
  licenca text,
  num_processo text,
  data_emissao date,
  vencimento date,
  status_calculado text NOT NULL DEFAULT 'VALIDA',
  empresa_excel text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for licenses (public access like other tables)
CREATE POLICY "Allow public read access on licenses" ON public.licenses
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on licenses" ON public.licenses
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on licenses" ON public.licenses
FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on licenses" ON public.licenses
FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_licenses_client_id ON public.licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_vencimento ON public.licenses(vencimento);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status_calculado);