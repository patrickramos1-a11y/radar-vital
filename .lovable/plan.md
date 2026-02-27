

## Correcao: Agrupar Respostas Sob o Comentario Pai (Threading Real)

### Problema Atual

Todos os comentarios (pais e respostas) aparecem em uma lista plana cronologica. Quando alguem responde um comentario, a resposta mostra a citacao do texto original E o comentario original tambem aparece separadamente na lista. Isso cria a sensacao de duplicacao.

### Solucao

Implementar agrupamento real de threads:
- Comentarios raiz (sem `replyToId`) aparecem no nivel superior
- Respostas ficam aninhadas logo abaixo do comentario pai, com recuo visual
- Respostas NAO aparecem mais como itens separados na lista principal

### Mudancas

**Arquivo: `src/components/comments/CommentsModal.tsx`**

1. Na logica de `filteredComments` (linhas ~99-115), separar comentarios raiz dos que sao respostas
2. Construir um mapa de `parentId -> replies[]` para agrupar respostas
3. Na renderizacao (linhas ~245-268), para cada comentario raiz:
   - Renderizar o comentario pai normalmente
   - Logo abaixo, renderizar suas respostas com recuo (`ml-4 border-l-2 border-primary/30`)
   - Respostas mantem a citacao do pai para contexto visual
4. Respostas nao aparecem mais como itens independentes no nivel superior

**Arquivo: `src/pages/CommentsPanel.tsx`**

Aplicar a mesma logica de agrupamento para manter paridade entre o modal e o painel global de comentarios.

### Logica de Agrupamento

```text
filteredComments (apenas raiz, sem replyToId)
  |
  +-- Comentario A (raiz)
  |     +-- Resposta A1 (replyToId = A)
  |     +-- Resposta A2 (replyToId = A)
  |
  +-- Comentario B (raiz)
  |     +-- Resposta B1 (replyToId = B)
  |
  +-- Comentario C (raiz, sem respostas)
```

### Resultado Visual

- Cada resposta aparece diretamente abaixo do comentario que a originou
- Sem duplicacao visual
- A citacao (quote block) permanece para dar contexto rapido
- Respostas sao ordenadas cronologicamente dentro de cada thread
