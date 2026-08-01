# Estado de Execucao

Atualizado em: 2026-08-01

## Estrategia ativa

- Modelo: desenvolvimento faseado com publicacao unica e acesso atual preservado.
- Producao: deve permanecer inalterada durante as Fases 0 a 6.
- Codigo: sera desenvolvido em branch de integracao.
- Banco de desenvolvimento: Supabase local ou projeto de teste.
- Banco de producao: migrations somente no ciclo final.
- Lovable: uma unica publicacao depois da Fase 7.
- Universo Ramos: extensao em andamento na branch `feat/universo-ramos-categorias`.

## Legenda

- `NAO INICIADA`
- `EM ANDAMENTO`
- `BLOQUEADA`
- `CONCLUIDA`

## Fases

| Fase | Estado | Dependencia | Proxima acao |
| --- | --- | --- | --- |
| 0. Fundacao de compatibilidade | CONCLUIDA | Nenhuma | Acesso atual e migrations compativeis revisados |
| 1. Universo Ramos | CONCLUIDA | Validacao final | Aplicar migration aditiva na janela final |
| 2. Visao Unificada | CONCLUIDA | Validacao final | Publicar frontend integrado na janela final |
| 3. Auditorias | CONCLUIDA | Validacao final | Aplicar migration aditiva na janela final |
| 4. Desafios | CONCLUIDA | Validacao final | Aplicar migration aditiva na janela final |
| 5. Tesouro | CONCLUIDA | Validacao final | Aplicar migration aditiva na janela final |
| 6. Performance | CONCLUIDA | Validacao final | Aplicar migration aditiva na janela final |
| 7. Integracao e publicacao unica | CONCLUIDA | Nenhuma | Monitorar uso e cadastrar os desafios iniciais |

## Estado dos ambientes

| Ambiente | Estado | Regra |
| --- | --- | --- |
| Producao atual | ATUALIZADO | Pacote do Universo Ramos aplicado em 2026-07-31 |
| Branch de integracao | ATIVA | `roadmap/radar-vital-integrado` |
| Supabase de desenvolvimento | BLOQUEADO | Docker indisponivel; avaliar projeto remoto de teste |
| Supabase de producao | PRESERVADO | Aplicar migrations apenas na Fase 7 |
| Lovable publicado | IDENTIFICADO | Projeto `ff634e1a-388b-4ec0-8a30-e4b3f23c2e3e` (`radar-vital.lovable.app`); publicar uma unica vez no final |

## Baseline tecnico

- Branch observada: `main`.
- Build de producao: aprovado antes da criacao deste roadmap.
- Bundle principal observado: aproximadamente 1,97 MB antes de gzip.
- Lint observado: 98 erros e 26 avisos preexistentes.
- Framework: React 18, Vite, TypeScript, Tailwind e shadcn/ui.
- Dados: Supabase.
- Testes automatizados: Vitest configurado; 7 testes aprovados no checkpoint da Fase 1.

## Riscos conhecidos

1. A identidade atual depende de `localStorage`.
2. A autorizacao administrativa atual usa o nome Patrick no frontend.
3. Algumas politicas RLS permitem acesso publico amplo.
4. Tipos gerados do Supabase estao defasados.
5. Migrations de Auditorias, Desafios, Tesouro e Performance ainda nao foram executadas em banco isolado.
6. Relacionamentos antigos usam nomes em vez de UUID.
7. Estatisticas sao calculadas em grande parte no cliente.
8. O carregamento sob demanda foi aplicado, mas deve ser medido com dados e navegacao autenticada.

## Proxima entrega recomendada

Aplicar em Supabase isolado somente as migrations compativeis com o acesso
atual, validar os fluxos operacionais e preparar a publicacao unica da Fase 7.

## Importacao controlada do Universo Ramos

