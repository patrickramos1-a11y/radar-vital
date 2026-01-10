-- Create table for clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  logo_url TEXT,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  processes INTEGER NOT NULL DEFAULT 0,
  licenses INTEGER NOT NULL DEFAULT 0,
  demands_completed INTEGER NOT NULL DEFAULT 0,
  demands_in_progress INTEGER NOT NULL DEFAULT 0,
  demands_not_started INTEGER NOT NULL DEFAULT 0,
  demands_cancelled INTEGER NOT NULL DEFAULT 0,
  collaborator_celine BOOLEAN NOT NULL DEFAULT false,
  collaborator_gabi BOOLEAN NOT NULL DEFAULT false,
  collaborator_darley BOOLEAN NOT NULL DEFAULT false,
  collaborator_vanessa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for this internal tool)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (internal dashboard)
CREATE POLICY "Allow public read access" 
ON public.clients 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Allow public insert access" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Allow public update access" 
ON public.clients 
FOR UPDATE 
USING (true);

-- Create policy for public delete access
CREATE POLICY "Allow public delete access" 
ON public.clients 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_clients_updated_at();

-- Insert initial data with official companies
INSERT INTO public.clients (name, initials, display_order) VALUES
('PHS DA MATA', 'PM', 1),
('PLASNORT - AMAZONPET', 'PA', 2),
('SANTA HELENA', 'SH', 3),
('SIMETRIA / ÍCONE', 'SI', 4),
('GUARÁ', 'GU', 5),
('NORFRUTAS / AÇAÍ PREMIUM', 'NA', 6),
('PARA SUPER FOODS', 'PS', 7),
('BREVES', 'BR', 8),
('NORSUL', 'NO', 9),
('FLORATTA', 'FL', 10),
('NUTRILATINO', 'NU', 11),
('TAPAJÓS', 'TA', 12),
('AÇAÍ VITANAT', 'AV', 13),
('CTC', 'CT', 14),
('DA CASA', 'DC', 15),
('CTC - MANACAPURU', 'CM', 16),
('FAZENDA BRASIL / BARU', 'FB', 17),
('FLOR DE AÇAÍ', 'FA', 18),
('LDV - J.A', 'LJ', 19),
('NATURE AMAZON', 'NA', 20),
('XINGU', 'XI', 21),
('TEU AÇAÍ', 'TA', 22),
('AÇAÍ OKAY', 'AO', 23),
('FROM AMAZÔNIA', 'FA', 24),
('CEIBA', 'CE', 25),
('RAJÁ', 'RA', 26),
('KMTEC', 'KM', 27),
('4 ELEMENTOS', '4E', 28),
('AÇAI KAA', 'AK', 29),
('PRENORTE', 'PR', 30),
('ESTRELA DALVA', 'ED', 31),
('ARRUDÃO', 'AR', 32),
('SC CONSTRUÇÃO', 'SC', 33),
('P S MARTINS LOBATO', 'PM', 34),
('VALE DO AÇAÍ', 'VA', 35),
('100% AMAZÔNIA', '1A', 36),
('OYAMOTA', 'OY', 37),
('POSTO AV. BRASIL', 'PB', 38),
('FARIZA', 'FA', 39);