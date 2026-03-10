

## Contagem de comentarios pendentes por usuario

### Problema atual
O badge de comentarios no card do cliente mostra o total de comentarios nao-arquivados, igual para todos os usuarios. O correto e mostrar apenas os comentarios que o usuario logado ainda nao leu.

### Como funciona o read status
Cada comentario tem campos `read_celine`, `read_gabi`, `read_darley`, `read_vanessa`, `read_patrick` (boolean). O nome do usuario logado em lowercase mapeia para o campo correspondente. Um comentario e "pendente" para o usuario quando `read_<nome> = false`.

### Mudancas

**1. `src/hooks/useClientComments.ts` — `useAllClientsCommentCountsWithRefresh`**

Alterar a query para trazer tambem os campos `read_celine, read_gabi, read_darley, read_vanessa, read_patrick` alem de `client_id` e `is_archived`. Na contagem, filtrar apenas comentarios onde:
- `is_archived = false`
- `read_<currentUserName> = false` (ou seja, nao lido pelo usuario atual)

Se o usuario nao corresponder a nenhum ReadStatusName valido, manter o comportamento atual (contar todos nao-arquivados).

```typescript
const fetchCounts = useCallback(async () => {
  const { data, error } = await supabase
    .from('client_comments')
    .select('client_id, is_archived, read_celine, read_gabi, read_darley, read_vanessa, read_patrick');
  if (error) throw error;
  
  const readField = currentUserName ? `read_${currentUserName.toLowerCase()}` : null;
  const validFields = ['read_celine','read_gabi','read_darley','read_vanessa','read_patrick'];
  const useUserFilter = readField && validFields.includes(readField);
  
  const countMap = new Map<string, number>();
  (data || []).forEach(row => {
    if (row.is_archived) return;
    if (useUserFilter && row[readField]) return; // ja lido pelo usuario
    countMap.set(row.client_id, (countMap.get(row.client_id) || 0) + 1);
  });
  setCounts(countMap);
}, [currentUserName]);
```

**2. Mesma mudanca no `useAllClientsCommentCounts`** (se ainda for usado em outros lugares) — aplicar a mesma logica.

**3. Nenhuma mudanca nos componentes de UI** — os cards ja consomem `getCommentCount(clientId)` que vem desse hook, entao automaticamente vao mostrar o numero correto por usuario.

### Resultado
- Patrick ve "5" se tem 5 comentarios nao lidos por ele
- Celine ve "1" se tem 1 comentario nao lido por ela
- Cada usuario ve sua propria contagem de pendentes

