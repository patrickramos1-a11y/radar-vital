# Modelo de Dados Alvo

Este documento descreve o modelo logico. Nomes finais devem ser confirmados
contra o schema existente antes de cada migration.

## 1. Clientes

### Alteracoes em `clients`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `client_type` | text | `AC`, `AV` ou `UNIVERSO_RAMOS` |
| `description` | text nullable | Contexto do cliente interno |
| `municipality` | text nullable | Obrigatorio na aplicacao apenas para AC/AV |

O banco deve aceitar o novo tipo sem alterar registros existentes.

## 2. Visao Unificada

Nao criar tabela `work_items`.

Criar um tipo de aplicacao:

```ts
type WorkItemKind =
  | "task"
  | "priority"
  | "deliverable"
  | "audit"
  | "challenge";

interface WorkItem {
  id: string;
  kind: WorkItemKind;
  clientId: string;
  title: string;
  status: string;
  assigneeIds: string[];
  assigneeNames: string[];
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  sourcePath: string;
}
```

O hook `useClientWorkItems(clientId)` agrega e normaliza os dominios.

## 3. Auditorias

### `audits`

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | uuid PK | |
| `title` | text | |
| `description` | text nullable | |
| `objective` | text nullable | |
| `status` | text | draft, active, closed, cancelled |
| `starts_at` | timestamptz | |
| `due_at` | timestamptz nullable | |
| `closed_at` | timestamptz nullable | |
| `created_by` | uuid | Usuario autenticado |
| `validated_by` | uuid nullable | Admin |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `audit_client_items`

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | uuid PK | |
| `audit_id` | uuid FK | |
| `client_id` | uuid FK | Apenas AC da campanha |
| `status` | text | Estado individual |
| `assignee_id` | uuid nullable | |
| `notes` | text nullable | |
| `started_at` | timestamptz nullable | |
| `completed_at` | timestamptz nullable | |
| `validated_at` | timestamptz nullable | |
| `validated_by` | uuid nullable | |

Restricao unica: `(audit_id, client_id)`.

### `audit_criteria`

Define os itens que precisam ser verificados em uma auditoria.

### `audit_client_results`

Registra resultado, observacao e evidencia por criterio e cliente.

Restricao unica: `(audit_client_item_id, audit_criterion_id)`.

### Criacao atomica

Criar uma RPC que:

1. cria a auditoria;
2. seleciona o snapshot de clientes AC ativos;
3. cria todos os `audit_client_items`;
4. falha por inteiro se qualquer etapa falhar.

## 4. Desafios

### `challenges`

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | uuid PK | |
| `title` | text | |
| `description` | text nullable | |
| `success_criteria` | text | Condicao verificavel |
| `client_id` | uuid nullable | Desafio pode ser interno |
| `status` | text | draft, active, awaiting_validation, won, lost, cancelled |
| `due_at` | timestamptz | |
| `reward_superstars` | integer | Cada unidade vale 10 |
| `penalty_stars` | integer | Valor positivo convertido em debito |
| `created_by` | uuid | |
| `resolved_by` | uuid nullable | Admin |
| `resolved_at` | timestamptz nullable | |
| `resolution_notes` | text nullable | |

### `challenge_participants`

Usar `collaborator_id` por UUID. Restricao unica:
`(challenge_id, collaborator_id)`.

### `challenge_items`

Relaciona tarefas, prioridades ou entregaveis ao desafio sem duplicar o item.

### Resolucao atomica

A RPC `resolve_challenge` deve:

1. bloquear o desafio;
2. verificar se ainda nao foi resolvido;
3. atualizar o resultado;
4. criar uma transacao integral por participante;
5. registrar auditoria;
6. impedir processamento duplicado.

## 5. Tesouro de Estrelas

### `star_transactions`

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | uuid PK | |
| `collaborator_id` | uuid FK | |
| `amount` | integer | Positivo ou negativo |
| `transaction_type` | text | Tipo da movimentacao |
| `source_type` | text nullable | deliverable, challenge, manual, settlement |
| `source_id` | uuid nullable | |
| `reason` | text | Obrigatorio para manual/ajuste |
| `created_by` | uuid | |
| `reverses_transaction_id` | uuid nullable | Estorno |
| `settlement_id` | uuid nullable | |
| `created_at` | timestamptz | |

Tipos iniciais:

- `opening_grant`;
- `deliverable_reward`;
- `challenge_reward`;
- `challenge_penalty`;
- `manual_award`;
- `manual_penalty`;
- `adjustment`;
- `reversal`;
- `settlement`.

Criar uma chave de idempotencia ou restricao por origem para evitar credito
duplicado.

### `star_settlements`

Cabecalho da liquidacao:

- periodo;
- taxa de conversao;
- total de estrelas;
- total em reais;
- administrador;
- data.

### `star_settlement_items`

Snapshot individual:

- colaborador;
- estrelas liquidadas;
- taxa;
- valor em reais;
- saldo anterior;
- saldo posterior.

### Views

`collaborator_star_balances`:

- total de creditos;
- total de debitos;
- saldo atual;
- saldo liquidado;
- saldo disponivel.

`team_treasure`:

- soma assinada dos saldos individuais;
- separacao de positivos e negativos;
- totais por ano.

## 6. Performance

Preferir views ou RPCs agregadas em vez de calcular tudo no React:

- `collaborator_performance_summary`;
- `team_performance_summary`;
- `performance_by_period`.

As consultas devem aceitar:

- periodo;
- colaborador;
- escopo AC/AV ou Universo Ramos;
- indicador de ordenacao.

## 7. Auditoria de acoes

Expandir o log para suportar:

- `entity_type`;
- `entity_id`;
- `actor_collaborator_id`;
- `action_type`;
- `before_data`;
- `after_data`;
- `metadata`;
- `created_at`.

Transacoes financeiras nao devem ser editadas ou excluidas diretamente.

Enquanto o login estiver adiado, a autoria usa o colaborador operacional
selecionado no painel. Uma futura autenticacao podera acrescentar
`actor_user_id` sem substituir o historico existente.
