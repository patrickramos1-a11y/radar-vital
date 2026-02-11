
## Objetivo
Fazer o botão do cadeado (Fit-All Locked) voltar a responder ao clique de forma confiável (trocar ícone e ativar/desativar o modo travado).

## Diagnóstico (com base no código atual)
- O estado `fitAllLocked` está corretamente criado no `src/pages/Index.tsx` e é passado para o `FilterBar` via `fitAllLocked={fitAllLocked}` e `onFitAllLockedChange={setFitAllLocked}`.
- O botão do cadeado está dentro de `Tooltip > TooltipTrigger asChild`.
- Mesmo com `stopPropagation()` e `preventDefault()`, ainda pode acontecer do Radix (TooltipTrigger) “compor” handlers no próprio `<button>` e, em alguns cenários, o clique não chegar/efetivar como esperado.

O caminho mais robusto é **evitar que o TooltipTrigger injete handlers diretamente no `<button>`**.

## Solução proposta (mais robusta que “só stopPropagation”)
### A) Mudar a estrutura do TooltipTrigger para não “encostar” no botão
Em `src/components/dashboard/FilterBar.tsx`:
- Trocar o `TooltipTrigger asChild` que recebe diretamente o `<button>` por um `TooltipTrigger asChild` que recebe um **wrapper** (ex.: `<span>`), e o `<button>` fica dentro desse wrapper.
- Assim, os handlers do Tooltip ficam no wrapper, e o clique do botão fica “limpo”.

Estrutura alvo:
- `Tooltip`
  - `TooltipTrigger asChild`
    - `<span>` (wrapper)
      - `<button type="button" onClick={...}>...</button>`

Detalhes importantes:
- O `<span>` deve receber classes tipo `inline-flex` para não quebrar layout.
- O `<button>` deve ter `type="button"` para eliminar qualquer risco de comportamento “submit” caso em algum momento isso fique dentro de um `<form>`.

### B) Ajustar handler do botão para ser simples e confiável
- Manter `e.stopPropagation()` (bom para evitar efeitos colaterais com cliques em áreas maiores)
- Remover `e.preventDefault()` do botão (em geral não é necessário em button comum e pode atrapalhar comportamento de foco/ponteiro em alguns ambientes).
- Chamar `onFitAllLockedChange(!fitAllLocked)` normalmente.

### C) Verificação rápida no UI (checklist)
1. Ir na tela principal (`/`).
2. Clicar no cadeado:
   - Ícone deve alternar entre aberto/fechado imediatamente.
   - O grid deve alternar para o modo “travado” (sem scroll quando possível).
3. Clicar várias vezes seguidas para garantir que não “perde” cliques.
4. Confirmar que o tooltip continua aparecendo ao passar o mouse.

## Arquivos que serão alterados
- `src/components/dashboard/FilterBar.tsx`
  - Reestruturar o `TooltipTrigger` do cadeado para usar wrapper (`span`) + botão interno
  - Adicionar `type="button"` no cadeado
  - Simplificar handler (stopPropagation; remover preventDefault)

## Observação (por que isso resolve melhor)
Mesmo quando `stopPropagation/preventDefault` não resolvem, **mover o TooltipTrigger para um elemento pai** evita o conflito de composição de handlers do Radix diretamente no `<button>`, que é a causa mais comum de “clique não funciona” em triggers com `asChild`.
