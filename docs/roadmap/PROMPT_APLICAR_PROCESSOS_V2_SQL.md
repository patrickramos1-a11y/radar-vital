# Prompt para aplicar a migration Processos v2

Cole no Lovable o texto abaixo, a partir de "Execute o SQL".

---

Execute o SQL abaixo integralmente, em uma única transação, no banco do Radar Vital. Ele é aditivo: não apaga tabelas, colunas, prioridades, tarefas, entregáveis nem comentários. Não altere o código do app nem gere outra migration a partir dele; o código novo será publicado depois, pelo GitHub.

O que ele faz:
1. Cria o peso do processo (`tasks.weight`, de 1 a 5) e o relógio do peso (`tasks.weight_changed_at`). Tarefas ligadas a prioridade recebem o peso da prioridade; as demais recebem o peso da urgência (baixa 1, normal 2, alta 3, urgente 4).
2. Converte as prioridades abertas em processos: as que não têm cliente vão para o cliente interno RAMOS ENGENHARIA, e as que não têm tarefa raiz ganham uma.
3. Aceita repetição com intervalo livre (`recurrence = 'custom'`, `recurrence_interval`, `recurrence_unit`).
4. Liga comentário a processo (`client_comments.task_id`).
5. Faz todo processo principal concluído gerar um entregável (`deliverables.source_task_id`), sem duplicar o entregável da prioridade e sem criar entregáveis para o que já estava concluído.
6. O envelhecimento automático deixa de criar prioridades.

Considere sucesso somente se as quatro consultas de conferência, no final, retornarem o esperado. Se qualquer comando falhar, desfaça tudo (ROLLBACK) e me mostre a mensagem de erro completa.

