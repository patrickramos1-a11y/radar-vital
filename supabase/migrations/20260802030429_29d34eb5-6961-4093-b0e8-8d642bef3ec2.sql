CREATE OR REPLACE FUNCTION public.configure_challenge_reward(p_challenge_ids uuid[], p_reward_stars integer DEFAULT 0, p_reward_superstars integer DEFAULT 0, p_penalty_stars integer DEFAULT 0, p_reward_status text DEFAULT 'configured'::text, p_note text DEFAULT NULL::text, p_actor_name text DEFAULT 'Sistema'::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  changed_count INTEGER := 0;
  challenge_record RECORD;
  actor TEXT := COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema');
BEGIN
  IF COALESCE(array_length(p_challenge_ids, 1), 0) = 0 THEN RAISE EXCEPTION 'Select at least one challenge'; END IF;
  IF p_reward_status NOT IN ('configured', 'non_rewarded') THEN RAISE EXCEPTION 'Invalid reward status'; END IF;
  IF COALESCE(p_reward_stars, 0) < 0 OR COALESCE(p_reward_superstars, 0) < 0 OR COALESCE(p_penalty_stars, 0) < 0 THEN
    RAISE EXCEPTION 'Rewards and penalties cannot be negative';
  END IF;

  FOR challenge_record IN
    UPDATE public.challenges
    SET reward_stars = CASE WHEN p_reward_status = 'non_rewarded' THEN 0 ELSE COALESCE(p_reward_stars, 0) END,
        reward_superstars = CASE WHEN p_reward_status = 'non_rewarded' THEN 0 ELSE COALESCE(p_reward_superstars, 0) END,
        penalty_stars = CASE WHEN p_reward_status = 'non_rewarded' THEN 0 ELSE COALESCE(p_penalty_stars, 0) END,
        reward_status = p_reward_status,
        reward_configured_at = now(),
        reward_configured_by = actor,
        status = CASE
          WHEN status = 'draft'
               AND p_reward_status = 'configured'
               AND (COALESCE(p_reward_superstars, 0) > 0 OR COALESCE(p_reward_stars, 0) > 0)
          THEN 'open'
          ELSE status
        END,
        updated_at = now()
    WHERE id = ANY(p_challenge_ids)
    RETURNING id, status
  LOOP
    changed_count := changed_count + 1;
    UPDATE public.challenge_value_requests
    SET status = 'reviewed', reviewed_at = now(), reviewed_by = actor, admin_note = NULLIF(btrim(COALESCE(p_note, '')), '')
    WHERE challenge_id = challenge_record.id AND status = 'pending';
    INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
    VALUES (challenge_record.id, actor, 'challenge_reward_configured',
      jsonb_build_object('reward_stars', p_reward_stars, 'reward_superstars', p_reward_superstars, 'penalty_stars', p_penalty_stars, 'reward_status', p_reward_status));
    IF challenge_record.status = 'open' THEN
      INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
      VALUES (challenge_record.id, actor, 'challenge_activated',
        jsonb_build_object('status', 'draft'),
        jsonb_build_object('status', 'open', 'reward_superstars', COALESCE(p_reward_superstars, 0)));
    END IF;
  END LOOP;

  RETURN changed_count;
END;
$function$;