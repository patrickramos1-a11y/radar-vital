
Objetivo: corrigir definitivamente os 3 problemas reportados:
1) criação de tarefa falhando na aba de clientes,
2) contador por usuário na aba de tarefas zerado/incorreto,
3) filtro por usuário não trazendo as tarefas por empresa.

Diagnóstico confirmado
- No fluxo da aba de clientes, o erro vem do banco: o campo `assigned_to` da tabela `tasks` ainda está preso a um CHECK legado (`celine|gabi|darley|vanessa`).  
- Quando a UI envia nomes dinâmicos atuais (ex.: `Celine`, `Ana Paula`), o insert falha com `23514 tasks_assigned_to_check`.
- Na aba de tarefas, há comparação estrita (`task.assigned_to === collaborator.name`) em vários pontos. Como dados antigos estão em minúsculo e colaboradores atuais têm formato diferente, os contadores e filtros quebram.
- O filtro de colaborador nas hooks de painel visual/detalhado usa estrutura legada `client.collaborators[...]` (não tarefas reais), então não reflete “tarefas por empresa”.

Do I know what the issue is?
- Sim. É uma combinação de restrição legada no banco + lógica de comparação/filtro ainda baseada no modelo antigo.

Plano de implementação
1) Ajuste no banco de dados (migração)
- Remover o CHECK legado `tasks_assigned_to_check`.
- Padronizar dados existentes de `tasks.assigned_to` para os nomes atuais de colaboradores (match case-insensitive), para reduzir inconsistência histórica.
- Manter `assigned_to` opcional (`null`) para tarefas sem responsável.

2) Normalização única de responsável (frontend)
- Criar helper utilitário para comparação de responsável ignorando caixa/acento/espaços.
- Usar esse helper em vez de `===` em todos os pontos de contagem/filtro/exibição por colaborador.

3) Corrigir aba de tarefas (unificado e detalhado)
- `src/pages/JackboxUnified.tsx`:
  - ajustar KPIs por colaborador para usar comparação normalizada;
  - corrigir filtro por colaborador para considerar tarefas reais por empresa;
  - garantir que só apareçam empresas com tarefas do(s) colaborador(es) selecionado(s).
- `src/components/tasks/CollaboratorTaskTable.tsx`:
  - filtrar tarefas do colaborador com matching normalizado.
- `src/pages/JackboxPanel.tsx` e `src/pages/JackboxDetalhado.tsx`:
  - aplicar mesma regra de matching normalizado nos contadores/filtros.

4) Corrigir hooks de filtro para modelo dinâmico
- `src/hooks/useVisualPanelFilters.ts` e `src/hooks/usePanelFilters.ts`:
  - remover dependência do legado `client.collaborators[name]` para filtro de colaborador neste contexto de tarefas;
  - deixar a filtragem por colaborador baseada no conjunto de tarefas do cliente (feito nas páginas de tarefas).

5) Ajuste de robustez no hook de tarefas
- `src/hooks/useTasks.ts`:
  - remover tipagem legada rígida de `assigned_to` (evitar cast antigo para union fixa);
  - manter `assigned_to` como string dinâmica/null para refletir colaboradores atuais;
  - manter feedback de erro amigável.

Detalhes técnicos (seu time pode validar rapidamente)
- Arquivos previstos:
  - banco/migração: nova migration SQL
  - `src/hooks/useTasks.ts`
  - `src/hooks/useVisualPanelFilters.ts`
  - `src/hooks/usePanelFilters.ts`
  - `src/pages/JackboxUnified.tsx`
  - `src/pages/JackboxPanel.tsx`
  - `src/pages/JackboxDetalhado.tsx`
  - `src/components/tasks/CollaboratorTaskTable.tsx`
  - (opcional) helper novo: `src/lib/taskAssignee.ts`
- Regra de match: comparar `normalize(assigned_to)` com `normalize(collaborator.name)`.

Plano de testes end-to-end (obrigatório)
1) Aba de clientes (`/`)
- abrir modal de tarefa de um cliente;
- criar tarefa com responsável selecionado (ex.: Celine/Ana Paula);
- validar sucesso no toast e ausência de erro no network (sem 400).

2) Aba de tarefas (`/jackbox-unificado`)
- validar chips de usuários com contagem correta;
- clicar em um colaborador no filtro e confirmar que aparecem somente empresas com tarefas dele;
- testar multi-seleção de colaboradores no filtro.

3) Detalhado (`/jackbox-detalhado`) e painel antigo (`/jackbox`)
- validar contadores por colaborador e filtragem consistente com o unificado.

4) Regressão
- criar tarefa sem responsável;
- concluir/reabrir tarefa;
- confirmar limite de 11 tarefas ativas por cliente continua funcionando.

Critérios de aceite
- criação de tarefa na aba de clientes funciona com qualquer colaborador ativo;
- contadores por usuário na aba de tarefas refletem dados reais;
- filtro por usuário mostra corretamente tarefas por empresa;
- sem erros 400 relacionados a `tasks_assigned_to_check`.
