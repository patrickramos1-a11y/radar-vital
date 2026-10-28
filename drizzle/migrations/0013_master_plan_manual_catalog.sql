CREATE TABLE public.master_plan_manual_catalog_source (
  catalog_key text PRIMARY KEY CHECK (catalog_key = 'responsabilidades-v9'),
  source_file text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.master_plan_manual_items (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('nucleus', 'sector', 'area', 'function', 'responsibility', 'competency', 'capability')),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  classification text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  nucleus_id text REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  sector_id text REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  area_id text REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  primary_function_id text REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  official_source_id text NOT NULL DEFAULT '',
  nature text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(requirements) = 'array'),
  levels jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(levels) = 'array')
);

CREATE INDEX master_plan_manual_items_kind ON public.master_plan_manual_items(kind);
CREATE INDEX master_plan_manual_items_nucleus ON public.master_plan_manual_items(nucleus_id);
CREATE INDEX master_plan_manual_items_sector ON public.master_plan_manual_items(sector_id);

CREATE TABLE public.master_plan_manual_links (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('sector_competency', 'function_sector', 'function_responsibility', 'responsibility_competency')),
  from_id text NOT NULL REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  to_id text NOT NULL REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  classification text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
  UNIQUE (kind, from_id, to_id)
);

CREATE INDEX master_plan_manual_links_from ON public.master_plan_manual_links(from_id);
CREATE INDEX master_plan_manual_links_to ON public.master_plan_manual_links(to_id);

CREATE TABLE public.master_plan_manual_sector_aliases (
  normalized_alias text PRIMARY KEY,
  sector_id text NOT NULL REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE public.master_plan_manual_essential_functions (
  sector_id text NOT NULL REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  function_id text NOT NULL REFERENCES public.master_plan_manual_items(id) DEFERRABLE INITIALLY DEFERRED,
  display_order smallint NOT NULL CHECK (display_order > 0),
  PRIMARY KEY (sector_id, function_id),
  UNIQUE (sector_id, display_order)
);

ALTER TABLE public.master_plan_manual_catalog_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_plan_manual_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_plan_manual_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_plan_manual_sector_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_plan_manual_essential_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY master_plan_manual_source_read ON public.master_plan_manual_catalog_source
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY master_plan_manual_items_read ON public.master_plan_manual_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY master_plan_manual_links_read ON public.master_plan_manual_links
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY master_plan_manual_sector_aliases_read ON public.master_plan_manual_sector_aliases
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY master_plan_manual_essential_functions_read ON public.master_plan_manual_essential_functions
  FOR SELECT TO anon, authenticated USING (true);

REVOKE ALL ON public.master_plan_manual_catalog_source, public.master_plan_manual_items,
  public.master_plan_manual_links, public.master_plan_manual_sector_aliases,
  public.master_plan_manual_essential_functions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.master_plan_manual_catalog_source, public.master_plan_manual_items,
  public.master_plan_manual_links, public.master_plan_manual_sector_aliases,
  public.master_plan_manual_essential_functions TO anon, authenticated;
