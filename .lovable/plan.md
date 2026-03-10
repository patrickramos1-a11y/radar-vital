

## Botão "+" para criar tarefa a partir de comentário

### O que será feito
Adicionar um botão "+" no footer de cada card de comentário (ao lado do "Responder" e do status de leitura) que abre um Popover para criar uma tarefa com o texto do comentário pré-preenchido e seletor de responsável.

### Onde será implementado
1. **`src/components/comments/CommentsModal.tsx`** — CommentItem (modal de comentários do cliente)
2. **`src/pages/CommentsPanel.tsx`** — PanelCommentCard (painel global de comentários)

### Componente reutilizável
Criar um componente `CreateTaskFromComment` (ou inline nos dois locais) que:
- Recebe `commentText`, `clientId`, `clientName`, `collaborators`, e callback `onTaskCreated`
- Renderiza um botão "+" (ícone `Plus`, mesmo tamanho dos outros botões do footer)
- Ao clicar, abre um `Popover` com:
  - Campo título pré-preenchido com o texto do comentário (editável, truncado se longo)
  - Select de responsável (lista dinâmica dos colaboradores com cores)
  - Botão "Criar Tarefa"
- Usa o hook `useTasks` → `addTask(clientId, { title, assigned_to })` para salvar

### Mudanças por arquivo

**Novo: `src/components/comments/CreateTaskFromComment.tsx`**
- Componente Popover com formulário compacto
- Props: `commentText`, `clientId`, `clientName`, `collaborators[]`
- Usa `useTasks()` internamente para chamar `addTask`

**`src/components/comments/CommentsModal.tsx`**
- Importar `CreateTaskFromComment`
- Adicionar no footer do CommentItem, entre "Responder" e ReadStatusBar
- Passar `comment.commentText`, `clientId` (do props do modal), `clientName`, `collaborators`

**`src/pages/CommentsPanel.tsx`**
- Importar `CreateTaskFromComment`
- Adicionar no footer do PanelCommentCard, entre o botão Reply e PanelReadStatusBar
- Passar `comment.commentText`, `comment.clientId`, `comment.clientName`, `collaborators`

### UX
- Botão discreto (mesmo estilo dos outros: `text-muted-foreground hover:text-primary`)
- Popover compacto (~250px) com título pré-preenchido e select de usuário
- Toast de sucesso ao criar tarefa
- Popover fecha automaticamente após criação

