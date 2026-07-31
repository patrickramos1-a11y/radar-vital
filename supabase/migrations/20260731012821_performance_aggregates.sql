BEGIN;

CREATE VIEW public.collaborator_performance_all_time
WITH (security_invoker = TRUE)
AS
WITH task_stats AS (
  SELECT
    collaborator.id AS collaborator_id,
    COUNT(task.id)::INTEGER AS tasks_total,
    COUNT(task.id) FILTER (WHERE task.completed)::INTEGER AS tasks_completed,
    COUNT(task.id) FILTER (
      WHERE NOT task.completed
        AND task.due_date IS NOT NULL
        AND task.due_date < CURRENT_DATE
    )::INTEGER AS tasks_overdue
  FROM public.collaborators collaborator
  LEFT JOIN public.tasks task
    JOIN LATERAL unnest(task.assigned_to) AS assignee(name)
      ON lower(btrim(assignee.name)) = lower(btrim(collaborator.name))
    ON TRUE
  GROUP BY collaborator.id
), priority_stats AS (
  SELECT
    collaborator.id AS collaborator_id,
    COUNT(priority.id)::INTEGER AS priorities_total,
    COUNT(priority.id) FILTER (WHERE priority.status = 'concluida')::INTEGER AS priorities_completed
  FROM public.collaborators collaborator
  LEFT JOIN public.priorities priority
    JOIN LATERAL unnest(priority.assigned_to) AS assignee(name)
      ON lower(btrim(assignee.name)) = lower(btrim(collaborator.name))
    ON TRUE
  GROUP BY collaborator.id
), deliverable_stats AS (
  SELECT
    collaborator.id AS collaborator_id,
    COUNT(deliverable.id)::INTEGER AS deliverables_total,
    COUNT(deliverable.id) FILTER (WHERE deliverable.status = 'concluido')::INTEGER AS deliverables_completed
  FROM public.collaborators collaborator
  LEFT JOIN public.deliverables deliverable
    JOIN LATERAL unnest(deliverable.assigned_to) AS assignee(name)
      ON lower(btrim(assignee.name)) = lower(btrim(collaborator.name))
    ON TRUE
  GROUP BY collaborator.id
), comment_stats AS (
  SELECT
    collaborator.id AS collaborator_id,
    COUNT(comment.id)::INTEGER AS comments_authored
  FROM public.collaborators collaborator
  LEFT JOIN public.client_comments comment
    ON lower(btrim(comment.author_name)) = lower(btrim(collaborator.name))
  GROUP BY collaborator.id
), audit_stats AS (
  SELECT
    collaborator.id AS collaborator_id,
    COUNT(item.id)::INTEGER AS audits_assigned,
    COUNT(item.id) FILTER (WHERE item.status IN ('completed', 'validated'))::INTEGER AS audits_completed
  FROM public.collaborators collaborator
  LEFT JOIN public.audit_client_items item ON item.assignee_id = collaborator.id
  GROUP BY collaborator.id
), challenge_stats AS (
  SELECT
    participant.collaborator_id,
    COUNT(challenge.id) FILTER (
      WHERE challenge.status IN ('active', 'awaiting_validation')
        OR (challenge.status = 'active' AND challenge.due_at <= now())
    )::INTEGER AS challenges_active,
    COUNT(challenge.id) FILTER (WHERE challenge.status = 'won')::INTEGER AS challenges_won
  FROM public.challenge_participants participant
  JOIN public.challenges challenge ON challenge.id = participant.challenge_id
  GROUP BY participant.collaborator_id
), client_stats AS (
  SELECT
    assignment.collaborator_id,
    COUNT(DISTINCT assignment.client_id)::INTEGER AS clients_linked
  FROM public.client_collaborator_assignments assignment
  GROUP BY assignment.collaborator_id
)
SELECT
  collaborator.id AS collaborator_id,
  collaborator.name AS collaborator_name,
  collaborator.color AS collaborator_color,
  collaborator.photo_url,
  COALESCE(task_stats.tasks_total, 0)::INTEGER AS tasks_total,
  COALESCE(task_stats.tasks_completed, 0)::INTEGER AS tasks_completed,
  COALESCE(task_stats.tasks_overdue, 0)::INTEGER AS tasks_overdue,
  COALESCE(priority_stats.priorities_total, 0)::INTEGER AS priorities_total,
  COALESCE(priority_stats.priorities_completed, 0)::INTEGER AS priorities_completed,
  COALESCE(deliverable_stats.deliverables_total, 0)::INTEGER AS deliverables_total,
  COALESCE(deliverable_stats.deliverables_completed, 0)::INTEGER AS deliverables_completed,
  COALESCE(comment_stats.comments_authored, 0)::INTEGER AS comments_authored,
  COALESCE(audit_stats.audits_assigned, 0)::INTEGER AS audits_assigned,
  COALESCE(audit_stats.audits_completed, 0)::INTEGER AS audits_completed,
  COALESCE(challenge_stats.challenges_active, 0)::INTEGER AS challenges_active,
  COALESCE(challenge_stats.challenges_won, 0)::INTEGER AS challenges_won,
  COALESCE(client_stats.clients_linked, 0)::INTEGER AS clients_linked,
  COALESCE(treasury.balance, 0)::INTEGER AS official_star_balance
