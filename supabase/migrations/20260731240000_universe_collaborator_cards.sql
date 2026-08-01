-- A collaborator profile may back at most one Universo Ramos card.
-- Keeping this in the database protects against duplicate links from multiple sessions.
CREATE UNIQUE INDEX IF NOT EXISTS clients_universe_collaborator_card_unique
  ON public.clients (universe_collaborator_id)
  WHERE client_type = 'UNIVERSO_RAMOS'
    AND universe_category = 'COLABORADOR'
    AND universe_collaborator_id IS NOT NULL;
