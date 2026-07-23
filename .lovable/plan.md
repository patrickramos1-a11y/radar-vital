## Objetivo
Adicionar a opção **"Sem responsável"** dentro dos dropdowns de filtro de colaborador, permitindo listar tarefas/clientes que não têm ninguém atribuído. A opção pode ser combinada com colaboradores selecionados (OR).

## Onde a opção precisa aparecer
Existem dois dropdowns de "Colaboradores" reutilizados no sistema:

1. **`src/components/visual-panels/VisualPanelFilters.tsx`** — usado em:
   - Painel de Tarefas (`src/pages/JackboxUnified.tsx`) — filtro por responsável **das tarefas**.
   - Painel Jackbox (`src/pages/JackboxPanel.tsx`) — filtro por responsável do cliente.

2. **`src/components/dashboard/FilterBar.tsx`** — usado no Dashboard (`src/pages/Index.tsx`) para filtrar clientes por colaborador atribuído.

Nenhuma outra tela tem dropdown de "responsáveis por tarefas": a Central de Entregas trabalha com um único responsável escolhido no `TeamSelector`, e o `MobileCompactFilters` não filtra por colaborador.

## Convenção
Introduzir o sentinela `'__none__'` (constante exportada `NO_RESPONSIBLE = '__none__'`) reutilizado em ambos os componentes. Quando presente em `collaboratorFilters`, o item combina com registros sem responsável.

## Alterações

### 1. `VisualPanelFilters.tsx` (dropdown)
- No topo da lista renderizada dentro do `CollaboratorDropdown`, adicionar uma entrada fixa "Sem responsável" com ícone tracejado (círculo `border-dashed` com `–`), acima do input de busca ou como primeiro item da lista filtrada (independente do texto pesquisado, aparece se o termo casar com "sem" ou estiver vazio).
- Label do botão: se apenas `__none__` estiver selecionado, mostrar "Sem responsável"; combinação com colaboradores continua exibindo "N selecionados".
- `onToggle('__none__')` usa o mesmo handler existente.

### 2. `JackboxUnified.tsx` (Painel de Tarefas — filtragem por tarefa)
Nos dois pontos que hoje filtram por `assigneeMatchesAny(t.assigned_to, collaboratorFilters)`:
- Linha ~117 (`displayClients`)
- Linha ~160 (`getFilteredTasks`)

Ajustar para:
```
const wantNone = collaboratorFilters.includes('__none__');
const names = collaboratorFilters.filter(n => n !== '__none__');
tasks.filter(t =>
  (wantNone && (!t.assigned_to || t.assigned_to.length === 0)) ||
  (names.length > 0 && assigneeMatchesAny(t.assigned_to, names))
);
```
Se apenas `__none__` estiver ativo, retorna apenas tarefas sem responsável.

### 3. `useVisualPanelFilters.ts` (Painel Jackbox — filtragem por cliente)
No bloco `if (collaboratorFilters.length > 0 && !skipCollaboratorFilter)`:
```
const wantNone = collaboratorFilters.includes('__none__');
const names = collaboratorFilters.filter(n => n !== '__none__');
result = result.filter(c => {
  const assignedNames = Object.keys(c.collaborators).filter(k => c.collaborators[k]);
  const noResp = assignedNames.length === 0;
  return (wantNone && noResp) || names.some(n => c.collaborators[n]);
});
```

### 4. `FilterBar.tsx` (Dashboard dropdown)
- Adicionar a mesma entrada "Sem responsável" no topo da lista do `CollaboratorDropdown`.
- Ajustar `displayLabel` para exibir "Sem responsável" quando único selecionado.

### 5. `Index.tsx` (aplicação do filtro no Dashboard)
No bloco `matchesCollaborator` (linhas ~254-259), tratar o sentinela:
```
const wantNone = collaboratorFilters.includes('__none__');
const names = collaboratorFilters.filter(n => n !== '__none__');
const noneMatch = wantNone && assignedIds.length === 0;
const nameMatch = names.length > 0 && names.some(collab => {
  const co = allCollaborators.find(x => x.name === collab);
  return co && assignedIds.includes(co.id);
});
const matchesCollaborator = collaboratorFilters.length > 0 && (noneMatch || nameMatch);
```

## Preservado
- Comportamento atual quando nenhum colaborador está selecionado (mostra tudo).
- Comportamento OR entre múltiplas seleções.
- `MobileCompactFilters`, Central de Entregas e demais telas ficam intocadas.
- Sem mudanças no banco de dados.

## Verificação
- Typecheck automático do build.
- Conferir no Painel de Tarefas: selecionar "Sem responsável" isolado lista apenas tarefas sem responsável; combinado com um colaborador, lista as duas categorias.
- Conferir no Dashboard: "Sem responsável" mostra clientes sem colaborador atribuído.