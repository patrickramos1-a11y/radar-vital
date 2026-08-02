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
| `success_criteria` | text | Resumo de compatibilidade das condicoes verificaveis |
| `client_id` | uuid nullable | Desafio pode ser interno |
| `status` | text | draft, active, awaiting_validation, won, lost, cancelled |
| `due_at` | timestamptz | |
| `reward_superstars` | integer | Cada unidade vale 10 |
| `penalty_stars` | integer | Valor positivo convertido em debito |
| `created_by` | uuid | |
| `resolved_by` | uuid nullable | Admin |
| `resolved_at` | timestamptz nullable | |
| `resolution_notes` | text nullable | |

### `challenge_completion_conditions`

Cada desafio possui uma ou mais condicoes verificaveis, usadas como checklist
de progresso. O contexto que nao for um check pertence a `challenges.description`.

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | uuid PK | |
| `challenge_id` | uuid FK | Desafio ao qual pertence |
| `title` | text | Condicao verificavel |
| `sort_order` | integer | Ordem de exibicao |
| `is_required` | boolean | Entra no percentual de progresso |
| `completed_at` | timestamptz nullable | Momento do check |
| `completed_by` | text nullable | Pessoa que marcou |

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

### Oportunidades e recompensas individuais

O Banco de Oportunidades amplia o dominio de desafios sem substituir as
tabelas financeiras existentes.

#### `collaborator_reward_profiles`

Define o perfil de recompensa independente do cadastro do colaborador:
`production`, `intern`, `provider` ou `admin`.

#### `treasury_memberships`

Controla a adesao ao Tesouro. Apenas o estado `active` de um perfil
`production` participa de ranking e de saldo coletivo.

#### `star_value_rates`

Historico de cotacoes por estrela-base. A primeira vigencia e R$ 1,00 por
estrela; cada Super Estrela representa dez estrelas-base. Nenhum lancamento
financeiro deve consultar a taxa atual depois de criado: ele guarda a taxa
congelada da sua propria vigencia.

#### `challenge_acceptance_requests`

Solicitacao de aceite contendo prazo proposto, proposta de Super Estrelas para
desafios sem valor e destino solicitado (`treasury` ou `individual`). A
solicitacao nao cria participante ativo, estrelas ou dinheiro ate a decisao de
Patrick.

#### `individual_reward_transactions`

Livro financeiro imutavel e separado de `star_transactions`. Cada linha guarda
estrelas brutas, taxa congelada, percentual pago, valor em reais, situacao do
pagamento e chave de idempotencia. Producao em saque individual recebe 25%;
estagiarios e prestadores recebem 100%.

#### Destino de recompensa

- Participante de producao ativo no Tesouro: desafios individuais exigem
  `treasury`; desafios gerais podem permitir escolha.
- Estagiario e prestador: somente `individual`; nunca entram no ranking.
- Participantes legados sem destino explicito preservam o comportamento de
  Tesouro ate que o administrador os reconfigure.

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
