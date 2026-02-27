

## Corrigir respostas de respostas que nao aparecem no modal de comentarios

### Problema
No `CommentsModal.tsx`, quando voce responde a um comentario que ja e uma resposta de outro, o novo comentario nao aparece. Isso acontece porque o codigo so renderiza respostas diretas ao comentario raiz (1 nivel de profundidade). Respostas de respostas (nivel 2+) ficam "perdidas".

Exemplo:
- Comentario A (raiz) -- aparece
  - Comentario B (resposta de A) -- aparece via `repliesMap.get(A.id)`
    - Comentario C (resposta de B) -- NAO aparece, pois `repliesMap.get(B.id)` nunca e renderizado

### Solucao
Modificar a logica de coleta de respostas em `CommentsModal.tsx` para coletar TODOS os descendentes de um comentario raiz recursivamente, nao apenas os filhos diretos. Todas as respostas (de qualquer profundidade) aparecerao abaixo do comentario raiz, ordenadas cronologicamente, cada uma com seu quote block referenciando o pai direto.

### Mudancas no arquivo `src/components/comments/CommentsModal.tsx`

**1. Substituir o repliesMap por uma funcao que coleta todos os descendentes**

Criar uma funcao `getAllDescendants(rootId)` que percorre recursivamente o `repliesMap` e retorna todos os descendentes de um comentario raiz, ordenados por data de criacao.

**2. Atualizar a renderizacao (linhas 283-304)**

Em vez de:
```
{(repliesMap.get(comment.id) || []).map((reply) => (
  <div key={reply.id} className="ml-4 ...">
    <CommentItem ... />
  </div>
))}
```

Usar:
```
{getAllDescendants(comment.id).map((reply) => (
  <div key={reply.id} className="ml-4 ...">
    <CommentItem ... />
  </div>
))}
```

A funcao `getAllDescendants` vai percorrer:
- Filhos diretos de A -> [B]
- Filhos diretos de B -> [C]
- Resultado final: [B, C] (ordenado cronologicamente)

Cada resposta continua mostrando o quote block do seu pai direto (via `replyToId`), entao a referencia visual fica correta.

### Resultado esperado
- Responder a um comentario que ja e resposta agora mostra o novo comentario abaixo do raiz
- O quote block referencia corretamente o comentario pai direto
- Compatibilidade mantida com a aba global de comentarios (CommentsPanel), que ja usa lista plana
