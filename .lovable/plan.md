
# Redesign da Central de Entregas

Objetivo: transformar a página numa **central operacional executiva** — leitura rápida, hierarquia clara entre "ação agora" e "histórico", com logos de clientes em todos os itens e gamificação forte na aba Performance.

Sobre o comentário final: não consigo executar `git pull` — o ambiente de trabalho é gerido pela plataforma, não por git manual. Farei o redesign sobre o código atual desta workspace. Se houver alterações feitas via Codex que ainda não estão aqui, elas precisam vir pela sincronização da plataforma antes. Sobre publicar: ao final apresento o botão de publish.

---

## 1. Estrutura nova de `CentralEntregas.tsx`

```text
┌────────────────────────────────────────────────────────────────┐
│  HEADER + RESUMO GLOBAL (KPIs da equipe + destaques do mês)   │
├────────────────────────────────────────────────────────────────┤
│  SELETOR RICO DE COLABORADORES (chips com stats + botão EQUIPE)│
├────────────────────────────────────────────────────────────────┤
│  PAINEL DO SELECIONADO (visão geral rápida — "ação agora")     │
├────────────────────────────────────────────────────────────────┤
│  ABAS: Prioridades | Tarefas | Comentários | Entregáveis |     │
│        Histórico | Performance                                 │
└────────────────────────────────────────────────────────────────┘
```

O modo **EQUIPE** (novo) substitui a lógica atual de "colaborador default = Patrick" e mostra visão consolidada.

---

## 2. Componentes a criar

- `central-entregas/GlobalSummary.tsx` — 6 KPIs no topo:
  - Tarefas abertas (total equipe)
  - Prioridades abertas
  - Entregáveis concluídos (mês)
  - Comentários pendentes
  - 🏆 Melhor performance do mês (nome + score)
  - ⭐ Mais estrelas (nome + total)
- `central-entregas/CollaboratorChip.tsx` — chip rico com avatar/foto, nome, badges (tarefas, prioridades, score). Estado ativo destacado.
- `central-entregas/TeamSelector.tsx` — substitui `ResponsibleSelector`. Grid de chips + botão "Equipe" (visão geral).
- `central-entregas/CollaboratorPanel.tsx` — painel-síntese acima das abas com 8 mini-KPIs: clientes, tarefas abertas, prioridades, tarefas concluídas, entregáveis, comentários pendentes, atrasados, pontuação.
- `central-entregas/ClientCell.tsx` — célula reutilizável com logo + nome (usada em todas as tabelas).
- `central-entregas/HistoryTab.tsx` — nova aba (concluídos, prioridades fechadas, comentários resolvidos, entregáveis; colapsada por padrão, filtro por período).
- `central-entregas/TeamOverview.tsx` — quando "Equipe" está selecionada, mostra ranking + comparativos.

## 3. Componentes existentes a refatorar

- **`PrioritiesTab.tsx`** — vira tabela executiva compacta: coluna Prioridade | Cliente (logo+nome) | Prazo | Dias | Nível | Ações. Ordenação por criticidade (nível desc, prazo asc, dias desc). Concluídas ficam no `HistoryTab`.
- **`TasksTab.tsx`** — adicionar coluna cliente com logo (`ClientCell`); botão "Nova tarefa" abrindo modal reutilizando `TaskModal` existente; toggle concluir inline (`useTasks.toggleComplete`). Concluídas movem-se para Histórico (filtro atual "Concluídas" removido daqui).
- **`CommentsTab.tsx`** — visual tipo caixa de entrada: linha com logo cliente + autor + preview + data + chip de status. Ações se já existirem no sistema.
- **`DeliverablesTab.tsx`** — separar em dois blocos: "Ranking oficial da equipe" (mantido) + lista de entregáveis do colaborador com logo do cliente. Concluídos ficam aqui; leaderboard fica também na aba Performance.
- **`PerformanceTab.tsx`** — reformular com dois modos:
  - **Individual**: cards de gamificação (⭐ estrelas, 👍 joinhas, ✨ super), tempo médio, taxa de conclusão, atrasados, evolução mês (gráfico existente), evolução ano (novo, agrupar por mês).
  - **Equipe**: 6 rankings lado a lado — estrelas, joinhas, entregáveis, prioridades concluídas, menor atraso médio, ranking geral (score composto).
- **`OverviewTab.tsx`** — enxugar; virar o `CollaboratorPanel` acima das abas (deixa de ser aba própria).

## 4. Modo Equipe

Quando `selected === 'EQUIPE'`:
- `CollaboratorPanel` esconde-se; aparece `TeamOverview`.
- Abas Prioridades/Tarefas/Comentários/Entregáveis mostram dados **de todos**, com coluna "Responsável" adicional.
- Performance vai direto para a visão de equipe.

## 5. Design tokens & visual

- Sem cards enormes: mais tabelas densas com bom espaçamento, chips e badges.
- Status: chips em `bg-*/10 text-*` (âmbar=pendente, verde=concluído, vermelho=atrasado/crítico, azul=prioridade).
- Itens concluídos: opacidade reduzida (`opacity-60`), sem line-through agressivo.
- Atrasados: borda-l vermelha + badge "Atrasado Xd".
- Logo cliente: componente já disponível via `Client.logo` — fallback com iniciais.
- Toda cor vem de tokens (`primary`, `muted`, etc.) — sem hex hardcoded.
- Responsivo: seletor vira scroll horizontal em mobile; tabelas ganham scroll-x.

## 6. Sem mudanças de banco

Todos os dados necessários já existem: `tasks`, `priorities`, `deliverables`, `deliverable_ratings`, `client_comments`, `clients` (com `logo`), `collaborators` (com `photo_url`). Nenhuma migration nesta rodada.

## 7. Compatibilidade

- Rotas: `/central-entregas` mantida.
- Hooks: `useTasks`, `usePriorities`, `useDeliverables`, `useDeliverableRatings`, `useCollaborators`, `useClients` — reaproveitados sem alterar assinatura.
- Nada removido; apenas reorganizado.

## Detalhes técnicos

- Novo estado em `CentralEntregas.tsx`: `selected: string | 'EQUIPE'`.
- Novo hook utilitário `useCentralStats(collaborator | 'EQUIPE')` (local no arquivo da página, sem file novo) que agrega KPIs a partir dos hooks existentes.
- `HistoryTab` usa `Collapsible` do shadcn, default `closed`, com filtros: últimos 7/30/90 dias.
- Ranking geral (Performance/Equipe) = `estrelas*1 + super*10 + entregáveis*2 + prioridadesConcluídas*3 - atrasados*1`. Fórmula documentada dentro do componente.
- Publish sugerido ao final via `presentation-open-publish`.

Confirma que posso implementar exatamente isso?
