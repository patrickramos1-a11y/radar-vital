
## Correcoes e Ajustes: Filtros, Comentarios, Nomenclatura e Paridade Mobile/Desktop

### Bloco 1 -- Correcao do Filtro "De Boa" / "Com Alerta"

**Problema**: A funcao `isClienteDeBoa` atualmente verifica 6 criterios, incluindo comentarios e colaboradores vinculados. Isso gera excesso de empresas em "Com Alerta" (40 de 49, conforme screenshot).

**Solucao**: Simplificar `isClienteDeBoa` para considerar apenas:
- Prioridade ativa (`isPriority`)
- Destaque ativo (`isHighlighted`)
- Tarefas ativas (`getActiveTaskCount > 0`)

Remover da verificacao:
- `isChecked` (selecionado)
- Colaboradores vinculados (`Object.values(client.collaborators)`)
- Comentarios (`getCommentCount`)

**Arquivo**: `src/pages/Index.tsx` (linhas 97-104)

**Tooltip atualizado**: "Clientes estaveis -- sem prioridade, destaque ou tarefas ativas." / "Clientes que demandam atencao -- possuem prioridade, destaque ou tarefas ativas."

---

### Bloco 2 -- Rolagem na Janela Suspensa de Comentarios

**Problema**: O `CommentPreview` (hover card nos cards) tem `max-h-64` mas mostra apenas 3 comentarios. Quando ha muitos, nao ha como ver todos no preview.

**Solucao**: Aumentar o `max-h` do `ScrollArea` dentro do `CommentPreview` para permitir visualizacao de mais comentarios e garantir rolagem visivel.

**Arquivo**: `src/components/comments/CommentPreview.tsx` -- ajustar `max-h-64` para `max-h-80` e remover o `slice(0, 3)` ou aumentar para mostrar mais itens no preview.

---

### Bloco 3 -- Filtro "Tarefas" Visivel no Desktop

**Problema**: No desktop, a barra de stats (linha 439-443 de Index.tsx) tem badges para Prioridade, Destaque, Responsaveis e Comentarios, mas NAO tem para Tarefas. No mobile ja existe como "JACK".

**Solucao**: Adicionar um `StatBadge` de "Tarefas" na barra de stats do desktop, entre Comentarios e o final, usando o icone `ListChecks` e o `jackboxCount`.

**Arquivo**: `src/pages/Index.tsx` -- adicionar badge apos Comentarios na linha 443.

---

### Bloco 4 -- Padronizacao de Nomenclatura (Jackbox/Checklist/Jack -> Tarefa)

Substituicao global em todos os arquivos:

| De | Para |
|---|---|
| `Jackbox` (label visivel) | `Tarefa` / `Tarefas` |
| `Jack` (label visivel) | `Tarefa` |
| `Checklist` (label visivel) | `Tarefa` |
| `JACK` (mobile pill label) | `TAREFA` |

**Arquivos afetados** (apenas labels/textos visiveis ao usuario, nao nomes de variaveis internas):

| Arquivo | Mudanca |
|---|---|
| `src/components/mobile/MobileCompactFilters.tsx` | `'Jackbox'` -> `'Tarefas'` na sortOptions |
| `src/components/mobile/MobileCompactHeader.tsx` | `'JACK'` -> `'TAREFA'` no FilterBadge |
| `src/components/dashboard/FilterBar.tsx` | Tooltip `"Jackbox"` -> `"Tarefas"` no SortIconButton |
| `src/pages/JackboxPanel.tsx` | Titulo `"Micro-Demandas (Jackbox)"` -> `"Micro-Demandas (Tarefas)"` |
| `src/pages/JackboxUnified.tsx` | Labels visiveis com Jackbox -> Tarefas |
| `src/components/checklist/ChecklistButton.tsx` | Tooltip `"tarefa(s)"` ja esta correto |
| `src/components/panels/PanelFilters.tsx` | Sort button label `'Jackbox'` -> `'Tarefas'` |

**Nota**: Nomes de variaveis e rotas (`/jackbox-unificado`, `sortBy === 'jackbox'`) permanecem inalterados para evitar quebra de funcionalidade. Apenas textos exibidos ao usuario serao alterados.

---

### Resumo de Arquivos a Editar

1. **`src/pages/Index.tsx`**: Simplificar `isClienteDeBoa`, atualizar tooltips, adicionar badge "Tarefas" no desktop
2. **`src/components/comments/CommentPreview.tsx`**: Melhorar rolagem do preview
3. **`src/components/mobile/MobileCompactHeader.tsx`**: Renomear "JACK" -> "TAREFA"
4. **`src/components/mobile/MobileCompactFilters.tsx`**: Renomear "Jackbox" -> "Tarefas"
5. **`src/components/dashboard/FilterBar.tsx`**: Renomear tooltip "Jackbox" -> "Tarefas"
6. **`src/pages/JackboxPanel.tsx`**: Renomear titulo visivel
7. **`src/pages/JackboxUnified.tsx`**: Renomear labels visiveis
8. **`src/components/panels/PanelFilters.tsx`**: Renomear label "Jackbox" -> "Tarefas"