```sql
BEGIN;

-- Processos v2: tudo vira processo (docs/roadmap/PROCESSOS_V2.md, D-025).
--
-- Migration aditiva. O sistema publicado continua funcionando depois dela:
-- nada que o codigo atual usa e removido, e as prioridades continuam sendo
-- lidas e gravadas ate o codigo novo ser publicado. Enquanto isso, gatilhos
-- mantem o peso da tarefa raiz igual ao peso da prioridade ligada.
--
-- Pode ser executada mais de uma vez sem duplicar nada.

-- ---------------------------------------------------------------------------
-- 1. Peso (1 a 5) e relogio do peso na tarefa
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.task_weight_for_urgency(p_urgency text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_urgency
    WHEN 'baixa' THEN 1
    WHEN 'alta' THEN 3
    WHEN 'urgente' THEN 4
    ELSE 2
  END;
$$;

CREATE OR REPLACE FUNCTION public.task_urgency_for_weight(p_weight integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_weight >= 4 THEN 'urgente'
    WHEN p_weight = 3 THEN 'alta'
    WHEN p_weight = 2 THEN 'normal'
    ELSE 'baixa'
  END;
$$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS weight integer,
  ADD COLUMN IF NOT EXISTS weight_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_interval integer,
  ADD COLUMN IF NOT EXISTS recurrence_unit text;

-- O preenchimento inicial nao deve mudar o updated_at de todas as tarefas.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sync_task_operational_status_trigger'
      AND tgrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks DISABLE TRIGGER sync_task_operational_status_trigger;
  END IF;
END
$$;

-- Peso vem da prioridade ligada (pela tarefa de origem ou, na tarefa raiz,
-- por priority_id). Sem prioridade, vem da urgencia atual da tarefa.
UPDATE public.tasks AS task
SET weight = COALESCE(
      task.weight,
      CASE WHEN source.weight IS NOT NULL THEN greatest(1, least(5, source.weight)) END,
      public.task_weight_for_urgency(task.priority)
    ),
    weight_changed_at = COALESCE(
      task.weight_changed_at,
      source.weight_changed_at,
      task.priority_changed_at,
      task.created_at,
      now()
    )
FROM (
  SELECT candidate.id, linked.weight, linked.weight_changed_at
  FROM public.tasks AS candidate
  LEFT JOIN LATERAL (
    SELECT priority.weight, priority.weight_changed_at
    FROM public.priorities AS priority
    WHERE priority.source_task_id = candidate.id
       OR (candidate.parent_task_id IS NULL AND priority.id = candidate.priority_id)
    ORDER BY COALESCE(priority.source_task_id = candidate.id, false) DESC,
             (priority.status <> 'concluida') DESC,
             priority.created_at DESC
    LIMIT 1
  ) AS linked ON true
) AS source
WHERE source.id = task.id
  AND (task.weight IS NULL OR task.weight_changed_at IS NULL);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sync_task_operational_status_trigger'
      AND tgrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks ENABLE TRIGGER sync_task_operational_status_trigger;
  END IF;
END
$$;

ALTER TABLE public.tasks
  ALTER COLUMN weight SET DEFAULT 2,
  ALTER COLUMN weight SET NOT NULL,
  ALTER COLUMN weight_changed_at SET DEFAULT now(),
  ALTER COLUMN weight_changed_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_weight_check'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_weight_check CHECK (weight BETWEEN 1 AND 5);
  END IF;
END
$$;

-- Painel: processos de peso Maxima ainda abertos.
CREATE INDEX IF NOT EXISTS tasks_open_root_weight_idx
  ON public.tasks (weight)
  WHERE parent_task_id IS NULL AND NOT completed;

-- Urgencia e peso andam juntos. Quem grava so o peso (codigo novo) atualiza a
-- urgencia; quem grava so a urgencia (codigo atual) atualiza o peso, exceto
-- quando a tarefa segue o peso de uma prioridade.
CREATE OR REPLACE FUNCTION public.sync_task_weight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.weight IS NULL THEN
      NEW.weight := public.task_weight_for_urgency(NEW.priority);
    ELSIF NEW.weight = 2 AND NEW.priority IS DISTINCT FROM 'normal' THEN
      NEW.weight := public.task_weight_for_urgency(NEW.priority);
    ELSIF NEW.weight <> 2 AND NEW.priority IS NOT DISTINCT FROM 'normal' THEN
      NEW.priority := public.task_urgency_for_weight(NEW.weight);
    END IF;
    NEW.weight_changed_at := COALESCE(NEW.weight_changed_at, NEW.created_at, now());
    RETURN NEW;
  END IF;

  IF NEW.weight IS DISTINCT FROM OLD.weight THEN
    IF NEW.priority IS NOT DISTINCT FROM OLD.priority THEN
      NEW.priority := public.task_urgency_for_weight(NEW.weight);
    END IF;
  ELSIF NEW.priority IS DISTINCT FROM OLD.priority
    AND NEW.priority_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.priorities AS priority
      WHERE priority.source_task_id = NEW.id
    ) THEN
    NEW.weight := public.task_weight_for_urgency(NEW.priority);
  END IF;

  IF NEW.weight IS DISTINCT FROM OLD.weight THEN
    NEW.weight_changed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_task_weight_trigger ON public.tasks;
CREATE TRIGGER sync_task_weight_trigger
BEFORE INSERT OR UPDATE OF weight, priority, priority_id ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_task_weight();

REVOKE ALL ON FUNCTION public.sync_task_weight() FROM PUBLIC;

-- Enquanto o codigo atual estiver publicado, o peso editado na prioridade
-- chega a tarefa que representa o processo.
CREATE OR REPLACE FUNCTION public.sync_priority_weight_to_process()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  target_weight integer := greatest(1, least(5, NEW.weight));
BEGIN
  UPDATE public.tasks
  SET weight = target_weight
  WHERE (
      id = NEW.source_task_id
      OR (NEW.source_task_id IS NULL AND priority_id = NEW.id AND parent_task_id IS NULL)
    )
    AND weight IS DISTINCT FROM target_weight;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_priority_weight_to_process_trigger ON public.priorities;
CREATE TRIGGER sync_priority_weight_to_process_trigger
AFTER INSERT OR UPDATE OF weight, source_task_id ON public.priorities
FOR EACH ROW EXECUTE FUNCTION public.sync_priority_weight_to_process();

REVOKE ALL ON FUNCTION public.sync_priority_weight_to_process() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. Repeticao com intervalo livre (quinzenal, trimestral, a cada N dias/meses)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_recurrence_check,
  ADD CONSTRAINT tasks_recurrence_check CHECK (
    recurrence IN ('none', 'weekly', 'monthly', 'custom')
  ),
  DROP CONSTRAINT IF EXISTS tasks_recurrence_custom_check,
  ADD CONSTRAINT tasks_recurrence_custom_check CHECK (
    (recurrence = 'custom') = (recurrence_interval IS NOT NULL AND recurrence_unit IS NOT NULL)
    AND (recurrence_interval IS NULL OR recurrence_interval BETWEEN 1 AND 366)
    AND (recurrence_unit IS NULL OR recurrence_unit IN ('days', 'months'))
  );

-- ---------------------------------------------------------------------------
-- 3. Acompanhamento: comentario ligado ao processo
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_comments
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS client_comments_task_id_created_at_idx
  ON public.client_comments (task_id, created_at DESC)
  WHERE task_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Todo processo principal concluido vira entregavel
-- ---------------------------------------------------------------------------

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deliverables_source_task_id_key'
      AND conrelid = 'public.deliverables'::regclass
  ) THEN
    ALTER TABLE public.deliverables
      ADD CONSTRAINT deliverables_source_task_id_key UNIQUE (source_task_id);
  END IF;
END
$$;

-- So age na mudanca para concluido: processos concluidos antes desta
-- migration nao geram entregavel. Quando o processo tem prioridade ligada, o
-- entregavel e o mesmo da prioridade (nao duplica).
CREATE OR REPLACE FUNCTION public.sync_completed_process_deliverable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  target_deliverable_id uuid;
  linked_priority_id uuid;
BEGIN
  IF NEW.parent_task_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.completed AND (TG_OP = 'INSERT' OR NOT OLD.completed) THEN
    SELECT deliverable.id INTO target_deliverable_id
    FROM public.deliverables AS deliverable
    WHERE deliverable.source_task_id = NEW.id
       OR (NEW.priority_id IS NOT NULL AND deliverable.source_priority_id = NEW.priority_id)
    ORDER BY COALESCE(deliverable.source_task_id = NEW.id, false) DESC
    LIMIT 1
    FOR UPDATE;

    IF target_deliverable_id IS NULL THEN
      SELECT priority.id INTO linked_priority_id
      FROM public.priorities AS priority
      WHERE priority.id = NEW.priority_id;

      INSERT INTO public.deliverables (
        name,
        description,
        client_id,
        assigned_to,
        due_date,
        status,
        created_by,
        created_at,
        updated_at,
        completed_at,
        source_task_id,
        source_priority_id
      ) VALUES (
        NEW.title,
        NEW.description,
        NEW.client_id,
        NEW.assigned_to,
        NEW.due_date,
        'concluido',
        NEW.created_by,
        NEW.created_at,
        now(),
        COALESCE(NEW.completed_at, clock_timestamp()),
        NEW.id,
        linked_priority_id
      )
      ON CONFLICT (source_task_id) DO UPDATE
      SET status = 'concluido',
          completed_at = EXCLUDED.completed_at,
          updated_at = now()
      RETURNING id INTO target_deliverable_id;
    ELSE
      UPDATE public.deliverables
      SET source_task_id = COALESCE(source_task_id, NEW.id),
          status = 'concluido',
          completed_at = COALESCE(completed_at, NEW.completed_at, clock_timestamp()),
          updated_at = now()
      WHERE id = target_deliverable_id;
    END IF;

    INSERT INTO public.deliverable_items (deliverable_id, item_type, item_id)
    SELECT target_deliverable_id, 'task', NEW.id
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.deliverable_items
      WHERE deliverable_id = target_deliverable_id
        AND item_type = 'task'
        AND item_id = NEW.id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.completed AND NOT NEW.completed THEN
    DELETE FROM public.deliverables
    WHERE source_task_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_completed_process_deliverable_trigger ON public.tasks;
CREATE TRIGGER sync_completed_process_deliverable_trigger
AFTER INSERT OR UPDATE OF completed, status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_completed_process_deliverable();

REVOKE ALL ON FUNCTION public.sync_completed_process_deliverable() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 5. Envelhecimento: nao cria mais prioridades
-- ---------------------------------------------------------------------------
-- Tarefas paradas deixam de virar prioridade sozinhas. Os processos que ja
-- vieram do envelhecimento (categoria auto_task_aging) continuam subindo um
-- ponto de peso a cada weight_step_days, agora pelo relogio da tarefa.

CREATE OR REPLACE FUNCTION public.reconcile_stale_task_priorities(
  p_actor_name text DEFAULT 'Sistema'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  policy_row public.task_priority_policies%ROWTYPE;
  aging_row record;
  days_in_level integer;
  elapsed_steps integer;
  target_weight integer;
  updated_count integer := 0;
BEGIN
  SELECT * INTO policy_row
  FROM public.task_priority_policies
  WHERE id = true;

  IF NOT FOUND OR NOT policy_row.enabled THEN
    RETURN jsonb_build_object('promoted', 0, 'updated', 0, 'enabled', false);
  END IF;

  FOR aging_row IN
    SELECT task.id AS task_id,
           task.title,
           task.weight,
           task.weight_changed_at,
           priority.id AS priority_id
    FROM public.tasks AS task
    JOIN public.priorities AS priority ON priority.id = task.priority_id
    WHERE task.parent_task_id IS NULL
      AND NOT task.completed
      AND task.status <> 'cancelada'
      AND priority.category = 'auto_task_aging'
      AND task.weight < policy_row.maximum_weight
    ORDER BY task.weight_changed_at ASC
    FOR UPDATE OF task
  LOOP
    days_in_level := greatest(
      0,
      floor(extract(epoch FROM (now() - aging_row.weight_changed_at)) / 86400)::integer
    );
    elapsed_steps := floor(days_in_level::numeric / policy_row.weight_step_days)::integer;
    target_weight := least(policy_row.maximum_weight, aging_row.weight + elapsed_steps);

    IF target_weight > aging_row.weight THEN
      UPDATE public.tasks
      SET weight = target_weight
      WHERE id = aging_row.task_id;

      -- Mantem a tela atual (que le o peso da prioridade) igual ao processo.
      UPDATE public.priorities
      SET weight = target_weight
      WHERE id = aging_row.priority_id
        AND weight IS DISTINCT FROM target_weight;

      INSERT INTO public.activity_logs (
        user_name, action_type, entity_type, entity_id, entity_name, description, old_value, new_value
      ) VALUES (
        p_actor_name,
        'task_auto_priority_weight_updated',
        'task',
        aging_row.task_id,
        aging_row.title,
        format('Peso automático atualizado após %s dias no nível anterior.', days_in_level),
        aging_row.weight::text,
        target_weight::text
      );

      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('promoted', 0, 'updated', updated_count, 'enabled', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_stale_task_priorities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_stale_task_priorities(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Prioridades abertas viram processos
-- ---------------------------------------------------------------------------
-- Para cada prioridade aberta: sem cliente, vai para o cliente interno
-- RAMOS ENGENHARIA; sem tarefa raiz, ganha uma; com tarefa raiz, a tarefa
-- recebe peso, titulo, descricao e vencimento da prioridade (o que a tela de
-- hoje ja mostra). Pode ser executada de novo no dia da publicacao do codigo
-- novo, para pegar prioridades criadas nesse meio tempo.

CREATE OR REPLACE FUNCTION public.convert_open_priorities_to_processes(
  p_actor_name text DEFAULT 'Sistema'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  internal_client_id uuid;
  priority_row public.priorities%ROWTYPE;
  root_row public.tasks%ROWTYPE;
  new_task_id uuid;
  normalized_weight integer;
  open_count integer := 0;
  moved_to_internal integer := 0;
  created_roots integer := 0;
  updated_roots integer := 0;
  affected_rows integer := 0;
BEGIN
  SELECT client.id INTO internal_client_id
  FROM public.clients AS client
  WHERE upper(trim(client.name)) = 'RAMOS ENGENHARIA'
  ORDER BY (client.client_type = 'UNIVERSO_RAMOS') DESC, client.is_active DESC, client.created_at
  LIMIT 1;

  IF internal_client_id IS NULL THEN
    RAISE EXCEPTION 'Cliente interno RAMOS ENGENHARIA não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  FOR priority_row IN
    SELECT *
    FROM public.priorities
    WHERE status IN ('aberta', 'em_andamento')
    ORDER BY created_at
    FOR UPDATE
  LOOP
    open_count := open_count + 1;
    normalized_weight := greatest(1, least(5, priority_row.weight));

    IF priority_row.client_id IS NULL THEN
      UPDATE public.priorities
      SET client_id = internal_client_id
      WHERE id = priority_row.id;
      priority_row.client_id := internal_client_id;
      moved_to_internal := moved_to_internal + 1;
    END IF;

    root_row := NULL;
    IF priority_row.source_task_id IS NOT NULL THEN
      SELECT * INTO root_row FROM public.tasks WHERE id = priority_row.source_task_id FOR UPDATE;
    END IF;
    IF root_row.id IS NULL THEN
      SELECT * INTO root_row
      FROM public.tasks
      WHERE priority_id = priority_row.id
        AND parent_task_id IS NULL
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF root_row.id IS NULL THEN
      INSERT INTO public.tasks (
        client_id,
        title,
        description,
        assigned_to,
        due_date,
        status,
        weight,
        priority,
        priority_id,
        created_by,
        created_at
      ) VALUES (
        priority_row.client_id,
        priority_row.title,
        priority_row.description,
        COALESCE((priority_row.assigned_to)[1:1], '{}'::text[]),
        priority_row.due_date,
        CASE WHEN priority_row.status = 'em_andamento' THEN 'em_andamento' ELSE 'pendente' END,
        normalized_weight,
        public.task_urgency_for_weight(normalized_weight),
        priority_row.id,
        COALESCE(priority_row.created_by, p_actor_name),
        priority_row.created_at
      )
      RETURNING id INTO new_task_id;

      UPDATE public.priorities
      SET source_task_id = new_task_id
      WHERE id = priority_row.id;

      created_roots := created_roots + 1;
    ELSIF root_row.parent_task_id IS NOT NULL THEN
      -- A prioridade aponta para uma etapa: so o peso passa.
      UPDATE public.tasks
      SET weight = normalized_weight
      WHERE id = root_row.id
        AND weight IS DISTINCT FROM normalized_weight;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      updated_roots := updated_roots + affected_rows;
    ELSE
      UPDATE public.tasks
      SET title = COALESCE(NULLIF(trim(priority_row.title), ''), title),
          description = COALESCE(NULLIF(trim(priority_row.description), ''), description),
          due_date = COALESCE(priority_row.due_date, due_date),
          weight = normalized_weight,
          priority_id = COALESCE(priority_id, priority_row.id)
      WHERE id = root_row.id
        AND (
          title IS DISTINCT FROM COALESCE(NULLIF(trim(priority_row.title), ''), title)
          OR description IS DISTINCT FROM COALESCE(NULLIF(trim(priority_row.description), ''), description)
          OR due_date IS DISTINCT FROM COALESCE(priority_row.due_date, due_date)
          OR weight IS DISTINCT FROM normalized_weight
          OR priority_id IS NULL
        );
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      updated_roots := updated_roots + affected_rows;

      IF priority_row.source_task_id IS NULL THEN
        UPDATE public.priorities
        SET source_task_id = root_row.id
        WHERE id = priority_row.id;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'open_priorities', open_count,
    'moved_to_internal_client', moved_to_internal,
    'created_roots', created_roots,
    'updated_roots', updated_roots
  );
END;
$$;

REVOKE ALL ON FUNCTION public.convert_open_priorities_to_processes(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.convert_open_priorities_to_processes(text) FROM anon, authenticated;

SELECT public.convert_open_priorities_to_processes('Migração Processos v2');

COMMENT ON TABLE public.priorities IS
  'Histórico. Desde Processos v2 (D-025) o processo é a tarefa raiz com peso; novas prioridades não são criadas pelo código novo.';
COMMENT ON COLUMN public.tasks.weight IS
  'Peso do processo, 1 a 5. Peso 5 = Máxima.';
COMMENT ON COLUMN public.client_comments.task_id IS
  'Processo acompanhado por este comentário.';
COMMENT ON COLUMN public.deliverables.source_task_id IS
  'Processo principal cuja conclusão gerou este entregável.';

COMMIT;
```

