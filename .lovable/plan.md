

# Refatoramento Estrutural - Remocao de Modulos

## Resumo

Remocao completa dos modulos **Demandas**, **Licencas**, **Processos** e **Notificacoes** do sistema, incluindo paginas, componentes, hooks, tipos, parsers, importadores, rotas, indicadores no dashboard, e referencias no card do cliente.

## Modulos que PERMANECEM ativos

- Painel AC (pagina principal com grid de clientes)
- Dashboard (reconstruido apenas com indicadores de Clientes)
- Tarefas (Jackbox)
- Comentarios
- Relatorios PDF
- Modo TV
- Backlog
- Configuracoes (simplificada)

---

## Fase 1 - Remocao de Rotas e Paginas

Arquivos de paginas a **remover**:

- `src/pages/DemandasPanel.tsx`
- `src/pages/DemandasVisual.tsx`
- `src/pages/DemandasUnified.tsx`
- `src/pages/LicencasPanel.tsx`
- `src/pages/LicencasVisual.tsx`
- `src/pages/LicencasUnified.tsx`
- `src/pages/ProcessosPanel.tsx`
- `src/pages/ProcessosUnified.tsx`
- `src/pages/ProcessosVisual.tsx`
- `src/pages/NotificacoesPanel.tsx`

Atualizar `src/App.tsx`:
- Remover todos os imports dessas paginas
- Remover todas as rotas correspondentes

## Fase 2 - Remocao de Componentes de Importacao

Arquivos a **remover**:

- `src/components/import/ImportWizard.tsx`
- `src/components/import/FinalPreviewStep.tsx`
- `src/components/import/FoundCompaniesStep.tsx`
- `src/components/import/NotFoundCompaniesStep.tsx`
- `src/components/import/PreviewStep.tsx`
- `src/components/import/MatchStep.tsx`
- `src/components/import/LicenseImportWizard.tsx`
- `src/components/import/ProcessImportWizard.tsx`
- `src/components/import/NotificationImportWizard.tsx`
- `src/components/import/NotificationItemImportWizard.tsx`
- `src/components/import/CondicionanteImportWizard.tsx`
- `src/components/import/CollaboratorMatchDialog.tsx`
- `src/components/import/ImportProgress.tsx`

## Fase 3 - Remocao de Tipos, Parsers e Hooks

Arquivos a **remover**:

- `src/types/demand.ts`
- `src/types/license.ts`
- `src/types/process.ts`
- `src/types/notification.ts`
- `src/types/notificationItem.ts`
- `src/types/condicionante.ts`
- `src/lib/excelParser.ts`
- `src/lib/licenseParser.ts`
- `src/lib/processParser.ts`
- `src/lib/notificationParser.ts`
- `src/lib/notificationItemParser.ts`
- `src/lib/condicionanteParser.ts`

Hooks que possivelmente referenciam esses modulos serao verificados e limpos.

## Fase 4 - Remocao de Componentes Visuais dos Modulos

Arquivos a **remover** (apos verificar se sao usados exclusivamente por modulos removidos):

- `src/components/panels/ClientRow.tsx`
- `src/components/panels/PanelFilters.tsx`
- `src/components/panels/PanelHeader.tsx`
- `src/components/visual-panels/VisualCard.tsx`
- `src/components/visual-panels/VisualGrid.tsx`
- `src/components/visual-panels/VisualPanelFilters.tsx`
- `src/components/visual-panels/VisualPanelHeader.tsx`
- Hooks: `src/hooks/usePanelFilters.ts`, `src/hooks/useVisualPanelFilters.ts`

## Fase 5 - Navegacao (Sidebar)

Atualizar `src/components/layout/AppSidebar.tsx`:
- Remover itens: "Demandas", "Licencas", "Processos", "Notificacoes"
- Manter: Painel AC, Dashboard, Tarefas, Comentarios, Relatorios PDF, Modo TV

## Fase 6 - Refatoramento do Dashboard

Reescrever `src/pages/Dashboard.tsx`:
- Manter apenas a secao de **Clientes** (total, AC vs AV, distribuicao geografica)
- Remover secoes: Processos, Licencas, Notificacoes, Desempenho
- Remover descricao que menciona "processos, licencas e notificacoes"

Simplificar `src/hooks/useDashboardStats.ts`:
- Remover interfaces: `ProcessStats`, `LicenseStats`, `NotificationStats`, `PerformanceStats`
- Remover queries para tabelas `processes` e `licenses`
- Remover agregacoes de colunas de processos, licencas, notificacoes e condicionantes
- Manter apenas `ClientStats`

## Fase 7 - Refatoramento do Card do Cliente

Atualizar `src/components/dashboard/ClientCard.tsx`:
- Remover indicadores **P** (Processos), **L** (Licencas), **D** (Demandas)
- Remover chips de status de demandas (completed, in-progress, not-started, cancelled)
- O card fica com: Numero + Nome, Colaboradores, Logo, Comentarios, Tarefas, Prioridade, Destaque

Atualizar `src/types/client.ts`:
- Remover interfaces: `DemandBreakdown`, `CollaboratorDemandCounts`, `LicenseBreakdown`, `ProcessBreakdown`
- Remover do `Client`: `processes`, `processBreakdown`, `licenses`, `licenseBreakdown`, `demands`, `demandsByCollaborator`
- Remover funcoes: `calculateTotalDemands`, `calculateTotals` (ou simplificar)
- Manter: `id`, `name`, `initials`, `logoUrl`, `isPriority`, `isActive`, `isChecked`, `isHighlighted`, `clientType`, `order`, `collaborators`, `municipios`, `createdAt`, `updatedAt`

Atualizar `src/contexts/ClientContext.tsx`:
- Remover mapeamento das colunas de demands, processes, licenses do `dbRowToClient`
- Remover defaults de `DEFAULT_PROCESS_BREAKDOWN`, `DEFAULT_LICENSE_BREAKDOWN`, etc.

## Fase 8 - Componentes Mobile

Atualizar `src/components/mobile/MobileStatsBar.tsx`:
- Remover contadores de Processos, Licencas e Demandas
- Manter apenas total de clientes e stats de colaboradores

Verificar e limpar componentes mobile que referenciam P/L/D.

## Fase 9 - Configuracoes

Atualizar `src/pages/Config.tsx`:
- Remover colunas P, L, D da tabela de clientes
- Remover campos de demandas no formulario de edicao
- Manter: Ordem, Logo, Nome, Tipo, Equipe, Prioridade, Ativo, Acoes

## Fase 10 - Modo TV

Verificar `src/components/tv/TVClientCard.tsx` e `src/pages/TVMode.tsx`:
- Remover indicadores P/L/D se presentes

## Fase 11 - Limpeza de Notificacoes do Painel

Atualizar `src/components/notifications/NotificationsPanel.tsx` se for componente de notificacoes do sistema (verificar se e o mesmo modulo).

---

## Detalhes Tecnicos

### Tabelas do banco de dados

As tabelas `demands`, `processes`, `licenses`, `notifications` **nao serao removidas** -- os dados permanecem como historico inativo. Nenhuma migracao destrutiva sera feita.

As colunas agregadas no `clients` (proc_*, lic_*, demands_*, notif_*, cond_*) permaneceram no schema mas nao serao mais usadas pelo frontend.

### Arquivos que NAO serao alterados

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`
- `supabase/config.toml`

### Estimativa de arquivos impactados

- ~30 arquivos removidos
- ~10 arquivos editados
- 0 migracoes de banco

