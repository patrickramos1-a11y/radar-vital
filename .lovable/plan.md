
# Fix: Botao do cadeado (Fit-All Locked) nao responde ao clique

## Problema
O botao do cadeado nao responde ao clique. Apesar de tentativas anteriores com `stopPropagation`, `preventDefault`, e wrapper `<span>`, o Radix UI `Tooltip` continua interceptando os eventos de ponteiro do botao.

## Causa Raiz
O componente `TooltipTrigger` do Radix UI injeta handlers de `onPointerDown` e `onPointerUp` no elemento filho (mesmo com wrapper `<span>`). Esses handlers podem consumir o evento antes que o `onClick` do botao seja disparado. Isso e um conflito conhecido quando se usa `Tooltip > TooltipTrigger asChild` em botoes com logica de estado.

## Solucao
Remover completamente o wrapper `Tooltip`/`TooltipTrigger`/`TooltipContent` do botao do cadeado e usar um titulo HTML nativo (`title` attribute) para manter a informacao de hover. Isso elimina qualquer interferencia do Radix nos eventos do botao.

## Detalhes Tecnicos

### Arquivo: `src/components/dashboard/FilterBar.tsx` (linhas 203-231)

Substituir toda a estrutura `Tooltip > TooltipTrigger > span > button` por um simples `<button>` com atributo `title`:

```text
Antes:
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex">
        <button type="button" onClick={...}>
          <Lock/LockOpen />
        </button>
      </span>
    </TooltipTrigger>
    <TooltipContent>...</TooltipContent>
  </Tooltip>

Depois:
  <button
    type="button"
    title={fitAllLocked ? "Desativar Travamento..." : "Ativar Travamento..."}
    onClick={() => onFitAllLockedChange(!fitAllLocked)}
    className={...}
  >
    <Lock/LockOpen />
  </button>
```

### Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/dashboard/FilterBar.tsx` | Remover Tooltip do botao do cadeado, usar atributo `title` nativo |