Consultas de conferência (rode depois do COMMIT):

```sql
-- 1. Esperado: 0 (toda prioridade aberta tem cliente e tarefa raiz).
SELECT count(*) AS prioridades_abertas_sem_processo
FROM public.priorities
WHERE status IN ('aberta', 'em_andamento')
  AND (client_id IS NULL OR source_task_id IS NULL);

-- 2. Esperado: cerca de 16 processos criados hoje pela conversão.
SELECT count(*) AS processos_criados_pela_conversao
FROM public.tasks AS task
JOIN public.priorities AS priority ON priority.source_task_id = task.id
WHERE task.created_at = priority.created_at
  AND task.updated_at > now() - interval '1 hour';

-- 3. Processos abertos por peso. Esperado: nenhuma linha com peso nulo.
SELECT weight, count(*) AS processos_abertos
FROM public.tasks
WHERE parent_task_id IS NULL AND NOT completed AND status <> 'cancelada'
GROUP BY weight
ORDER BY weight;

-- 4. Esperado: 4 linhas (as colunas novas existem).
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('tasks', 'weight'),
    ('tasks', 'recurrence_interval'),
    ('client_comments', 'task_id'),
    ('deliverables', 'source_task_id')
  );
```

---

## Para quem for aplicar

- Números lidos em produção em 25/11/2026: 206 prioridades abertas (190 com tarefa raiz, 15 sem cliente e sem tarefa, 1 com cliente e sem tarefa) e 18 prioridades abertas cuja tarefa raiz já estava concluída. Essas 18 continuam concluídas, como a tela de Processos já as mostra.
- No dia de publicar o código novo, rode de novo `SELECT public.convert_open_priorities_to_processes('Publicação Processos v2');` para pegar prioridades criadas nesse meio tempo. Ela não duplica nada.
- Logo depois da migration, o app publicado continua funcionando. Mudam três coisas: concluir qualquer tarefa principal já gera entregável; tarefa parada não vira mais prioridade sozinha; as 15 prioridades sem cliente aparecem em RAMOS ENGENHARIA.
- Teste local da migration: `supabase/tests/processos_v2/` (PGlite).
