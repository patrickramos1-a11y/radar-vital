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

- [ ] Criar a branch de integracao do roadmap.
- [ ] Preparar Supabase local ou projeto remoto de teste.
- [ ] Registrar uma baseline segura do schema e das migrations de producao.
- [ ] Preparar dados de teste sem alterar a base de producao.
- [ ] Mapear tabelas e politicas RLS atuais.
- [ ] Implantar Supabase Auth.
- [ ] Criar ou adaptar perfis com `user_id` e papel.
- [ ] Migrar a autorizacao administrativa para `auth.uid()`.
- [ ] Regenerar `src/integrations/supabase/types.ts`.
- [ ] Remover contornos de schema mantidos em `localStorage`.
- [ ] Criar helper unico de autorizacao na aplicacao.
- [ ] Criar base de testes com Vitest e React Testing Library.
- [ ] Documentar o fluxo de login e recuperacao.

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

- [ ] Criar migration para aceitar `UNIVERSO_RAMOS`.
- [ ] Atualizar tipos e validacoes.
- [ ] Adaptar o cadastro unico com tres naturezas.
- [ ] Tornar municipio opcional para Universo Ramos.
- [ ] Extrair a grade atual para um workspace reutilizavel.
- [ ] Criar rota `/universo-ramos`.
- [ ] Adicionar item de menu com icone de globo.
- [ ] Excluir Universo Ramos dos totais AC/AV.
- [ ] Adicionar filtro de escopo na Central de Entregas.
- [ ] Cobrir desktop, mobile e modo apresentacao.

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

- [ ] Definir o tipo `WorkItem`.
- [ ] Criar adaptadores para tarefas, prioridades e entregaveis existentes.
- [ ] Criar `useClientWorkItems(clientId)`.
- [ ] Substituir o modal por `ClientWorkDialog`.
- [ ] Adicionar filtros Tudo, Tarefas, Prioridades e Entregaveis.
- [ ] Incluir estados de carregamento, erro e vazio.
- [ ] Preparar adaptadores para auditorias e desafios.
- [ ] Garantir navegacao para o registro original.

### Criterios de aceite

- F2-AC1: todos os itens do cliente aparecem em ordem consistente.
- F2-AC2: nenhum registro e duplicado no banco.
- F2-AC3: filtros nao alteram os dados de origem.
- F2-AC4: alteracao no modulo original atualiza a visao.

## Fase 3 - Auditorias

### Entregas de banco

- [ ] Criar tabelas descritas em `DATA_MODEL.md`.
- [ ] Criar RPC atomica de abertura.
- [ ] Criar RLS administrativa para validacao e encerramento.
- [ ] Criar consultas agregadas por campanha.
- [ ] Criar log de alteracoes.

### Entregas de interface

- [ ] Criar rota e pagina `/auditorias`.
- [ ] Criar lista de auditorias simultaneas.
- [ ] Criar formulario de abertura.
- [ ] Criar detalhes com clientes, criterios e tempo.
- [ ] Adicionar seletor de auditoria no Painel AC.
- [ ] Exibir KPIs da auditoria selecionada.
- [ ] Adicionar modo `audit` ao card do cliente.
- [ ] Adicionar auditorias a Visao Unificada.
- [ ] Criar validacao e encerramento exclusivos do admin.

### Criterios de aceite

- F3-AC1: abertura inclui exatamente os clientes AC ativos daquele momento.
- F3-AC2: novas empresas nao entram retroativamente na campanha.
- F3-AC3: varias campanhas coexistem sem misturar resultados.
- F3-AC4: apenas Patrick valida ou encerra.
- F3-AC5: o painel mostra quantidades, tempo e situacao por empresa.

## Fase 4 - Desafios

### Entregas

- [ ] Criar tabelas e RPC de resolucao.
- [ ] Criar aba Desafios na Central de Entregas.
- [ ] Criar formulario com participantes, prazo, recompensa e penalidade.
- [ ] Permitir cliente opcional.
- [ ] Permitir vinculo com tarefas e entregaveis.
- [ ] Criar estado `aguardando_validacao`.
- [ ] Criar acao administrativa de sucesso ou insucesso.
- [ ] Integrar desafios a Visao Unificada.
- [ ] Preparar geracao das transacoes do Tesouro.

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
