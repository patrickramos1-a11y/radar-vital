
# Plano: Corrigir modo "Fit-All" para caber todas as empresas na tela

## Problema Identificado
No modo "fit-all" (toggle desabilitado), a grade ainda permite rolagem porque:
1. O grid calcula corretamente as colunas, mas não força as linhas a caberem na altura disponível
2. O CSS atual usa `gridAutoRows: 'minmax(auto, 1fr)'` que não limita a altura real das linhas
3. Os cards crescem baseado no conteúdo, causando overflow

## Solução Técnica

### Arquivo: `src/components/dashboard/ClientGrid.tsx`

**Mudanças necessárias:**

1. **Calcular linhas explicitamente** - Usar o número de linhas calculado pelo `getGridLayout`
2. **Definir `gridTemplateRows`** - Forçar linhas com altura fracionária (`1fr`) para que todas caibam
3. **Usar altura total do container** - Garantir que o grid use 100% da altura disponível

**Código atualizado para fit-all:**
```typescript
const gridStyles = useMemo(() => {
  if (viewMode === 'scroll') {
    return {
      gridTemplateColumns: `repeat(7, minmax(160px, 1fr))`,
      gridAutoRows: 'auto',
      overflow: 'auto',
      height: 'auto',
    };
  }
  // fit-all mode - força colunas E linhas para caber tudo na tela
  return {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    overflow: 'hidden',
    height: '100%',
  };
}, [viewMode, columns, rows]);
```

**Ajustes adicionais no container:**
- Remover `minmax` no fit-all para permitir cards menores
- Usar `gridTemplateRows` com o número exato de linhas
- Garantir `height: 100%` para usar todo o espaço vertical

### Arquivo: `src/pages/Index.tsx`

O container já tem `flex-1 overflow-hidden` (linha 449), o que está correto.

## Comportamento Esperado

| Modo | Comportamento |
|------|---------------|
| **Fit-All** (toggle OFF) | Todas as empresas visíveis na tela, sem scroll, cards redimensionam automaticamente |
| **Scroll** (toggle ON) | Grid fixo de 7 colunas, scroll vertical habilitado, cards com tamanho consistente |

## Detalhes Técnicos

### Layout Fit-All
```text
┌─────────────────────────────────────────────────┐
│ Header + Stats Bar + Filter Bar                 │
├─────────────────────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │     │
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │ 100% altura
│ │ 8 │ │ 9 │ │10 │ │11 │ │12 │ │13 │ │14 │     │ disponível
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│ ...                                             │ SEM SCROLL
└─────────────────────────────────────────────────┘
```

## Arquivos a Modificar
1. `src/components/dashboard/ClientGrid.tsx` - Ajustar gridStyles para modo fit-all
