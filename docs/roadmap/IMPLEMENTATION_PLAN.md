# Plano de Implementacao

## Convencoes

Estados usados neste documento:

- `[ ]` nao iniciado;
- `[~]` em andamento;
- `[x]` concluido;
- `[!]` bloqueado.

Cada fase deve resultar em uma entrega utilizavel, testada e documentada.

## Politica global de execucao

- As fases sao implementadas sequencialmente em uma branch de integracao.
- Cada fase gera um checkpoint interno, nao uma publicacao.
- Supabase local ou de teste recebe as migrations durante o desenvolvimento.
- O Supabase de producao nao recebe migrations antes da Fase 7.
- A branch `main` e o Lovable permanecem com a versao atual ate o lancamento.
- Todas as funcionalidades devem ser testadas juntas antes da publicacao unica.
- Migrations precisam ser aditivas para permitir banco novo com frontend antigo
  durante a janela final de lancamento.

## Fase 0 - Fundacao tecnica e seguranca

### Objetivo

Garantir identidade real do usuario e integridade antes de movimentar estrelas
com valor financeiro.

### Pontos atuais

- `src/contexts/AuthContext.tsx` usa `localStorage` como identidade.
- `src/hooks/useDeliverableRatings.ts` identifica Patrick pelo nome.
- Existem politicas publicas em tabelas operacionais.
- Os tipos gerados do Supabase estao defasados em relacao a migrations.

### Entregas

- [x] Criar a branch de integracao do roadmap.
- [ ] Preparar Supabase local ou projeto remoto de teste.
- [x] Registrar uma baseline segura do schema e das migrations de producao.
- [ ] Preparar dados de teste sem alterar a base de producao.
- [x] Mapear tabelas e politicas RLS atuais.
- [x] Preparar Supabase Auth no frontend e nas migrations.
- [x] Criar ou adaptar perfis com `user_id` e papel.
- [x] Migrar a autorizacao administrativa do frontend para o papel autenticado.
- [ ] Regenerar `src/integrations/supabase/types.ts` a partir do banco aplicado.
- [x] Remover a identidade operacional mantida em `localStorage`.
- [x] Criar helper unico de autorizacao na aplicacao.
- [x] Criar base de testes com Vitest e React Testing Library.
- [x] Documentar o fluxo de login, recuperacao e corte de RLS.

### Criterios de aceite

- F0-AC1: trocar o nome local nao concede privilegio administrativo.
- F0-AC2: usuario sem papel admin nao altera dados protegidos pela API.
- F0-AC3: tipos TypeScript refletem o schema atual.
- F0-AC4: build e testes passam.
- F0-AC5: nenhuma alteracao foi aplicada no ambiente de producao.

## Fase 1 - Universo Ramos

### Arquivos candidatos

- `src/types/client.ts`
- `src/components/dashboard/NewClientDialog.tsx`
- `src/components/dashboard/FilterBar.tsx`
- `src/pages/Index.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/hooks/useDashboardStats.ts`
- `src/components/dashboard-stats/DashboardFilters.tsx`
- componentes mobile, TV e paineis visuais com filtros AC/AV

### Entregas

- [x] Criar migration para aceitar `UNIVERSO_RAMOS`.
- [x] Atualizar tipos e validacoes.
- [x] Adaptar o cadastro unico com tres naturezas.
- [x] Tornar municipio opcional para Universo Ramos.
- [x] Extrair regras de escopo para reutilizacao entre workspaces.
- [x] Criar rota `/universo-ramos`.
- [x] Adicionar item de menu com icone de globo.
- [x] Excluir Universo Ramos dos totais AC/AV.
- [x] Adicionar filtro de escopo na Central de Entregas.
- [x] Cobrir o codigo dos fluxos desktop, mobile e modo apresentacao.
- [!] Aplicar migration e validar visualmente os fluxos em Supabase isolado.

### Criterios de aceite

- F1-AC1: criar AC, AV e Universo Ramos pelo mesmo botao.
- F1-AC2: Universo Ramos nao aparece no painel principal.
- F1-AC3: cliente interno aceita tarefa, comentario, prioridade e entregavel.
- F1-AC4: totais AC/AV nao mudam ao criar cliente interno.

## Fase 2 - Visao Unificada do Cliente

### Arquivos candidatos

