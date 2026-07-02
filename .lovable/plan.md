# Central de Entregas — Plano de Implementação

Nova página focada no **colaborador/responsável**, complementando o Painel AC (que é por cliente). Hierarquia: Cliente → Prioridade → Tarefa → Comentário.

---

## 1. Banco de dados (novas tabelas)

### `priorities`

Prioridades são um nível acima das tarefas. Uma prioridade pertence a um cliente, tem um responsável, prazo, peso e status.

Campos: `title`, `description`, `client_id`, `assigned_to`, `due_date`, `status` (aberta/em_andamento/concluida/cancelada), `weight` (1–5), `category`, `created_at`, `completed_at`, `created_by`.

### `deliverables` (entregáveis)

Agrupam prioridades e tarefas para uma reunião/PT.

Campos: `name`, `description`, `assigned_to`, `due_date`, `status`, `created_at`, `completed_at`.

### `deliverable_items`

Tabela de vínculo N:N entre um entregável e suas prioridades/tarefas.
Campos: `deliverable_id`, `item_type` (`priority` | `task`), `item_id`.

### Alteração em `tasks`

Adicionar coluna `priority_id UUID` (nullable) — vincula uma tarefa a uma prioridade quando promovida.

Todas as tabelas terão GRANTs, RLS e políticas públicas (padrão do projeto, sem `auth.uid`).

Logs em `activity_logs` para: criação/edição/conclusão de prioridade, promoção de tarefa, criação/conclusão de entregável, mudança de responsável.

---

## 2. Nova rota e menu

- Rota: `/central-entregas` em `App.tsx`.
- Item no `AppSidebar.tsx`: **"Central de Entregas"** (ícone `Target` ou `Users`), posicionado logo abaixo de "Tarefas".

---

## 3. Estrutura da página

```text
┌─────────────────────────────────────────────────────┐
│  [Patrick] [Celine] [Gabi] [Darley] [Vanessa]       │  ← Seletor de responsável (chips coloridos)
├─────────────────────────────────────────────────────┤
│  KPIs resumo (clientes, tarefas, prioridades, ...)  │
├─────────────────────────────────────────────────────┤
│  Abas: Visão Geral | Prioridades | Tarefas |        │
│        Comentários | Entregáveis | Performance      │
├─────────────────────────────────────────────────────┤
│  Conteúdo da aba selecionada                        │
└─────────────────────────────────────────────────────┘
```

Cor por colaborador reutilizando o mapa já existente em `CollaboratorTaskTable`.

### Aba 1 — Visão Geral

Cards de KPI: Clientes vinculados, Tarefas abertas, Tarefas concluídas, Prioridades abertas, Comentários pendentes, Tempo médio (dias), Itens atrasados. Abaixo, um resumo dos itens mais críticos (top 5 atrasados).

### Aba 2 — Prioridades

Tabela/cards com filtros por status. Botão "+ Nova prioridade". Ao clicar em uma prioridade, drawer com edição inline e lista de tarefas vinculadas.

### Aba 3 — Tarefas / Jackbox

Reaproveita `CollaboratorTaskTable` com colunas adicionais: **Prioridade vinculada** e botão **"Promover para prioridade"**. Filtros: cliente, status, prioridade, ordenação.

### Aba 4 — Comentários

Lista de comentários onde o colaborador está em `required_readers`. Filtros: não lidos/lidos, por cliente, por data. Ação de marcar como lido inline.

### Aba 5 — Entregáveis

Cards de entregáveis (ex.: "Até a próxima PT"). Cada card mostra progresso (% concluído baseado em itens vinculados), prazo e lista expandível de prioridades/tarefas. Botão "+ Novo entregável" com seletor múltiplo de prioridades e tarefas.

### Aba 6 — Performance

KPIs históricos + gráfico de evolução mensal (recharts, já usado no projeto): tarefas concluídas por mês, tempo médio, comentários lidos no prazo.

---

## 4. Modal "Promover para prioridade"

Aberto a partir da aba Tarefas. Pré-preenche título/cliente/responsável a partir da tarefa. Campos: título, descrição, prazo, peso (slider 1–5), categoria. Ao confirmar: cria linha em `priorities`, faz `UPDATE tasks SET priority_id = ...`, grava log.

---

## 5. Detalhes técnicos

**Hooks novos:**

- `usePriorities()` — CRUD + filtros por responsável/cliente/status.
- `useDeliverables()` — CRUD + cálculo de % concluído agregando itens vinculados.
- `useCollaboratorMetrics(name)` — deriva KPIs a partir de `tasks`, `priorities`, `client_comments`, `client_collaborator_assignments`.

**Componentes novos (em `src/components/central-entregas/`):**

- `ResponsibleSelector.tsx`
- `OverviewTab.tsx`, `PrioritiesTab.tsx`, `TasksTab.tsx`, `CommentsTab.tsx`, `DeliverablesTab.tsx`, `PerformanceTab.tsx`
- `PriorityModal.tsx` (criar/editar/promover)
- `DeliverableModal.tsx`
- `PriorityCard.tsx`, `DeliverableCard.tsx`
- `KpiCard.tsx` (ou reaproveitar `dashboard-stats/KPICard`)

**Página:** `src/pages/CentralEntregas.tsx` orquestra seletor + abas (`Tabs` shadcn).

**Logs:** estender `ActivityLogger` com métodos `createPriority`, `updatePriority`, `completePriority`, `promoteTaskToPriority`, `createDeliverable`, `completeDeliverable`.

**Visual:** glassmorphism e paleta já existentes; chips de status (aberta=azul, em_andamento=amarelo, concluída=verde, cancelada=cinza, atrasado=vermelho destacado).

---

## 6. Ordem de execução

1. Migration (priorities, deliverables, deliverable_items, tasks.priority_id, RLS/GRANTs).
2. Rota, item de menu, esqueleto da página com seletor e abas vazias.
3. Hooks (`usePriorities`, `useDeliverables`, `useCollaboratorMetrics`).
4. Aba Visão Geral + Aba Tarefas (reusa componentes existentes — entrega valor rápido).
5. Aba Prioridades + modal "Promover para prioridade".
6. Aba Comentários (filtra dados já disponíveis).
7. Aba Entregáveis.
8. Aba Performance (gráficos).
9. Logs de auditoria em todas as ações.

Escopo grande — MAS IREI FAZER TODO ELE DE UMA VEZ E ULTILIZANDO O MAXIMO DO MEU POTENCIAL. Confirma?