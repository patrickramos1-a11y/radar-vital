

## Sistema de Respostas a Comentarios Especificos (Threading)

### Objetivo

Adicionar a capacidade de responder a um comentario especifico, criando uma conexao visual entre a resposta e o comentario original. Isso organiza a conversa por contexto, evitando que respostas pareçam comentarios soltos sobre outro assunto.

### Como Vai Funcionar

- Cada comentario tera um botao "Responder"
- Ao clicar, o formulario de novo comentario exibe uma barra indicando a qual comentario a resposta e direcionada (com preview do texto original e nome do autor)
- A resposta e salva com referencia ao comentario pai (`reply_to_id`)
- Na listagem, respostas aparecem visualmente conectadas ao comentario pai: com uma barra lateral colorida e recuo, mostrando "Em resposta a [Autor]: [trecho do texto]"
- Comentarios raiz (sem resposta) continuam com a aparencia atual
- O usuario pode cancelar a resposta e voltar a escrever um comentario normal

---

### Detalhamento Tecnico

#### 1. Migracao de Banco de Dados

Adicionar coluna `reply_to_id` na tabela `client_comments`:

```sql
ALTER TABLE public.client_comments
  ADD COLUMN reply_to_id uuid REFERENCES public.client_comments(id) ON DELETE SET NULL;
```

Quando o comentario pai e apagado, a referencia vira `NULL` e a resposta permanece como comentario independente.

#### 2. `src/types/comment.ts`

Adicionar campo `replyToId?: string` ao tipo `ClientComment`.

Adicionar campo `replyToId?: string` ao tipo `CommentFormData`.

#### 3. `src/hooks/useClientComments.ts`

- Mapear `reply_to_id` no `mapRow` para `replyToId`
- No `addComment`, incluir `reply_to_id` no insert quando fornecido
- Sem mudancas nos demais metodos

#### 4. `src/components/comments/CommentsModal.tsx`

**Estado novo**: `replyingTo: ClientComment | null` -- controla a qual comentario o usuario esta respondendo.

**Formulario de input**:
- Quando `replyingTo` nao e null, exibir uma barra acima do textarea com:
  - Borda lateral verde/primary
  - "Respondendo a [AuthorName]"
  - Trecho do texto original (truncado em 80 chars)
  - Botao X para cancelar a resposta

**Cada CommentItem**:
- Adicionar botao "Responder" (icone Reply) na barra de acoes
- Quando o comentario tem `replyToId`, exibir bloco de citacao acima do texto:
  - Barra lateral colorida + "Em resposta a [Autor]:" + trecho truncado
  - Clicavel para scroll ate o comentario original (opcional, melhoria futura)

**Agrupamento visual**:
- Comentarios com `replyToId` recebem um recuo leve (`ml-4`) e uma barra lateral (`border-l-2 border-primary/30`)
- O comentario pai permanece com a indentacao normal

#### 5. `src/pages/CommentsPanel.tsx`

Mesmas alteracoes visuais: botao Responder, barra de citacao, e passagem de `replyingTo` para o formulario de criacao.

#### 6. `src/components/comments/CommentPreview.tsx`

Quando um comentario no preview tem `replyToId`, exibir uma linha sutil "↩ Resposta" antes do texto.

---

### Arquivos Afetados

| Arquivo | Mudanca |
|---|---|
| `supabase/migrations/` | Nova coluna `reply_to_id` |
| `src/types/comment.ts` | Campo `replyToId` nos tipos |
| `src/hooks/useClientComments.ts` | Mapear e inserir `reply_to_id` |
| `src/components/comments/CommentsModal.tsx` | Botao Responder + barra de citacao + estado `replyingTo` |
| `src/pages/CommentsPanel.tsx` | Mesmas alteracoes de resposta |
| `src/components/comments/CommentPreview.tsx` | Indicador visual de resposta |

### Experiencia Visual Esperada

```text
+------------------------------------------+
| [Informativo] Patrick  14/02 10:18       |
| Chegou uma nova notificacao na unidade   |
| de benivides. O que iremos fazer?        |
| [Lido 4/5]              [Responder] [..] |
+------------------------------------------+
  | +--------------------------------------+
  | | ↩ Em resposta a Patrick:             |
  | | "Chegou uma nova notificacao na..."  |
  | |                                      |
  | | [Informativo] Darley  14/02 11:30    |
  | | Ja enviei email para o responsavel.  |
  | | [Lido 2/5]            [Responder]    |
  | +--------------------------------------+
```

O recuo e a barra lateral deixam claro que a resposta de Darley e direcionada ao comentario de Patrick, e nao um comentario novo sobre outro assunto.
