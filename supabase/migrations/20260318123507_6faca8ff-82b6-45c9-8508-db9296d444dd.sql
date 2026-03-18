
-- Drop tables that are no longer used (data already deleted)
DROP TABLE IF EXISTS public.demands CASCADE;
DROP TABLE IF EXISTS public.processes CASCADE;
DROP TABLE IF EXISTS public.licenses CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.apt_demands CASCADE;

-- Drop related functions that reference these tables
DROP FUNCTION IF EXISTS public.recalculate_client_demands(uuid);
DROP FUNCTION IF EXISTS public.recalculate_client_notifications(uuid);
DROP FUNCTION IF EXISTS public.recalculate_client_condicionantes(uuid);
