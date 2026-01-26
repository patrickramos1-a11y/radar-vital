-- Add municipios column to clients table
-- This will store an array of municipalities associated with each client
ALTER TABLE public.clients 
ADD COLUMN municipios text[] DEFAULT '{}'::text[];