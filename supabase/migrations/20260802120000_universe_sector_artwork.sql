BEGIN;

-- The sector artwork is deployed with the Vite application under /universe-sectors.
-- Keep existing names intact, including the legacy BRINDES card, while assigning
-- the same visual identity as BRINDES E PAPELARIA.
WITH sector_artwork(name, logo_url) AS (
  VALUES
    ('ADMINISTRAÇÃO', '/universe-sectors/02-administracao.png'),
    ('BRINDES', '/universe-sectors/11-brindes-e-papelaria.png'),
    ('BRINDES E PAPELARIA', '/universe-sectors/11-brindes-e-papelaria.png'),
    ('GESTÃO E PLANEJAMENTO', '/universe-sectors/06-gestao-e-planejamento.png'),
    ('IA E AUTOMAÇÃO', '/universe-sectors/10-ia-e-automacao.png'),
    ('LICENCIAMENTO E PROCESSOS', '/universe-sectors/05-licenciamento-e-processos.png'),
    ('MANUTENÇÃO', '/universe-sectors/03-manutencao.png'),
    ('MARKETING', '/universe-sectors/01-marketing.png'),
    ('PESSOAS E CULTURA', '/universe-sectors/08-pessoas-e-cultura.png'),
    ('SETOR DE PROJETOS', '/universe-sectors/04-setor-de-projetos.png'),
    ('SUPRIMENTOS E COMPRAS', '/universe-sectors/07-suprimentos-e-compras.png'),
    ('TREINAMENTOS', '/universe-sectors/09-treinamentos.png')
)
UPDATE public.clients AS client
SET logo_url = artwork.logo_url,
    updated_at = now()
FROM sector_artwork AS artwork
WHERE client.client_type = 'UNIVERSO_RAMOS'
  AND client.universe_category = 'SETOR'
  AND upper(btrim(client.name)) = artwork.name;

-- Persist an initial alphabetical order for sector records. The interface also
-- enforces category grouping and alphabetical order, so this remains stable in
-- exports and any future server-side query that uses display_order.
WITH ranked_sectors AS (
  SELECT
    id,
    row_number() OVER (ORDER BY name COLLATE "default")::INTEGER AS display_order
  FROM public.clients
  WHERE client_type = 'UNIVERSO_RAMOS'
    AND universe_category = 'SETOR'
    AND is_active = TRUE
)
UPDATE public.clients AS client
SET display_order = ranked.display_order,
    updated_at = now()
FROM ranked_sectors AS ranked
WHERE client.id = ranked.id;

COMMIT;
