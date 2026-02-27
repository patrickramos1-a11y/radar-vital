

## Inverter ordem dos comentarios e scroll automatico para os mais recentes

### Problema atual
Os comentarios estao ordenados do mais novo (topo) para o mais antigo (fundo). O comportamento esperado e estilo WhatsApp: mais antigos no topo, mais novos embaixo, e ao abrir o modal ja estar posicionado nos comentarios mais recentes.

### Mudancas no arquivo `src/components/comments/CommentsModal.tsx`

**1. Inverter a ordenacao (linha 114)**
Trocar a ordenacao de `b - a` (desc) para `a - b` (asc), mantendo pinados no topo:
```
return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
```

**2. Auto-scroll para o final da lista**
- Adicionar um `useRef` e `useEffect` no componente `CommentsModal` para fazer scroll automatico ate o final do container de comentarios sempre que os comentarios forem carregados ou atualizados.
- Usar `ref.current.scrollTop = ref.current.scrollHeight` no container de overflow (linha 236).
- Isso garante que ao abrir o modal, o usuario ja ve os comentarios mais recentes sem precisar rolar.

### Resultado esperado
- Comentarios mais antigos ficam no topo, mais novos ficam embaixo
- Ao abrir o modal, o scroll ja esta posicionado nos comentarios mais recentes
- Para ver comentarios antigos, o usuario rola para cima

