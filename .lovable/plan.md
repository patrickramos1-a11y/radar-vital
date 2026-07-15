# Evolução dos Entregáveis — Filtros, Solicitante e Duração

## 1. Banco de dados (migração)

Adicionar coluna `requester` (texto simples) na tabela `deliverables`:

- `requester TEXT NULL` — nome do colaborador solicitante. Opcional. Não afeta permissões nem status.
- Não altera lógica de responsáveis (`assigned_to`) nem de avaliação.
- Duração real é calculada em runtime a partir de `created_at` e `completed_at` — não precisa de coluna nova.

## 2. Cadastro / edição (DeliverableModal)

- Novo campo **Solicitante** (opcional, seleção única) logo abaixo de Responsáveis. Fonte: mesma lista de colaboradores já usada em Responsáveis (inclui os que não participam do painel). Botão "Nenhum" para limpar.
- Preview de duração ao editar: se em aberto, mostra "X dias em aberto"; se concluído, mostra "concluído em Y dias".
- Sem input manual de duração — cálculo é automático.

## 3. Card do entregável (DeliverablesTab)

Adicionar duas informações ao card, em linha discreta abaixo do nome/descrição:

- **Solicitante** (quando existir): chip pequeno com avatar/inicial + nome, prefixado por "Solicitado por".
- **Dias**: 
  - Em aberto/andamento → `Ícone relógio + "X dias em aberto"`.
  - Concluído → `"concluído em Y dias"` (usa `completed_at - created_at`).
  - Cancelado → oculto.

## 4. Barra de filtros (nova, acima da lista de entregáveis)

Barra compacta com múltiplos grupos, todos multi-seleção (chips clicáveis):

- **Status**: Aberto · Em andamento · Concluído · Cancelado. (Substitui o toggle atual "incluir concluídos".)
- **Avaliação**: Joinha · Estrela · Super Estrela — filtra entregáveis que receberam pelo menos uma daquele tipo.
- **Sem avaliação** (dois toggles independentes):
  - `Sem nenhuma avaliação` — entregáveis concluídos com 0 avaliações totais.
  - `Não avaliei ainda` — entregáveis concluídos onde o usuário logado ainda não deu sua avaliação.
- **Solicitante**: dropdown multi-select com lista de colaboradores que aparecem como solicitantes.

Regras:

- Filtros combinam com **AND** entre grupos e **OR** dentro do mesmo grupo.
- Botão "Limpar filtros" quando algum estiver ativo.
- Contador "N de M entregáveis" ao lado.

## 5. KPIs da aba (mini-cards existentes)

Continuam refletindo o colaborador selecionado, mas passam a respeitar os filtros ativos (Total, Concluídos, Pendentes, % Conclusão, Joinhas, Estrelas, Super, Pontos).

## Arquivos afetados

```text
supabase/migrations/…_add_requester_to_deliverables.sql   (novo)
src/types/deliverable.ts                                  (+ requester)
src/hooks/useDeliverables.ts                              (map/insert/update requester)
src/components/central-entregas/DeliverableModal.tsx      (campo Solicitante + preview duração)
src/components/central-entregas/DeliverablesTab.tsx       (barra de filtros + KPIs filtrados)
src/components/central-entregas/DeliverableCard*          (solicitante + dias no card — inline em DeliverablesTab)
```

## Fora de escopo

- Nenhuma alteração em Prioridades, Tarefas, Comentários, Performance ou Histórico.
- Sem mudança em permissões/RLS.
- Sem alteração no cálculo de pontuação/ranking.
