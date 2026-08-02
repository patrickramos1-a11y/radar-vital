BEGIN;

-- The first Banco Mestre load predated completion modes and converted long
-- technical guidance into conditions. Imported drafts must not display a fake
-- checklist/progress until a real checklist is explicitly authored.
WITH affected AS (
  SELECT id
  FROM public.challenges
  WHERE import_key LIKE 'universe-ramos:%'
    AND status = 'draft'
    AND completion_mode = 'checklist'
)
DELETE FROM public.challenge_completion_conditions AS condition
USING affected
WHERE condition.challenge_id = affected.id;

UPDATE public.challenges
SET completion_mode = 'guidance', updated_at = now()
WHERE import_key LIKE 'universe-ramos:%'
  AND status = 'draft'
  AND completion_mode = 'checklist';

INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
SELECT id, 'Sistema', 'imported_challenge_guidance_repaired',
  jsonb_build_object('reason', 'Legacy import converted technical guidance into checklist')
FROM public.challenges
WHERE import_key LIKE 'universe-ramos:%'
  AND status = 'draft'
  AND completion_mode = 'guidance';

COMMIT;
