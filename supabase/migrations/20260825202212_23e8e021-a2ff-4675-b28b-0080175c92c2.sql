CREATE TABLE IF NOT EXISTS public.task_priority_policies (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT true,
  promotion_after_days integer NOT NULL DEFAULT 45 CHECK (promotion_after_days >= 1),
  weight_step_days integer NOT NULL DEFAULT 15 CHECK (weight_step_days >= 1),
  maximum_weight integer NOT NULL DEFAULT 5 CHECK (maximum_weight BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

INSERT INTO public.task_priority_policies (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.task_priority_policies TO anon, authenticated;
GRANT ALL ON public.task_priority_policies TO service_role;

ALTER TABLE public.task_priority_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read task priority policies" ON public.task_priority_policies;
CREATE POLICY "Public read task priority policies"
  ON public.task_priority_policies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update task priority policies" ON public.task_priority_policies;
CREATE POLICY "Public update task priority policies"
  ON public.task_priority_policies FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.reconcile_stale_task_priorities(
  p_actor_name text DEFAULT 'Sistema'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  policy_row public.task_priority_policies%ROWTYPE;
  task_row public.tasks%ROWTYPE;
  priority_row public.priorities%ROWTYPE;
  days_open integer;
  target_weight integer;
  promoted_count integer := 0;
  updated_count integer := 0;
BEGIN
  SELECT * INTO policy_row
  FROM public.task_priority_policies
  WHERE id = true;

  IF NOT FOUND OR NOT policy_row.enabled THEN
    RETURN jsonb_build_object('promoted', 0, 'updated', 0, 'enabled', false);
  END IF;

  FOR task_row IN
    SELECT *
    FROM public.tasks
    WHERE completed = false
      AND created_at <= now() - make_interval(days => policy_row.promotion_after_days)
    ORDER BY created_at ASC
  LOOP
    days_open := greatest(0, floor(extract(epoch FROM (now() - task_row.created_at)) / 86400)::integer);
    target_weight := least(
      policy_row.maximum_weight,
      1 + floor((days_open - policy_row.promotion_after_days)::numeric / policy_row.weight_step_days)::integer
    );

    IF task_row.priority_id IS NULL THEN
      INSERT INTO public.priorities (
        title, description, client_id, assigned_to, due_date, status, weight, category, created_by
      ) VALUES (
        task_row.title,
        format('Prioridade criada automaticamente porque a tarefa permaneceu aberta por %s dias.', days_open),
        task_row.client_id,
        task_row.assigned_to,
        task_row.due_date,
        'aberta',
        target_weight,
        'auto_task_aging',
        p_actor_name
      ) RETURNING * INTO priority_row;

      UPDATE public.tasks
      SET priority_id = priority_row.id
      WHERE id = task_row.id;

      INSERT INTO public.activity_logs (
        user_name, action_type, entity_type, entity_id, entity_name, description, new_value
      ) VALUES (
        p_actor_name,
        'task_auto_promoted',
        'task',
        task_row.id,
        task_row.title,
        format('Tarefa promovida automaticamente a prioridade após %s dias aberta.', days_open),
        jsonb_build_object('priority_id', priority_row.id, 'weight', target_weight, 'days_open', days_open)::text
      );

      promoted_count := promoted_count + 1;
    ELSE
      SELECT * INTO priority_row
      FROM public.priorities
      WHERE id = task_row.priority_id;

      IF FOUND
        AND priority_row.category = 'auto_task_aging'
        AND priority_row.status IN ('aberta', 'em_andamento')
        AND priority_row.weight < target_weight THEN
        UPDATE public.priorities
        SET weight = target_weight
        WHERE id = priority_row.id;

        INSERT INTO public.activity_logs (
          user_name, action_type, entity_type, entity_id, entity_name, description, old_value, new_value
        ) VALUES (
          p_actor_name,
          'task_auto_priority_weight_updated',
          'priority',
          priority_row.id,
          priority_row.title,
          format('Peso da prioridade automática atualizado conforme a idade da tarefa (%s dias).', days_open),
          priority_row.weight::text,
          target_weight::text
        );

        updated_count := updated_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('promoted', promoted_count, 'updated', updated_count, 'enabled', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_stale_task_priorities(text) TO anon, authenticated;