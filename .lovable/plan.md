
## Problema Central

O sistema atual de contagem de comentários pendentes usa uma lógica global: um comentário é "pendente" se **qualquer** colaborador ainda não o leu. O badge no card do cliente mostra essa contagem global, independentemente de quem está logado.

O que o usuário quer: cada colaborador vê apenas **seus próprios** comentários não lidos. Se a Vanessa marcou como lido, o badge dela zera — mesmo que Patrick ainda não tenha lido.

---

## Diagnóstico Técnico

### Estrutura atual no banco
A tabela `client_comments` tem colunas booleanas por colaborador fixo:
- `read_celine`, `read_gabi`, `read_darley`, `read_vanessa`, `read_patrick`

### Lógica atual (errada para o objetivo)
```
function hasPendingReads(row): boolean {
  return !(row.read_celine && row.read_darley && row.read_gabi && row.read_vanessa && row.read_patrick);
}
```
Essa função retorna `true` se **qualquer** colaborador não leu — é uma visão global.

### Lógica necessária (por usuário)
A contagem exibida no card deve ser calculada de forma **personalizada por usuário logado**:
- Se o usuário é **Vanessa** → contar apenas comentários onde `read_vanessa = false`
- Se o usuário é **Patrick** → contar apenas comentários onde `read_patrick = false`
- Se nenhum usuário selecionado → comportamento atual (visão global)

---

## Arquitetura da Solução

### Parte 1 — Refatorar `useAllClientsCommentCountsWithRefresh` no hook

Adicionar o nome do usuário atual como parâmetro do hook. A função de contagem passa a filtrar por apenas **um campo** baseado no usuário logado:

```
// Mapear nome → coluna do banco
const USER_TO_COLUMN: Record<string, string> = {
  celine: 'read_celine',
  gabi: 'read_gabi',
  darley: 'read_darley',
  vanessa: 'read_vanessa',
  patrick: 'read_patrick',
};

function hasPendingForUser(row: any, userColumn: string | null): boolean {
  if (!userColumn) {
    // Visão global (sem usuário selecionado): usa lógica original
    return !(row.read_celine && row.read_darley && row.read_gabi && row.read_vanessa && row.read_patrick);
  }
  return !row[userColumn];
}
```

### Parte 2 — Passar o usuário atual para o hook em `Index.tsx`

O `useAllClientsCommentCountsWithRefresh` receberá o `currentUser?.name` como parâmetro, e vai recalcular contagens sempre que o usuário mudar.

### Parte 3 — Ajustar a lógica de "De Boa" / "Com Alerta"

A função `isClienteDeBoa` em `Index.tsx` usa `getCommentCount(client.id) === 0`. Como agora a contagem já será personalizada por usuário, essa lógica continua correta automaticamente.

### Parte 4 — Garantir que o `toggleReadStatus` atualiza a contagem em tempo real

Quando o usuário clica em "Lido" dentro do modal, a função `toggleReadStatus` em `useClientComments.ts` já atualiza o banco. Mas precisa disparar o refresh do `globalRefreshCallback` para atualizar o badge do card imediatamente. Será adicionado `triggerCommentCountRefresh()` após o update bem-sucedido em `toggleReadStatus`.

---

## Arquivos a Modificar

### 1. `src/hooks/useClientComments.ts`
- Modificar `useAllClientsCommentCountsWithRefresh(currentUserName?: string)` para aceitar o nome do usuário
- Atualizar `hasPendingReads` para a nova função `hasPendingForUser`  
- Dentro de `toggleReadStatus`, chamar `triggerCommentCountRefresh()` após update bem-sucedido para atualizar badges imediatamente

### 2. `src/pages/Index.tsx`
- Importar `useAuth` e obter `currentUser`
- Passar `currentUser?.name` para `useAllClientsCommentCountsWithRefresh(currentUser?.name)`
- A lógica do "De Boa" se beneficia automaticamente

---

## Comportamento Esperado Após a Mudança

| Cenário | Antes | Depois |
|---|---|---|
| Vanessa marca como lido | Badge permanece (Patrick ainda não leu) | Badge de Vanessa zera |
| Patrick abre o painel | Vê contagem global | Vê apenas seus não lidos |
| Sem usuário selecionado | Contagem global | Mantém contagem global |
| "De Boa" com usuário A | Baseado em contagem global | Baseado nos pendentes do usuário A |

---

## Detalhes Técnicos

A função `useAllClientsCommentCountsWithRefresh` precisa ser reativa ao `currentUserName`. Para isso:
- O parâmetro `currentUserName` entra no `useCallback` deps array do `fetchCounts`
- Quando o usuário muda no seletor de usuários, o `fetchCounts` re-executa automaticamente, recalculando todos os badges do painel

O mapeamento de nome → coluna de banco:
```
const USER_COLUMN_MAP: Record<string, string> = {
  'celine':  'read_celine',
  'gabi':    'read_gabi',
  'darley':  'read_darley',
  'vanessa': 'read_vanessa',
  'patrick': 'read_patrick',
};
```
Nomes são normalizados para lowercase para comparação segura.
