

## Redesign Visual dos Comentarios (Estilo WhatsApp) + Correcao de Filtros

### 1. Redesign Visual - Estilo WhatsApp

Transformar os comentarios de "cards formais" para "baloes de conversa" inspirados no WhatsApp:

**Layout dos baloes:**
- Comentarios do usuario atual: alinhados a direita, fundo verde claro (`bg-emerald-100/80`)
- Comentarios de outros: alinhados a esquerda, fundo branco/card (`bg-card`)
- Cantos arredondados assimetricos (ponta no canto superior do lado do autor)
- Largura maxima de ~80% do container
- Timestamp discreto no canto inferior direito do balao
- Nome do autor em texto colorido no topo (usando a cor do colaborador)
- Badge de tipo (Informativo/Relevante/Ciencia) compacto ao lado do nome
- Indicador "(editada)" discreto junto ao timestamp
- Botoes de acao (pin, responder, editar, excluir, arquivar) aparecem no hover, flutuando acima do balao

**Citacao de resposta (reply quote):**
- Bloco colorido dentro do balao, acima do texto
- Barra lateral com cor do autor original
- Nome do autor + trecho do texto truncado

**Status de leitura (V / VV):**
- Simplificado no canto inferior do balao junto ao horario
- Check simples ou duplo, com contagem discreta
- Popover de info permanece acessivel via clique no check

**Ciencia obrigatoria:**
- Mantida como secao interna do balao, porem mais compacta

### 2. Reordenacao dos Filtros

Ordem atual: `Pendentes | Lidos | Arquivados | Todos`

Nova ordem: `Todos | Pendentes | Lidos | Arquivados`

Aplicar em ambos:
- `CommentsModal.tsx` (modal do cliente)
- `CommentsPanel.tsx` (painel global)

### 3. Contagem de "Todos" sem Arquivados

Atualmente "Todos" mostra `comments.length` (inclui arquivados).

Correcao: "Todos" deve mostrar apenas comentarios nao-arquivados (`activeComments.length`) e filtrar por `activeComments` em vez de `comments`.

O estado padrao de `viewFilter` muda para `'todos'` (em vez de `'pendentes'`).

### Arquivos Afetados

| Arquivo | Mudanca |
|---|---|
| `src/components/comments/CommentsModal.tsx` | Redesign visual WhatsApp dos baloes (CommentItem), reordenar filtros, corrigir contagem "Todos" |
| `src/pages/CommentsPanel.tsx` | Redesign visual WhatsApp dos cards (CommentCard), reordenar filtros, corrigir contagem "Todos" |

### Detalhamento Tecnico

**CommentsModal.tsx - CommentItem:**
- Adicionar logica `const isOwnComment = comment.authorName === currentUserName`
- Container: `flex` com `justify-end` (proprio) ou `justify-start` (outros)
- Balao: `max-w-[80%]` com `rounded-2xl` + `rounded-tr-sm` (proprio) ou `rounded-tl-sm` (outros)
- Cores: proprio = `bg-emerald-50 dark:bg-emerald-900/20`, outros = `bg-card border border-border`
- Mover timestamp para inline com o status de leitura no rodape do balao
- Acoes no hover: container `absolute -top-3 right-2` com botoes em linha

**CommentsModal.tsx - Filtros:**
- Reordenar botoes: Todos, Pendentes, Lidos, Arquivados
- "Todos" usa `activeComments` (sem arquivados) na contagem e filtragem
- Default `viewFilter` = `'todos'`

**CommentsPanel.tsx - CommentCard:**
- Mesmo redesign de balao aplicado ao grid de cards
- Adaptar para funcionar dentro do VisualGrid mantendo responsividade
- Mesmas correcoes de filtros e contagem

**CommentsPanel.tsx - Filtros:**
- Mesma reordenacao: Todos, Pendentes, Lidos, Arquivados
- Mesma correcao de contagem

