
-- Create municipalities table
CREATE TABLE public.municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on name + state
ALTER TABLE public.municipalities ADD CONSTRAINT municipalities_name_state_unique UNIQUE (name, state);

-- Enable RLS
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

-- Permissive policies (public access like other tables)
CREATE POLICY "Public can read municipalities" ON public.municipalities FOR SELECT USING (true);
CREATE POLICY "Public can insert municipalities" ON public.municipalities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update municipalities" ON public.municipalities FOR UPDATE USING (true);
CREATE POLICY "Public can delete municipalities" ON public.municipalities FOR DELETE USING (true);

-- Pre-populate with Pará municipalities (main ones)
INSERT INTO public.municipalities (name, state) VALUES
  ('Abaetetuba', 'PA'),
  ('Abel Figueiredo', 'PA'),
  ('Acará', 'PA'),
  ('Afuá', 'PA'),
  ('Água Azul do Norte', 'PA'),
  ('Alenquer', 'PA'),
  ('Almeirim', 'PA'),
  ('Altamira', 'PA'),
  ('Ananindeua', 'PA'),
  ('Augusto Corrêa', 'PA'),
  ('Aurora do Pará', 'PA'),
  ('Barcarena', 'PA'),
  ('Belém', 'PA'),
  ('Benevides', 'PA'),
  ('Bragança', 'PA'),
  ('Breves', 'PA'),
  ('Breu Branco', 'PA'),
  ('Cametá', 'PA'),
  ('Canaã dos Carajás', 'PA'),
  ('Capanema', 'PA'),
  ('Capitão Poço', 'PA'),
  ('Castanhal', 'PA'),
  ('Conceição do Araguaia', 'PA'),
  ('Curionópolis', 'PA'),
  ('Dom Eliseu', 'PA'),
  ('Eldorado dos Carajás', 'PA'),
  ('Garrafão do Norte', 'PA'),
  ('Goianésia do Pará', 'PA'),
  ('Igarapé-Açu', 'PA'),
  ('Igarapé-Miri', 'PA'),
  ('Ipixuna do Pará', 'PA'),
  ('Itaituba', 'PA'),
  ('Itupiranga', 'PA'),
  ('Jacundá', 'PA'),
  ('Juruti', 'PA'),
  ('Marabá', 'PA'),
  ('Marituba', 'PA'),
  ('Mocajuba', 'PA'),
  ('Moju', 'PA'),
  ('Monte Alegre', 'PA'),
  ('Novo Progresso', 'PA'),
  ('Novo Repartimento', 'PA'),
  ('Óbidos', 'PA'),
  ('Oriximiná', 'PA'),
  ('Ourilândia do Norte', 'PA'),
  ('Paragominas', 'PA'),
  ('Parauapebas', 'PA'),
  ('Redenção', 'PA'),
  ('Rio Maria', 'PA'),
  ('Rondon do Pará', 'PA'),
  ('Salinópolis', 'PA'),
  ('Santa Isabel do Pará', 'PA'),
  ('Santa Maria do Pará', 'PA'),
  ('Santana do Araguaia', 'PA'),
  ('Santarém', 'PA'),
  ('São Domingos do Araguaia', 'PA'),
  ('São Félix do Xingu', 'PA'),
  ('São Geraldo do Araguaia', 'PA'),
  ('São João de Pirabas', 'PA'),
  ('São Miguel do Guamá', 'PA'),
  ('Tailândia', 'PA'),
  ('Tomé-Açu', 'PA'),
  ('Tucumã', 'PA'),
  ('Tucuruí', 'PA'),
  ('Ulianópolis', 'PA'),
  ('Uruará', 'PA'),
  ('Vigia', 'PA'),
  ('Viseu', 'PA'),
  ('Xinguara', 'PA');
