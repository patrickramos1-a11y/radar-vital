
# Correção: Cadeado (Fit-All Locked) não impede rolagem vertical

## Problema

Quando o cadeado ("Fit-All Locked") está ativado, os cards ultrapassam a area visivel e aparece scroll vertical. O comportamento esperado e semelhante ao Modo TV: todos os cards devem caber na tela sem rolagem, reduzindo o tamanho dos cards se necessario.

## Causa Raiz

O calculo de altura disponivel em `ClientGrid.tsx` usa uma estimativa fixa (`window.innerHeight - 180px`) para descontar os elementos acima do grid (stats bar, barra de paineis, barra de filtros). Na pratica esses elementos ocupam mais espaco, fazendo com que os cards excedam a area visivel.

Alem disso, o container pai no `Index.tsx` aplica `overflow: hidden` mas o grid interno calcula sua propria altura com base no `window`, criando um desalinhamento.

## Solucao

Substituir o calculo baseado em `window.innerHeight` por uma medicao real do container do grid usando `ResizeObserver`. Assim o grid sempre sabera exatamente quanto espaco tem disponivel, independente da altura dos elementos acima.

## Detalhes Tecnicos

### 1. `ClientGrid.tsx` - Usar ref + ResizeObserver para medir o container real

- Adicionar um `ref` ao elemento wrapper do grid
- Usar `ResizeObserver` para capturar as dimensoes reais do container (largura e altura disponivel)
- Substituir o `useEffect` atual que calcula `containerSize` via `window.innerWidth/innerHeight` por um observer no elemento real
- Isso elimina a necessidade de "adivinhar" offsets fixos (280px sidebar, 180px headers)

```text
Antes:
  width = window.innerWidth - 280
  height = window.innerHeight - 180

Depois:
  width = containerRef.current.clientWidth
  height = containerRef.current.clientHeight
```

### 2. `ClientGrid.tsx` - Garantir que o grid respeita as dimensoes

- Quando `fitAllLocked` esta ativo, aplicar `height: 100%` e `maxHeight: 100%` no grid em vez de um valor fixo em pixels baseado no calculo errado
- Usar `overflow: hidden` para garantir que nada extrapole

### 3. `Index.tsx` - Container pai do grid

- O container `flex-1 overflow-hidden` que envolve o `ClientGrid` ja esta correto em estrutura
- Garantir que quando `fitAllLocked` esta ativo, o container realmente restringe o espaco com `min-h-0` (necessario em flex layouts para permitir que o elemento encolha abaixo de seu conteudo natural)

### 4. `ClientCard.tsx` - Ajustes para escala extrema

- Quando `fitAll` esta ativo e ha muitos clientes (49+), permitir que todos os elementos internos do card encolham ainda mais:
  - Reduzir padding interno
  - Usar `overflow: hidden` em cada secao do card
  - Garantir que nenhum `min-height` bloqueie o encolhimento

### Resumo das alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/dashboard/ClientGrid.tsx` | Usar `ResizeObserver` no container real em vez de `window`, ajustar estilos do grid para `height: 100%` quando locked |
| `src/pages/Index.tsx` | Adicionar `min-h-0` ao container flex do grid para permitir encolhimento correto |
| `src/components/dashboard/ClientCard.tsx` | Reduzir padding e remover min-heights residuais no modo `fitAll` |