- `src/components/checklist/TaskModal.tsx`
- `src/components/dashboard/ClientCard.tsx`
- `src/pages/Index.tsx`
- novos `src/types/workItem.ts`
- novo `src/hooks/useClientWorkItems.ts`
- novos componentes em `src/components/client-work/`

### Entregas

- [x] Definir o tipo `WorkItem`.
- [x] Criar adaptadores para tarefas, prioridades e entregaveis existentes.
- [x] Criar `useClientWorkItems(clientId)`.
- [x] Substituir as entradas do modal por `ClientWorkDialog`.
- [x] Adicionar filtros Tudo, Tarefas, Prioridades e Entregaveis.
- [x] Incluir estados de carregamento, erro e vazio.
- [x] Preparar adaptadores para auditorias e desafios.
- [x] Garantir navegacao para o modulo original.
- [!] Validar o fluxo visual completo com uma sessao autenticada de teste.

### Criterios de aceite

- F2-AC1: todos os itens do cliente aparecem em ordem consistente.
- F2-AC2: nenhum registro e duplicado no banco.
- F2-AC3: filtros nao alteram os dados de origem.
- F2-AC4: alteracao no modulo original atualiza a visao.

## Fase 3 - Auditorias

### Entregas de banco

- [x] Criar tabelas descritas em `DATA_MODEL.md`.
- [x] Criar RPC atomica de abertura.
- [x] Criar RLS administrativa para validacao e encerramento.
- [x] Criar consultas agregadas por campanha.
- [x] Criar log de alteracoes.

### Entregas de interface

- [x] Criar rota e pagina `/auditorias`.
- [x] Criar lista de auditorias simultaneas.
- [x] Criar formulario de abertura.
- [x] Criar detalhes com clientes, criterios e tempo.
- [x] Adicionar seletor de auditoria no Painel AC.
- [x] Exibir KPIs da auditoria selecionada.
- [x] Adicionar modo `audit` ao card do cliente.
- [x] Adicionar auditorias a Visao Unificada.
- [x] Criar validacao e encerramento exclusivos do admin.
- [!] Aplicar a migration e validar os fluxos com usuarios autenticados em Supabase isolado.

### Criterios de aceite

- F3-AC1: abertura inclui exatamente os clientes AC ativos daquele momento.
- F3-AC2: novas empresas nao entram retroativamente na campanha.
- F3-AC3: varias campanhas coexistem sem misturar resultados.
- F3-AC4: apenas Patrick valida ou encerra.
- F3-AC5: o painel mostra quantidades, tempo e situacao por empresa.

## Fase 4 - Desafios

### Entregas

- [x] Criar tabelas e RPC de resolucao.
- [x] Criar aba Desafios na Central de Entregas.
- [x] Criar formulario com participantes, prazo, recompensa e penalidade.
- [x] Permitir cliente opcional.
- [x] Permitir vinculo com tarefas e entregaveis.
- [x] Criar estado `aguardando_validacao`.
- [x] Criar acao administrativa de sucesso ou insucesso.
- [x] Integrar desafios a Visao Unificada.
- [x] Preparar geracao das transacoes do Tesouro sem movimentar valores antes da Fase 5.

### Criterios de aceite

- F4-AC1: cada participante recebe o valor integral.
- F4-AC2: desafio vencido nao penaliza automaticamente.
- F4-AC3: resolver duas vezes nao duplica movimentacao.
- F4-AC4: penalidade pode produzir saldo negativo.

## Fase 5 - Tesouro de Estrelas

### Correcao previa

O calculo atual divide a pontuacao de entregaveis entre os responsaveis. Essa
regra deve ser removida. Cada participante recebe a avaliacao integral.

### Entregas de banco

- [ ] Criar livro `star_transactions`.
- [ ] Criar liquidacoes e itens de liquidacao.
- [ ] Criar views de saldo individual e coletivo.
- [ ] Criar RPC para premio manual.
- [ ] Criar RPC para penalidade manual.
- [ ] Criar RPC para credito inicial em lote.
- [ ] Criar RPC de liquidacao.
- [ ] Criar estorno administrativo.
- [ ] Integrar entregaveis e desafios ao livro.

### Entregas de interface

- [ ] Criar pagina Tesouro.
- [ ] Mostrar saldo coletivo e individual.
- [ ] Mostrar extrato filtravel.
- [ ] Mostrar positivos, negativos e liquidados.
- [ ] Criar concessao manual com justificativa.
- [ ] Criar credito inicial de 500 por colaborador selecionado.
- [ ] Criar simulacao de conversao em reais.
- [ ] Criar fluxo de liquidacao com confirmacao.
- [ ] Exibir historico de liquidacoes.

