-- Processos v2: conferencia depois de aplicar 1_aplicar_processos_v2.sql.
-- So leitura. Rode as quatro consultas e mostre o resultado de cada uma.

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
