

## Refatoracao dos Filtros "De Boa/Com Alerta" e Logica de Comentarios

### Problema Central

Atualmente, o filtro "De Boa"/"Com Alerta" varia por usuario porque depende da leitura individual (`read_celine`, `read_patrick`, etc.). Isso causa divergencia: Patrick ve 18 "De Boa" e 31 "Com Alerta", enquanto Darley ve 28/21 (conforme screenshots). A leitura individual nao deveria impactar o estado global do card.

### Resumo das Mudancas

1. **Novo campo `is_archived`** no banco de dados para controlar arquivamento
2. **"De Boa/Com Alerta" passa a ser global** -- baseado em existencia de comentarios ativos (nao arquivados), igual para todos os usuarios
3. **Contagem de badges nos cards** tambem global -- conta comentarios ativos (nao arquivados)
4. **Abas renomeadas**: "Resolvidos" vira "Lidos" (filtro individual por usuario) + nova aba "Arquivados"
5. **Botao "Arquivar"** nos comentarios (modal e painel central)

---

### Detalhamento Tecnico

#### 1. Migracao de Banco de Dados

Adicionar coluna `is_archived` a tabela `client_comments`:

```sql
ALTER TABLE public.client_comments
  ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN archived_by text,
  ADD COLUMN archived_at timestamptz;
```

#### 2. `useClientComments.ts` -- Hook Principal

- Adicionar funcao `archiveComment(commentId)` que seta `is_archived = true`, `archived_by`, `archived_at`
- Adicionar funcao `unarchiveComment(commentId)` para desarquivar
- **Alterar `useAllClientsCommentCountsWithRefresh`**: remover logica per-user. Contar apenas comentarios onde `is_archived = false` (global, igual para todos)
- **Alterar `useAllClientsCommentCounts`**: mesma logica global

Logica nova do count:
```text
Para cada cliente: COUNT de comentarios WHERE is_archived = false
```

Isso elimina a divergencia entre perfis.

#### 3. `Index.tsx` -- Filtro "De Boa" / "Com Alerta"

Alterar `isClienteDeBoa`:
```text
getCommentCount(client.id) === 0
```
Como o `getCommentCount` agora retorna apenas comentarios nao-arquivados (global), o filtro sera identico para todos os usuarios.

Nenhuma outra mudanca necessaria nesta funcao.

#### 4. `CommentsModal.tsx` -- Modal de Comentarios por Cliente

**Abas**:
- "Pendentes" -- comentarios nao-arquivados onde o usuario logado NAO marcou como lido
- "Lidos" (antes "Resolvidos") -- comentarios nao-arquivados onde o usuario logado JA marcou como lido
- "Arquivados" -- comentarios onde `is_archived = true`
- "Todos" -- todos os comentarios

**Botao "Arquivar"**:
- Icone de Archive ao lado dos botoes de acao (pin, delete, edit)
- Visivel para todos os usuarios
- Ao arquivar: comentario sai da lista principal, vai para aba "Arquivados"
- Na aba "Arquivados": botao para "Desarquivar"

**Logica de "Pendente/Lido" por usuario**:
```text
Para usuario X:
  - Pendente = read_X === false AND is_archived === false
  - Lido = read_X === true AND is_archived === false
```

#### 5. `CommentsPanel.tsx` -- Painel Central de Comentarios

Mesmas alteracoes de abas e botao de arquivar do modal.

**KPIs no topo**:
- "Pendentes" = total de comentarios nao-arquivados (global)
- Pendencia por colaborador = para cada colaborador, quantos comentarios nao-arquivados ele ainda nao leu
- Fixados e Ciencia permanecem como estao

#### 6. `CommentButton.tsx` -- Badge no Card do Cliente

O badge ja usa `commentCount` que vem do hook. Com a mudanca do hook para contar apenas nao-arquivados, o badge automaticamente refletira apenas comentarios ativos.

#### 7. Regra do Patrick

Permanece inalterada -- Patrick so pode marcar como lido quando todos os outros ja marcaram.

---

### Arquivos Afetados

| Arquivo | Mudanca |
|---|---|
| `supabase/migrations/` | Nova migracao: `is_archived`, `archived_by`, `archived_at` |
| `src/types/comment.ts` | Adicionar `isArchived`, `archivedBy`, `archivedAt` ao tipo |
| `src/hooks/useClientComments.ts` | Funcoes archive/unarchive + count global (sem per-user) |
| `src/components/comments/CommentsModal.tsx` | Abas Pendentes/Lidos/Arquivados/Todos + botao Arquivar |
| `src/pages/CommentsPanel.tsx` | Mesmas abas + botao Arquivar + KPIs ajustados |
| `src/components/comments/CommentButton.tsx` | Mapear `isArchived` no fetch de preview |
| `src/pages/Index.tsx` | Nenhuma mudanca necessaria (ja usa `getCommentCount`) |