- Estado: `PRONTA PARA VALIDACAO LOCAL`.
- Fonte: `BANCO_MESTRE_UNIVERSO_RAMOS.xlsx`, aba `Banco Mestre`.
- Primeiro lote separado: 19 itens de Treinamentos, marcados como `Pronto para rascunho` e ainda `Nao enviado`.
- Regra: a interface importa somente rascunhos; responsaveis finais, prazo, valores, penalidades e publicacao continuam sendo decisao administrativa posterior.
- Publicacao: nenhuma importacao foi executada no banco nem publicada nesta etapa.

## Registro de execucao

```text
2026-08-01 - Processo de importacao controlada do Universo Ramos preparado
Resumo: a tela de Desafios e oportunidades agora aceita o Banco Mestre em XLSX,
XLS ou CSV, le somente as linhas prontas para rascunho e mostra uma previa por
ID mestre com origem, responsavel, tipo e erros de validacao.
Resultado: cada linha valida usa uma chave idempotente, entra como `draft`, sem
prazo, recompensa, super estrelas ou penalidade; as condicoes viram checklist.
O retorno da importacao informa cada linha criada/atualizada ou bloqueada.
Pendencia: validar a interface e executar a primeira carga somente apos
confirmacao administrativa; nenhum desafio foi criado automaticamente.

2026-07-31 - Universo Ramos, UR-1 concluida
Resumo: o dominio challenges foi ampliado para origem interna, desafio aberto
sem participante, prazo opcional, criterios, entregavel e evidencias.
Resultado: migration aditiva `20260731230000_universe_ramos_challenges.sql`,
tipos e mapeadores atualizados; build e testes locais aprovados.
Bloqueio externo: a integracao Supabase desta sessao nao possui permissao para
aplicar migrations. Nenhuma alteracao foi enviada para producao.

2026-07-31 - Universo Ramos, UR-2, UR-3 e UR-5 preparados
Resumo: foram implementados o cadastro completo de desafio interno, a Central
da unidade aberta pelo card, a validacao administrativa e o mural de desafios
abertos com aceite pelo usuario selecionado.
Resultado: a interface usa o dominio `challenges` existente e preserva AC/AV.
Build e testes locais aprovados. A execucao real permanece dependente da
migration UR-1; portanto esta branch ainda nao pode ser publicada.

2026-07-31 - Universo Ramos, UR-4 concluida localmente
Resumo: cards legados de colaborador passam a se conectar ao cadastro oficial
da equipe por `universe_collaborator_id`; nome, iniciais e foto exibidos no
Universo seguem o perfil do colaborador. Novos cadastros internos nao oferecem
a categoria Colaborador, evitando duplicacao futura.
Pendencia: aplicar a migration e conferir a associacao dos registros legados em
ambiente de validacao.

2026-07-31 - Universo Ramos, UR-6 concluida localmente
Resumo: a carga inicial possui CSV-modelo, parser com validacao por linha,
testes e RPC idempotente baseada em `import_key`.
Resultado: 19 testes e build aprovados. A importacao real continua bloqueada
ate que a migration seja aplicada em ambiente de validacao.

2026-07-31 - Lancamento Universo Ramos
Resumo: migrations de categorias e desafios internos aplicadas ao Supabase do
projeto Lovable; o frontend foi integrado ao `main` e enviado ao GitHub.
Validacao: schema confirmou os novos campos, a tabela de evidencias e as
funcoes `create_universe_challenge`, `accept_universe_challenge` e
`import_universe_challenge`; build e 19 testes aprovados; Vercel respondeu
HTTP 200 em `/universo-ramos`.
Resultado: desafios abertos, direcionados, central da unidade, mural e base
para carga idempotente estao publicados no pacote final.

2026-07-30 - Replanejamento de acesso
Resumo: autenticacao, login, senha, convite por e-mail e corte de RLS foram adiados por decisao funcional.
Resultado: o lancamento deve preservar o mesmo acesso da versao publicada; os artefatos locais de Auth nao devem ser enviados ao Lovable.
Pendencias: revisar ou substituir todas as migrations do roadmap que dependem de auth.users, auth.uid() ou politicas exclusivas para authenticated.

2026-07-30 - Revisao de lancamento apos adiamento de autenticacao
Resumo: autorizacao final recebida, mas a revisao identificou incompatibilidade entre a decisao atual e a branch de integracao.
Resultado: lancamento bloqueado tecnicamente nesta etapa; nao enviar prompt de SQL ou publicacao ao Lovable ainda.
Bloqueios: App ainda usa AuthGate/AuthProvider; existe tela de login e Edge Function de convite; migrations do roadmap foram escritas com dependencias de auth.users/auth.uid/RLS autenticada; o conector Lovable nao localizou o projeto informado; os projetos Supabase visiveis nesta sessao nao incluem o projeto configurado pelo repositorio.
Proxima acao: executar a revisao de compatibilidade da Fase 0, remover do pacote de lancamento os artefatos de Auth e adaptar as migrations para o fluxo atual antes de reconectar Lovable e Supabase corretos.

2026-07-30 - Fase 0, compatibilidade do frontend
Resumo: o frontend voltou ao acesso atual por seletor operacional de colaborador; AuthGate, tela de login, convite por e-mail e rota de acessos foram retirados do pacote de lancamento.
Arquivos: App, AuthContext, UserSelector; arquivos de login e Edge Function removidos.
Testes: Vitest 17 testes aprovados; build de producao aprovado.
Resultado: o painel volta a abrir sem login obrigatorio e preserva a identificacao operacional anterior.
Pendencias: adaptar ou substituir migrations de Auditorias, Desafios, Tesouro e Performance que ainda dependem de auth.users, auth.uid() ou RLS autenticada.

2026-07-30 - Fase 0, compatibilidade das migrations do roadmap
Resumo: migrations de Auditorias, Desafios, Tesouro e Performance foram adaptadas ao seletor operacional atual. A autoria passa a registrar o nome do colaborador selecionado, sem exigir sessao do Supabase Auth.
Arquivos: migrations 20260730140000_audits.sql, 20260731010205_challenges.sql, 20260731011448_star_treasury.sql e 20260731012821_performance_aggregates.sql; hooks e tipos Supabase locais.
Testes: Vitest 17 testes aprovados; build de producao aprovado.
Resultado: o pacote novo do roadmap nao usa auth.users, auth.uid() ou grants exclusivos para authenticated. Regras de administrador continuam na interface, coerentes com o acesso atual sem login.
Pendencias: aplicar o pacote em Supabase isolado, regenerar tipos a partir do schema real e validar autoria, idempotencia financeira e leitura anonima antes da Fase 7.

2026-07-30 - Reconexao dos ambientes
Resumo: o projeto Lovable correto foi localizado: `ff634e1a-388b-4ec0-8a30-e4b3f23c2e3e`, publicado em `radar-vital.lovable.app`.
Resultado: o Lovable deixou de ser bloqueio de identificacao. A conta Supabase conectada, entretanto, ainda nao enxerga o projeto configurado pelo repositorio (`ixiffabjunvpoizdhwtk`), portanto nao ha ambiente isolado valido para aplicar ou verificar o SQL.
Pendencias: conectar a conta/projeto Supabase correto ou indicar um projeto de teste equivalente. Nao aplicar migrations novas na producao antes dessa validacao.

2026-07-30 - Fase 0
Resumo: branch de integracao criada e portao de producao preservado.
Arquivos: documentacao do roadmap.
Migrations: nenhuma aplicada.
Testes: verificacao inicial do ambiente.
Resultado: Fase 0 iniciada.
Pendencias: Docker e Supabase CLI indisponiveis; preparar alternativa de teste.

2026-07-30 - Fase 0
Resumo: autenticacao real, papeis, login, autoria autenticada e corte condicional de RLS preparados.
Arquivos: AuthContext, AuthGate, Login, hooks operacionais, tipos e documentacao de corte.
Migrations: 20260730120000_auth_foundation.sql e 20260730121000_conditional_rls_cutover.sql, ainda nao aplicadas.
Testes: Vitest 3 testes aprovados; build de producao aprovado.
Resultado: implementacao local aprovada; producao preservada.
Pendencias: aplicar em Supabase isolado, regenerar tipos e validar RLS com usuarios admin/comum.

2026-07-30 - Fase 1
Resumo: Universo Ramos implementado como workspace isolado, com cadastro unico AC/AV/Universo, rota propria e escopo explicito na Central de Entregas.
Arquivos: tipos e contexto de clientes, cadastro/configuracao, sidebar, App, TV, Central de Entregas, pagina Universo Ramos e helpers de escopo.
Migrations: 20260730130000_universo_ramos.sql, ainda nao aplicada.
Testes: Vitest 7 testes aprovados; build de producao aprovado; lint manteve o baseline intermediario de 94 erros e 22 avisos preexistentes.
Resultado: implementacao local aprovada; painel principal e totais externos excluem Universo Ramos; producao preservada.
Pendencias: aplicar migration em Supabase isolado, validar CRUD real e executar verificacao visual autenticada em desktop, mobile e TV.

2026-07-30 - Fase 2
Resumo: tarefas, prioridades e entregaveis reunidos na Central do Cliente sem duplicacao de registros.
Arquivos: WorkItem, adaptadores, useClientWorkItems, ClientWorkDialog/ClientWorkList, TaskModal, Central de Entregas e entradas desktop/mobile.
Migrations: nenhuma.
Testes: Vitest 10 testes aprovados; build de producao aprovado; lint permaneceu em 94 erros e 22 avisos preexistentes.
Resultado: implementacao local aprovada; filtros e navegacao para o modulo de origem disponiveis; adaptadores de auditoria e desafio preparados.
Pendencias: validar visualmente com sessao autenticada e dados de teste; login local foi exibido corretamente, sem contornar a autenticacao.

2026-07-30 - Fase 3
Resumo: auditorias simultaneas implementadas como campanhas com snapshot dos clientes AC ativos, criterios por empresa, validacao administrativa e trilha de eventos imutavel.
Arquivos: migration 20260730140000_audits.sql, tipos e adaptadores de auditoria, hook useAudits, pagina Auditorias, seletor no Painel AC e indicadores nos cards desktop e mobile.
Migrations: 20260730140000_audits.sql, ainda nao aplicada.
Testes: Vitest 12 testes aprovados; build de producao aprovado; lint dos arquivos da fase sem erros (1 aviso preexistente em Index.tsx).
Resultado: implementacao local aprovada; producao e Lovable preservados.
Pendencias: aplicar em Supabase isolado, regenerar tipos, executar matriz RLS admin/nao admin e validar o fluxo autenticado em desktop, mobile e TV.

2026-07-30 - Fase 4
Resumo: desafios implementados como tarefas especiais com participantes, prazo, condicao de sucesso, recompensa integral em Super Estrelas e penalidade integral em estrelas.
Arquivos: migration 20260731010205_challenges.sql, tipos/adaptadores/testes de desafios, useChallenges, aba Desafios da Central de Entregas, Visao Unificada e tipos Supabase locais.
Migrations: 20260731010205_challenges.sql, ainda nao aplicada.
Testes: Vitest 15 testes aprovados; build de producao aprovado; lint dos arquivos da fase sem erros.
Resultado: implementacao local aprovada; desafio vencido muda apenas para aguardando validacao e a resolucao administrativa ainda nao movimenta o Tesouro, evitando premio ou penalidade duplicados antes da Fase 5.
Pendencias: aplicar migration em Supabase isolado, regenerar tipos, validar RLS admin/nao admin, testar idempotencia da resolucao e integrar movimentacoes financeiras na Fase 5.

2026-07-30 - Fase 5
Resumo: Tesouro de Estrelas implementado como livro imutavel com creditos, penalidades, estornos, liquidacoes e saldos individual/coletivo. Avaliacoes e desafios agora creditam cada participante de forma integral.
Arquivos: migration 20260731011448_star_treasury.sql, tipos/adaptadores/testes do Tesouro, useTreasury, pagina Tesouro, rota/navegacao e integracoes de avaliacao, desafio e Performance.
Migrations: 20260731011448_star_treasury.sql, ainda nao aplicada.
Testes: Vitest 17 testes aprovados; build de producao aprovado; lint dos arquivos da fase sem erros.
Resultado: implementacao local aprovada; joinha segue sem pontuacao, Super Estrela gera 10 estrelas-base, saldos podem ser negativos e liquidacao cria compensacao sem apagar o extrato.
Pendencias: aplicar migration em Supabase isolado, regenerar tipos, validar RLS admin/nao admin, exercitar premio/penalidade/estorno/liquidacao e confirmar a conciliacao de desafios e avaliacoes antes da Fase 6.

2026-07-30 - Fase 6
Resumo: Performance ampliada para consolidar Tesouro, tarefas, comentarios, clientes, prioridades, auditorias, desafios e entregaveis, com leitura individual, equipe, periodo e ordenacao por indicador.
Arquivos: PerformanceTab, migration 20260731012821_performance_aggregates.sql, tipos Supabase e documentacao.
Migrations: 20260731012821_performance_aggregates.sql, ainda nao aplicada.
Testes: Vitest 17 testes aprovados; build de producao aprovado; lint dos arquivos da fase sem erros.
Resultado: implementacao local aprovada; ranking oficial usa o saldo do livro de estrelas, joinhas seguem separados e a tela permite comparar produtividade, comunicacao, responsabilidades, auditorias e desafios.
Pendencias: aplicar migrations em Supabase isolado, regenerar tipos, validar resultados agregados contra os registros de origem e realizar verificacao autenticada em desktop, mobile e TV antes da Fase 7.

2026-07-30 - Fase 7
Resumo: integracao local revisada, rotas convertidas para carregamento sob demanda e servidor local iniciado para verificacao de disponibilidade.
Arquivos: App.tsx e documentacao de status.
Migrations: nenhuma aplicada; todas permanecem pendentes de validacao no Supabase isolado.
Testes: Vitest 17 testes aprovados; build de producao aprovado; lint dos arquivos modificados sem erros; aplicacao local respondeu HTTP 200.
Resultado: branch de integracao pronta para a validacao remota. O bundle inicial foi reduzido para aproximadamente 513 kB, com paginas carregadas sob demanda.
Pendencias: os conectores Supabase e Lovable retornaram indisponiveis/nao autenticados nesta sessao. Sem projeto de teste, matriz RLS, backup de producao, `db push --dry-run`, regeneracao real dos tipos e sincronizacao Lovable, a publicacao final permanece bloqueada.

2026-07-30 - Portao final de producao
Resumo: autorizacao explicita de lancamento recebida. O projeto Lovable correto e seu banco foram reconectados e o preflight foi executado sem alteracoes.
Baseline de producao: 70 clientes, 10 colaboradores, 395 tarefas, 45 prioridades, 121 entregaveis, 64 avaliacoes e 281 comentarios. As tabelas `audits`, `challenges` e `star_transactions` nao existem no schema atual.
Excecao aceita: nao ha ambiente Supabase isolado conectado e o conector Lovable nao expoe o estado de backup/PITR. A publicacao segue por autorizacao do responsavel, com migrations estritamente aditivas e sem remocao, renomeacao ou alteracao dos dados existentes.
Escopo autorizado: aplicar somente `20260730130000_universo_ramos.sql`, `20260730140000_audits.sql`, `20260731010205_challenges.sql`, `20260731011448_star_treasury.sql` e `20260731012821_performance_aggregates.sql`. Migrations de autenticacao permanecem excluidas.
Pendencias: aplicar o pacote, sincronizar o frontend integrado, publicar uma unica vez e executar smoke test no ambiente publicado.
```

## Modelo para proximos registros

Adicionar uma entrada a cada etapa relevante:

```text
AAAA-MM-DD - Fase X
Resumo:
Arquivos:
Migrations:
Testes:
Resultado:
Pendencias:
```

Nenhuma conclusao de fase autoriza publicacao individual. A liberacao para
producao deve ser registrada apenas na Fase 7.
