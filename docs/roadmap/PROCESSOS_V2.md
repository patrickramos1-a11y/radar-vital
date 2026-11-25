# Processos v2 — tudo vira processo

Desenho combinado com o Patrick em 25/11/2026. Substitui a ideia de "prioridade"
como coisa separada. Decisão registrada em D-025.

## 1. Conceito

- **Processo** é a unidade de trabalho de todo o sistema. Cadastrar, editar,
  concluir, filtrar e contar: tudo fala em processo.
- **Etapas** são as subtarefas de um processo.
- **Peso** vai de 1 a 5. **Peso 5 = Máxima**, e é isso que antes se chamava
  "prioridade". Não existe mais estrela, nem "promover para prioridade", nem
  "voltar para tarefa".
- **Todo processo concluído vira entregável.** Só o processo principal; as
  etapas contam dentro dele.
- **Acompanhamento** são comentários feitos no processo. Eles aparecem no
  processo e também nos Comentários do cliente.

## 2. Telas

### Processos (`/processos` e aba Processos da Central)
Duas visões apenas:
- **Processos**: todos os processos, agrupados por cliente.
- **Painel**: só os processos de peso Máxima, em cartões.

Botão único **Novo processo** (com peso, vencimento, planejamento, repetição).

### Gestão de processos (`/jackbox-unificado`, hoje "Gestão por cliente")
Seções:
- **Todos**
- **Planejados**: processos com data de planejamento futura.
- **Recorrentes**: processos-mãe que se repetem, com as etapas já geradas.

### Entregáveis (Central)
Nova aba **Em acompanhamento**, ao lado de A avaliar / Avaliados / Todos:
- **Semanas**: as 5 últimas semanas. Em cada uma, os processos que receberam
  comentário naquela semana, com o último comentário à vista.
- **Sem acompanhamento**: o resto, agrupado por tempo desde o último
  comentário: 30, 60, 90 e mais de 90 dias. Processo que nunca recebeu
  comentário entra em "mais de 90 dias".
- Cada processo tem o botão **Comentar** (acompanhamento).
- Filtro por responsável, para cada um ver o que está sob sua responsabilidade.

### Painel AC, TV e celular
A marca amarela "Prioridade" de cliente sai do sistema (cards, filtros,
ordenação, TV, cadastro). Os dados ficam no banco, só deixam de aparecer.

### Ranking
`pontos + soma dos pesos dos entregáveis − atrasados`. Um entregável de peso 1
vale 1; de peso 5 vale 5.

## 3. Processo-mãe recorrente

- Um processo marcado para repetir (semanal, quinzenal, mensal, trimestral ou a
  cada N dias/meses) fica **aberto** como processo-mãe.
- A cada período, o sistema cria uma **etapa** dentro dele, com o vencimento
  daquele período. O histórico fica junto no mesmo processo.
- Cada etapa concluída vira registro do período; o processo-mãe só é concluído
  quando alguém encerra a repetição.
- Etapas não se duplicam: o banco aceita uma única etapa por processo-mãe e
  data (índice `recurrence_origin_id + due_date`, que já existe).
- A geração roda ao abrir o sistema, para todos os períodos vencidos até hoje
  mais o próximo.

## 4. Banco de dados (uma migration, aplicada pelo Patrick no Lovable)

1. `tasks.weight` (1 a 5). Preenchido a partir da prioridade ligada; sem
   prioridade, a partir da urgência atual da tarefa.
2. As 206 prioridades abertas viram processos: as que já têm tarefa raiz só
   passam o peso; as 15 sem cliente ganham tarefa no cliente interno
   "RAMOS ENGENHARIA".
3. A tabela `priorities` fica só para histórico. Nenhuma prioridade nova é
   criada.
4. `tasks.recurrence` aceita os novos intervalos (`recurrence_interval` e
   `recurrence_unit`).
5. `client_comments.task_id`: liga o comentário ao processo.
6. `deliverables.source_task_id` + gatilho: concluir um processo principal cria
   o entregável (sem duplicar, sem mexer nos históricos).

Antes do SQL valer, o sistema publicado continua como está. O código novo só é
publicado depois que a migration estiver aplicada e conferida.

### Envelhecimento
Tarefa parada não vira mais prioridade sozinha. Os processos que já vieram do
envelhecimento automático continuam subindo um ponto de peso a cada 15 dias.

## 5. Ordem de execução

1. Migration + texto para colar no Lovable. **Feito em 25/11** (`20261125180000_processos_v2.sql`, `PROMPT_APLICAR_PROCESSOS_V2_SQL.md`); falta aplicar.
2. Modelo de processo no código (tarefa raiz com peso), sem promover/rebaixar.
3. Tela Processos (Processos + Painel) e Novo processo.
4. Gestão de processos (Todos, Planejados, Recorrentes) e processo-mãe.
5. Entregáveis: Em acompanhamento, comentários por processo, faixas de dias.
6. Nomenclatura em todo o sistema e remoção da marca de cliente.
7. Ranking por peso.
8. Testes, build, conferência no navegador, publicação.