FROM public.collaborators collaborator
LEFT JOIN task_stats ON task_stats.collaborator_id = collaborator.id
LEFT JOIN priority_stats ON priority_stats.collaborator_id = collaborator.id
LEFT JOIN deliverable_stats ON deliverable_stats.collaborator_id = collaborator.id
LEFT JOIN comment_stats ON comment_stats.collaborator_id = collaborator.id
LEFT JOIN audit_stats ON audit_stats.collaborator_id = collaborator.id
LEFT JOIN challenge_stats ON challenge_stats.collaborator_id = collaborator.id
LEFT JOIN client_stats ON client_stats.collaborator_id = collaborator.id
LEFT JOIN public.collaborator_star_balances treasury
  ON treasury.collaborator_id = collaborator.id;

CREATE VIEW public.collaborator_performance_monthly
WITH (security_invoker = TRUE)
AS
WITH events AS (
  SELECT
    collaborator.id AS collaborator_id,
    date_trunc('month', task.completed_at)::DATE AS month_start,
    1::INTEGER AS tasks_completed,
    0::INTEGER AS comments_authored,
    0::INTEGER AS stars_delta
  FROM public.tasks task
  JOIN LATERAL unnest(task.assigned_to) AS assignee(name) ON TRUE
  JOIN public.collaborators collaborator
    ON lower(btrim(collaborator.name)) = lower(btrim(assignee.name))
  WHERE task.completed = TRUE AND task.completed_at IS NOT NULL

  UNION ALL

  SELECT
    collaborator.id AS collaborator_id,
    date_trunc('month', comment.created_at)::DATE AS month_start,
    0::INTEGER,
    1::INTEGER,
    0::INTEGER
  FROM public.client_comments comment
  JOIN public.collaborators collaborator
    ON lower(btrim(collaborator.name)) = lower(btrim(comment.author_name))

  UNION ALL

  SELECT
    transaction.collaborator_id,
    date_trunc('month', transaction.created_at)::DATE AS month_start,
    0::INTEGER,
    0::INTEGER,
    transaction.amount::INTEGER
  FROM public.star_transactions transaction
)
SELECT
  collaborator_id,
  month_start,
  SUM(tasks_completed)::INTEGER AS tasks_completed,
  SUM(comments_authored)::INTEGER AS comments_authored,
  SUM(stars_delta)::INTEGER AS stars_delta
FROM events
GROUP BY collaborator_id, month_start;

REVOKE ALL ON public.collaborator_performance_all_time FROM anon;
REVOKE ALL ON public.collaborator_performance_monthly FROM anon;
GRANT SELECT ON public.collaborator_performance_all_time TO authenticated;
GRANT SELECT ON public.collaborator_performance_monthly TO authenticated;

COMMIT;
