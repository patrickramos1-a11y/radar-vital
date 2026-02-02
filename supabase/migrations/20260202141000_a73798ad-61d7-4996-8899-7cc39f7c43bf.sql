-- Add condicionantes counts to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS cond_atendidas_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cond_a_vencer_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cond_vencidas_count integer NOT NULL DEFAULT 0;

-- Create function to recalculate client condicionantes
CREATE OR REPLACE FUNCTION public.recalculate_client_condicionantes(p_client_id uuid)
RETURNS void AS $$
BEGIN
  -- This function can be extended to recalculate from a condicionantes table if created
  -- For now, it's a placeholder for the import to use direct updates
  NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_cond_counts ON public.clients (cond_atendidas_count, cond_a_vencer_count, cond_vencidas_count);