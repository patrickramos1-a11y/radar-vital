-- Add client_type column (AC = Acompanhamento, AV = Avulso)
ALTER TABLE public.clients 
ADD COLUMN client_type text NOT NULL DEFAULT 'AC' CHECK (client_type IN ('AC', 'AV'));

-- Add is_highlighted column to persist highlight state
ALTER TABLE public.clients 
ADD COLUMN is_highlighted boolean NOT NULL DEFAULT false;