

## Tooltips Informativos nos Filtros "De Boa" e "Com Alerta"

Adicionar tooltips descritivos nos botoes de filtro estrategico para que o gestor entenda o criterio automatico de classificacao ao passar o mouse.

### O que muda

O componente `AlertFilterButton` em `src/pages/Index.tsx` ja possui um `Tooltip`, mas o conteudo atual e generico ("Mostrando: De Boa" / "Filtrar: De Boa"). Sera substituido por textos explicativos:

- **De Boa**: "Clientes sem pendencias: sem prioridade, destaque, tarefas, comentarios nao lidos ou colaboradores vinculados"
- **Com Alerta**: "Clientes com alguma pendencia ativa: prioridade, destaque, tarefas, comentarios nao lidos ou colaboradores vinculados"

### Detalhes tecnicos

**Arquivo**: `src/pages/Index.tsx`

- Adicionar uma prop `tooltip` (string) ao componente `AlertFilterButton`
- Nas duas chamadas do componente (linhas ~408 e ~416), passar o texto explicativo correspondente
- No `TooltipContent`, exibir sempre o texto descritivo (independente de estar ativo ou nao), com `max-w-[250px]` para controlar a largura do balao

Exemplo do conteudo do tooltip:

```
De Boa → "Clientes estaveis — sem prioridade, destaque, tarefas ativas, comentarios pendentes ou colaboradores vinculados."

Com Alerta → "Clientes que demandam atencao — possuem prioridade, destaque, tarefas, comentarios nao lidos ou colaboradores vinculados."
```

Nenhum texto adicional sera adicionado na tela — a informacao aparece apenas no balao ao hover, mantendo a interface limpa.
