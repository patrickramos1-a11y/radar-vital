
# Evolucao do Checklist para Painel de Tarefas Gerencial

## Resumo

Transformar a aba "Checklist" (Jackbox Unificado) em um **Painel de Tarefas** com capacidade analitica e gerencial. A visualizacao por cards sera mantida, mas com layout responsivo melhorado, filtros simplificados e uma nova tabela detalhada por colaborador.

---

## 1. Tabela Detalhada por Colaborador

Ao clicar em um colaborador (nos badges do header ou nos filtros), uma secao expansivel aparecera **abaixo do grid de cards**, mostrando uma tabela com:

| Coluna | Descricao |
|--------|-----------|
| Tarefa | Titulo da tarefa |
| Empresa | Nome do cliente vinculado |
| Criada em | Data de criacao (formatada) |
| Dias em aberto | Calculo automatico: diferenca entre hoje e `created_at` |
| Status | Pendente / Concluida (com data de conclusao) |

A tabela tera ordenacao por qualquer coluna e um resumo no topo (total de tarefas, media de dias em aberto, tarefas mais antiga).

---

## 2. Indicadores Analiticos no Header

Os KPIs do header serao expandidos para incluir:

- **Pendentes** (ja existe)
- **Concluidas** (ja existe)
- **Empresas com tarefas** (ja existe)
- **Tarefa mais antiga** -- quantidade de dias da tarefa pendente mais antiga
- **Media de dias em aberto** -- media calculada sobre todas as tarefas pendentes

Os badges de colaborador continuarao mostrando contagem e ganharao tooltip com detalhes (total pendente, media de dias, tarefa mais antiga).

---

## 3. Renomeacao: Checklist para Tarefas

- Sidebar: "Checklist" passa a se chamar **"Tarefas"**
- Titulo da pagina: "Painel de Tarefas"
- Rotas mantidas (`/jackbox-unificado`, `/jackbox-detalhado`) para compatibilidade

---

## 4. Layout Responsivo do Grid

O `VisualGrid` atual usa ate 7 colunas com `minmax(200px)`. Sera ajustado para:

- **Desktop grande**: maximo 3 colunas
- **Desktop/notebook**: 2-3 colunas
- **Tablet**: 2 colunas
- **Mobile**: 1 coluna

Os nomes das empresas poderao quebrar em ate 2 linhas, com fonte maior e espacamento confortavel.

---

## 5. Filtros Simplificados

A barra de filtros sera reorganizada com foco gerencial:

**Filtros principais (mantidos com destaque):**
- Busca por empresa (texto)
- Filtro por colaborador (badges interativos)
- Filtro por status: Pendentes / Concluidas / Todas

**Filtros secundarios (mantidos mas com menor destaque visual):**
- Prioridade e Destaque permanecem como indicadores visuais nos cards, nao como filtros primarios

---

## 6. Ordenacao Corrigida

Opcoes de ordenacao que respeitam os filtros ativos:

- **Tarefas** -- quantidade de tarefas (pendentes ou conforme filtro de status)
- **Dias em aberto** -- empresa com tarefa mais antiga primeiro
- **Prioridade** -- clientes prioritarios primeiro
- **Nome** -- ordem alfabetica

A ordenacao sera aplicada **apos** os filtros, garantindo consistencia.

---

## 7. Ranking de Colaboradores

Dentro da tabela do colaborador, um mini-ranking sera exibido:

- Colaborador com mais tarefas pendentes
- Colaborador com mais tarefas concluidas (no periodo visivel)
- Tarefa ha mais tempo em aberto (com nome da empresa)

---

## Detalhes Tecnicos

### Arquivos modificados:

1. **`src/pages/JackboxUnified.tsx`** -- Refatoracao principal:
   - Adicionar estado `selectedCollaborator` para controlar a tabela expandida
   - Adicionar filtro por status (pendente/concluida/todas) substituindo o checkbox "Mostrar concluidas"
   - Adicionar secao de tabela detalhada abaixo do grid
   - Adicionar KPIs analiticos (dias em aberto, tarefa mais antiga)
   - Ajustar logica de ordenacao para respeitar filtros

2. **`src/components/visual-panels/VisualGrid.tsx`** -- Ajustar grid responsivo:
   - Maximo 3 colunas em desktop
   - `minmax(280px, 1fr)` para cards mais largos
   - Media queries para tablet (2 colunas) e mobile (1 coluna)

3. **`src/components/layout/AppSidebar.tsx`** -- Renomear "Checklist" para "Tarefas"

4. **Novo componente: `src/components/tasks/CollaboratorTaskTable.tsx`**:
   - Tabela com colunas: Tarefa, Empresa, Criada em, Dias em aberto, Status
   - Ordenavel por qualquer coluna
   - Resumo no topo com indicadores
   - Usa componentes Table do shadcn/ui

5. **Novo componente: `src/components/tasks/TaskAnalytics.tsx`**:
   - Mini-ranking de colaboradores
   - Indicadores comparativos

6. **`src/hooks/useTasks.ts`** -- Adicionar helpers:
   - `getDaysOpen(task)` -- calcula dias em aberto
   - `getOldestTask()` -- retorna tarefa mais antiga
   - `getAverageDaysOpen()` -- media de dias

### Nenhuma alteracao de banco de dados necessaria

A tabela `tasks` ja possui `created_at` e `completed_at`, que sao suficientes para calcular todos os indicadores analiticos propostos.

### Logica de calculo de dias em aberto:

```text
diasEmAberto = diferencaEmDias(hoje, task.created_at)
// Para tarefas concluidas: diferencaEmDias(task.completed_at, task.created_at)
```

### Responsividade do grid (nova logica):

```text
Mobile (< 640px):    1 coluna
Tablet (640-1024px): 2 colunas  
Desktop (> 1024px):  3 colunas
```
