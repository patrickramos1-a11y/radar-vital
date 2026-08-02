CREATE OR REPLACE FUNCTION public.approve_challenge_as_unrewarded(
  p_challenge_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE before_row public.challenges%ROWTYPE;
BEGIN
  SELECT * INTO before_row FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF before_row.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF before_row.status <> 'draft' THEN RAISE EXCEPTION 'Only draft challenges can be approved as unrewarded opportunities'; END IF;

  UPDATE public.challenges
  SET status = 'open',
      reward_status = 'non_rewarded',
      reward_stars = 0,
      reward_superstars = 0,
      penalty_stars = 0,
      reward_configured_at = now(),
      reward_configured_by = COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
      updated_at = now()
  WHERE id = p_challenge_id;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (
    p_challenge_id,
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    'challenge_approved_unrewarded',
    jsonb_build_object('status', before_row.status, 'reward_status', before_row.reward_status),
    jsonb_build_object('status', 'open', 'reward_status', 'non_rewarded', 'reward_stars', 0, 'reward_superstars', 0, 'penalty_stars', 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_challenge_as_unrewarded(UUID, TEXT) TO anon, authenticated, service_role;