### Criterios de aceite

- F5-AC1: joinha nao altera saldo.
- F5-AC2: Super Estrela credita 10.
- F5-AC3: saldo pode ficar negativo.
- F5-AC4: saldo coletivo inclui valores negativos.
- F5-AC5: liquidacao preserva o extrato e zera apenas o saldo liquidado.
- F5-AC6: toda correcao possui transacao de estorno.

## Fase 6 - Performance completa

### Entregas

- [ ] Criar consultas agregadas no banco.
- [ ] Separar visao individual e equipe.
- [ ] Adicionar seletor de periodo.
- [ ] Adicionar seletor de escopo.
- [ ] Permitir ranking por qualquer indicador suportado.
- [ ] Integrar tarefas concluidas.
- [ ] Integrar comentarios realizados e respondidos.
- [ ] Integrar clientes e empresas vinculadas.
- [ ] Integrar auditorias e desafios.
- [ ] Exibir estrelas, Super Estrelas e joinhas separadamente.
- [ ] Criar evolucao mensal.

### Criterios de aceite

- F6-AC1: ranking oficial usa apenas estrelas-base.
- F6-AC2: joinhas aparecem sem afetar pontuacao.
- F6-AC3: gestor consegue ordenar por tarefas, comentarios e clientes.
- F6-AC4: totais individuais conciliam com os registros de origem.

## Fase 7 - Integracao, qualidade e publicacao unica

### Testes criticos

- [ ] Universo Ramos nao altera totais externos.
- [ ] Auditoria captura apenas AC ativos.
- [ ] Auditoria e desafio sao idempotentes.
- [ ] Recompensa integral por participante.
- [ ] Super Estrela igual a 10.
- [ ] Joinha igual a zero.
- [ ] Penalidade aceita saldo negativo.
- [ ] Liquidacao preserva historico.
- [ ] Usuario nao autorizado nao altera valores.
- [ ] Visao Unificada nao duplica registros.

### Entregas

- [ ] Confirmar que todas as fases estao integradas na mesma branch.
- [ ] Carregar novas rotas com `React.lazy`.
- [ ] Revisar performance das consultas.
- [ ] Validar acessibilidade e responsividade.
- [ ] Validar em desktop, mobile e TV.
- [ ] Executar build, lint e testes.
- [ ] Revisar migrations e politicas RLS.
- [ ] Atualizar documentacao final.
- [ ] Congelar novas funcionalidades durante a validacao final.
- [ ] Gerar backup do Supabase de producao.
- [ ] Executar e revisar `supabase db push --dry-run`.
- [ ] Documentar o plano de retorno do frontend e do banco.
- [ ] Aplicar as migrations no Supabase de producao.
- [ ] Confirmar compatibilidade com a versao ainda publicada.
- [ ] Mesclar a branch de integracao em `main`.
- [ ] Confirmar a sincronizacao com o Lovable.
- [ ] Publicar uma unica atualizacao no Lovable.
- [ ] Executar smoke tests na versao publicada.
- [ ] Registrar o resultado final em `STATUS.md`.

### Ordem do ciclo final

1. backup;
2. dry-run;
3. migrations de producao;
4. verificacao da versao antiga;
5. merge em `main`;
6. sincronizacao com Lovable;
7. publicacao;
8. smoke tests;
9. monitoramento inicial.

### Plano de retorno

- O frontend pode retornar para o commit anterior em caso de falha.
- Migrations aditivas nao devem ser removidas durante uma emergencia.
- Recursos novos podem ser ocultados temporariamente por configuracao.
- Movimentacoes financeiras ja registradas nunca podem ser apagadas.
- Uma migration corretiva deve ser usada quando houver problema de schema.

## Definicao de pronto

Uma fase so esta pronta quando:

1. migrations foram aplicadas e documentadas;
2. RLS foi testada;
3. interface possui carregamento, erro e estado vazio;
4. criterios de aceite possuem evidencia;
5. build passa;
6. testes da fase passam;
7. `STATUS.md` foi atualizado;
8. nao existem alteracoes de regra sem registro em `DECISIONS.md`;
9. existe um commit de checkpoint na branch de integracao;
10. nenhuma mudanca parcial foi publicada em producao.
