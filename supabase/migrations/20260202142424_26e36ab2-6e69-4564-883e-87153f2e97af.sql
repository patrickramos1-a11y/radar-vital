-- Add columns for notification items status aggregation (for dashboard)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS notif_item_atendido_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS notif_item_pendente_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS notif_item_vencido_count integer NOT NULL DEFAULT 0;

-- Create indexes for better dashboard performance
CREATE INDEX IF NOT EXISTS idx_clients_notif_item_atendido ON public.clients(notif_item_atendido_count);
CREATE INDEX IF NOT EXISTS idx_clients_notif_item_pendente ON public.clients(notif_item_pendente_count);
CREATE INDEX IF NOT EXISTS idx_clients_notif_item_vencido ON public.clients(notif_item_vencido_count);