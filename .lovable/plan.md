
# SISRAMOS - Sistema de Comentarios com Ciencia Direcionada

## Resumo

Evolucao completa do sistema de comentarios atual, transformando-o de um registro textual simples em um mecanismo de comunicacao estruturado com tres niveis (Informativo, Relevante, Ciencia Obrigatoria), confirmacao de leitura direcionada e hierarquia administrativa.

---

## Situacao Atual

- Tabela `client_comments` com colunas fixas `read_celine`, `read_gabi`, `read_darley`, `read_vanessa`, `read_patrick`
- Todos os comentarios sao tratados igualmente -- sem distincao de tipo
- Leitura e confirmacao sao toggle manual por colaborador, mas sem obrigatoriedade
- 5 colaboradores fixos no codigo (hardcoded)

---

## Arquitetura da Solucao

### 1. Mudancas no Banco de Dados

**Alteracoes na tabela `client_comments`:**

Adicionar colunas:
- `comment_type` (text, default `'informativo'`) -- valores: `informativo`, `relevante`, `ciencia`
- `required_readers` (text[], default `'{}'`) -- nomes dos colaboradores que devem confirmar (usado apenas quando `comment_type = 'ciencia'`)
- `read_timestamps` (jsonb, default `'{}'`) -- registro de data/hora de cada confirmacao (ex: `{"Patrick": "2026-02-11T14:00:00Z"}`)
- `is_closed` (boolean, default `false`) -- permite encerramento manual pelo admin
- `closed_by` (text) -- nome de quem encerrou
- `closed_at` (timestamptz) -- data/hora do encerramento

As colunas legadas `read_celine`, `read_gabi`, etc. serao mantidas para compatibilidade mas o novo fluxo usara `required_readers` + `read_timestamps`.

**Nova coluna em `clients`:**
- `pending_ciencia_count` (integer, default 0) -- contador de comentarios com ciencia pendente (para exibir no card da empresa)

**Trigger de contagem:**
- Funcao que recalcula `pending_ciencia_count` quando um comentario de ciencia e criado, deletado, ou quando todos os obrigatorios confirmam leitura.

---

### 2. Tipos TypeScript

**Atualizar `src/types/comment.ts`:**

```text
CommentType = 'informativo' | 'relevante' | 'ciencia'

ClientComment (atualizado):
  + commentType: CommentType
  + requiredReaders: string[]
  + readTimestamps: Record<string, string>  // nome -> ISO timestamp
  + isClosed: boolean
  + closedBy?: string
  + closedAt?: string

CommentFormData (atualizado):
  + commentType: CommentType
  + requiredReaders: string[]  // apenas para tipo 'ciencia'
```

---

### 3. Componentes Modificados

**`src/components/comments/CommentsModal.tsx`** (modal dentro do card da empresa):

- Campo de selecao de tipo de comentario ao criar (3 opcoes com icones)
- Quando tipo = `ciencia`: exibir seletor de colaboradores obrigatorios (checkboxes)
- Cada comentario exibe:
  - Badge de tipo (Informativo = cinza, Relevante = amarelo, Ciencia = vermelho)
  - Para tipo `ciencia`: lista de usuarios obrigatorios com status individual e timestamp de confirmacao
  - Estado dinamico: "Pendente", "Parcial", "Completo"
  - Botao de confirmar leitura (apenas para o usuario logado, se ele estiver na lista)
- Acoes do admin (Patrick):
  - Encerrar/reabrir comentario
  - Adicionar/remover leitores obrigatorios apos criacao

**`src/pages/CommentsPanel.tsx`** (painel central):

- Novo filtro por tipo de comentario
- Novo filtro "Aguardando minha ciencia" (mostra apenas comentarios onde o usuario logado esta pendente)
- KPIs atualizados: total, fixados, pendentes de ciencia (global), e por tipo
- Cards de comentario atualizados com badges de tipo e status de ciencia

**`src/components/comments/CommentButton.tsx`** e **`src/components/comments/CommentPreview.tsx`**:

- Contador no card da empresa reflete apenas comentarios com ciencia pendente (nao informativos)

---

### 4. Hook Atualizado

**`src/hooks/useClientComments.ts`:**

- `addComment` aceita `commentType` e `requiredReaders`
- Nova funcao `confirmReading(commentId)` -- marca leitura do usuario atual com timestamp
- Nova funcao `closeComment(commentId)` -- encerra (admin only)
- Nova funcao `reopenComment(commentId)` -- reabre (admin only)
- Nova funcao `updateRequiredReaders(commentId, readers)` -- modifica lista (admin only)
- Logica de verificacao de admin: `currentUser === 'Patrick'`

---

### 5. Logica de Permissoes

| Acao | Admin (Patrick) | Outros |
|------|----------------|--------|
| Criar qualquer tipo | Sim | Sim |
| Selecionar leitores obrigatorios | Qualquer usuario | Qualquer usuario |
| Confirmar propria leitura | Sim | Sim (se estiver na lista) |
| Visualizar pendencias de todos | Sim | Apenas as proprias |
| Adicionar/remover leitores apos criacao | Sim | Nao |
| Encerrar comentario com ciencia | Sim | Nao |
| Reabrir comentario encerrado | Sim | Nao |

---

### 6. Experiencia Visual

**Badge de tipo no comentario:**
- Informativo: `bg-gray-100 text-gray-600` (sem destaque)
- Relevante: `bg-amber-100 text-amber-700` (destaque visual)
- Ciencia Obrigatoria: `bg-red-100 text-red-700` (alerta)

**Status de ciencia no card:**
- Pendente (0 confirmacoes): icone vermelho, borda vermelha sutil
- Parcial: icone amarelo com fração (ex: "2/4"), borda amarela
- Completo: icone verde, visual neutro
- Encerrado manualmente: badge "Encerrado" cinza

**Card da empresa:**
- Contador mostra apenas ciencias pendentes (nao informativos)
- Tooltip com resumo: "3 comentarios aguardando ciencia"

---

### 7. Area "Aguardando minha ciencia"

No painel de comentarios, filtro rapido que mostra ao usuario logado apenas os comentarios onde:
- `comment_type = 'ciencia'`
- O nome do usuario esta em `required_readers`
- O nome do usuario NAO esta em `read_timestamps`
- O comentario nao esta encerrado (`is_closed = false`)

---

## Arquivos Impactados

1. **Migracao SQL** -- alterar `client_comments`, adicionar coluna em `clients`, criar trigger
2. **`src/types/comment.ts`** -- novos tipos
3. **`src/hooks/useClientComments.ts`** -- CRUD expandido
4. **`src/components/comments/CommentsModal.tsx`** -- formulario e exibicao
5. **`src/pages/CommentsPanel.tsx`** -- filtros e cards
6. **`src/components/comments/CommentButton.tsx`** -- contador atualizado
7. **`src/components/comments/CommentPreview.tsx`** -- preview atualizado

Nenhuma mudanca em autenticacao ou rotas. A hierarquia admin usa a verificacao existente pelo nome do usuario (`Patrick`).
