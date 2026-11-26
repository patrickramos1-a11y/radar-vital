# Estado de Execucao

Atualizado em: 2026-11-26

## Entrega recente

- Escopo de jornada por nucleo: implementado na branch de integracao em
  27/10/2026. A biblioteca geral mantem 39 capacidades; a jornada tecnica
  calcula somente o PAC de 28 capacidades e 84 pontos. Suporte e Administrativo
  exibem somente suas capacidades e competencias vinculadas, sem receber a
  escada tecnica. O vinculo do colaborador ao nucleo fica salvo no documento
  compartilhado do Plano Mestre. Pendencia funcional: definir PACs, metas e
  cargos proprios para Suporte e Administrativo antes de habilitar suas escadas.

- RESPONSABILIDADES 6: conferência em andamento para a publicação autorizada em
  27/10/2026. Banco confirmado com 39 capacidades, 56 competências e 1 metadata;
  fingerprints de todos os payloads, critérios e hashes coincidem com o SQL
  anexado. O SQL já estava aplicado e não foi reexecutado. Os seis novos códigos
  F19, F20, F21, F22, F23 e T11 estão presentes, com critérios nos níveis 1, 2 e 3.
  Frontend oficial já aceita 39/56; catálogo local de prévia permanece separado.
- Plano Mestre: jornada operacional publicada e verificada em 2026-10-26: 28
  capacidades, 56 responsabilidades e 1 metadata com hash original. O perfil
  ativo Patrick e o unico administrador operacional; os demais perfis ativos
  sao colaboradores. A jornada usa o seletor de perfil existente, sem login ou
  e-mail. As RPCs e politicas publicas foram adaptadas a esse modelo; ele nao
  constitui uma fronteira de identidade. O teste de infraestrutura ao vivo so
  executa com `RUN_LIVE_RELEASE_TESTS=true` e a CLI Lovable disponivel.
- Entregaveis semanais concluidos: implementacao concluida em 2026-10-21.
- Prioridades concluidas geram entregas automaticamente; 37 entregaveis
  historicos abertos ou em andamento foram convertidos em prioridades.
- Lista agrupada por semana e colaborador; cadastro manual de entrega concluida
  mantido. Regra registrada em D-020.
- Migration aplicada no banco publicado e validada: nenhuma prioridade
  concluida sem entrega, nenhuma entrega aberta ou sem data.

## Estrategia ativa

- A entrega inicial do Plano Mestre seguiu a excecao D-021: migration aditiva,
  leitura e escrita verificadas, frontend publicado no dominio oficial.

- Modelo: desenvolvimento faseado com publicacao unica e acesso atual preservado.
- Producao: deve permanecer inalterada durante as Fases 0 a 6.
- Codigo: sera desenvolvido em branch de integracao.
- Banco de desenvolvimento: Supabase local ou projeto de teste.
- Banco de producao: migrations somente no ciclo final.
- Lovable: uma unica publicacao depois da Fase 7.
- Universo Ramos: extensao em andamento na branch `feat/universo-ramos-categorias`.
- Plano Mestre do Universo Ramos: fundamento estrategico registrado e base
  inicial publicada. As proximas regras de maturidade permanecem em descoberta. Ver
  `UNIVERSO_RAMOS_MASTER_PLAN_FOUNDATION.md`.
- Plano Mestre: arquitetura conceitual externa analisada e conectada ao
  Universo Ramos existente. O próximo passo é a descoberta PM-0, começando por
  três setores-piloto e um Marco Zero, sem alterar os domínios operacionais.
  Ver `UNIVERSO_RAMOS_MASTER_PLAN_INTEGRATION.md`.
- Plano Mestre: especificacao detalhada de paginas, navegacao, regras e
  prototipo visual registrada em `UNIVERSO_RAMOS_PLANO_MESTRE_ESPECIFICACAO.md`.
  Os exemplos usam os 11 setores ativos confirmados no banco conectado ao
  Lovable em 2026-10-24. Esta especificacao antecedeu a publicacao inicial.
- Plano Mestre (publicação inicial): dez áreas navegáveis implementadas na rota
  `/universo-ramos/plano-mestre`. Setores, desafios, tarefas, comentários e
  colaboradores são lidos das tabelas atuais sem escrita nelas. Capacidades,
  responsabilidades, solicitações novas, planejamento, pedidos de capacitação,
  pedidos para assumir responsabilidades, vínculos com núcleos e limiares são
  salvos em documento versionado separado. SQL e frontend publicados em
  2026-10-25; leitura e escrita verificadas. Ver D-021 e
  `UNIVERSO_RAMOS_PLANO_MESTRE_PUBLICACAO.md`.
- Planilha de responsabilidades recebida em 2026-10-25: 56 responsabilidades,
  184 atividades, 28 capacidades e 166 exigencias de nivel organizadas em
  catalogo auditavel. Quatro responsabilidades ainda nao tem perfil de
  capacidades. O mapeamento das 51 responsabilidades aplicaveis foi salvo em
  documento versionado; as 14 de Gestao Interna foram atribuidas a Gestao e
  Planejamento por decisao de Patrick. Cinco entradas gerais/transversais
  ficam fora da importacao automatica.
  A biblioteca oficial em tabelas proprias ainda depende do SQL. Ver
  `UNIVERSO_RAMOS_RESPONSABILIDADES_ESTUDO.md`.
- Jornada de capacidade do colaborador: biblioteca navegavel e fluxo de
  autoavaliacao, solicitacao e revisao administrativa implementados no codigo.
  Com as migracoes ainda nao aplicadas, a pagina permanece em previa visual sem
  gravacao. O seletor atual de perfil nao comprova identidade; a proposta de
  persistencia tem riscos de privacidade e integridade explicitados em
  `UNIVERSO_RAMOS_JORNADA_PUBLICACAO.md`. Anexos ficam indisponiveis.

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
| Supabase de producao | ATUALIZADO | Documento do Plano Mestre acessivel; leitura e escrita verificadas no projeto `ixiffabjunvpoizdhwtk` |
| Site publicado | ATUALIZADO | Plano Mestre disponivel em `radar-vital.vercel.app/universo-ramos/plano-mestre` |

## Baseline tecnico

- Plano Mestre: 12 testes de interface, 3 de armazenamento e 3 de documento
  remoto aprovados nesta preparacao. Suite completa: 57 testes aprovados.
- Lint dos arquivos alterados do Plano Mestre: aprovado. Lint global ainda
  aponta 67 erros preexistentes em outros arquivos.
- Compilacao local com configuracao de contingencia: aprovada. Compilacao
  padrao local nao inicia por ausencia do binario SWC nesta instalacao.
- Checagem de tipos: dois erros preexistentes em `useActivityLogs.ts` e
  `useClientComments.ts`; nenhum no Plano Mestre.

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

Executar a Fase OP-0 do plano de Oportunidades e Tesouro: perfis de recompensa,
adesao ao Tesouro, taxa versionada, solicitacoes de aceite e livro de
recompensas individuais. Ver `UNIVERSO_RAMOS_OPPORTUNITIES_TREASURY_PLAN.md`.

## Plano de oportunidades e Tesouro

- Estado: `PLANEJADO`.
- Escopo: Banco de Oportunidades, Minha Jornada, Tesouro segregado, saques
  individuais, ranking de producao, novas cores e artes dos setores.
- Arte setorial: 11 PNGs adicionados em `public/universe-sectors`; a migration
  `20260802120000_universe_sector_artwork.sql` atualiza as URLs dos cards de
  setor sem alterar AC/AV.
- Regra financeira confirmada: estrela-base vale R$ 1,00 e Super Estrela vale
  10 estrelas-base na vigencia atual; taxa sempre sera versionada.

## Importacao controlada do Universo Ramos

- Estado: `REVISAO DE FORMATO EM ANDAMENTO`.
- Fonte: `BANCO_MESTRE_UNIVERSO_RAMOS.xlsx`, aba `Banco Mestre`.
- Primeiro lote separado: 19 itens de Treinamentos, marcados como `Pronto para rascunho` e ainda `Nao enviado`.
- Regra: a interface importa somente rascunhos; responsaveis finais, prazo, valores, penalidades e publicacao continuam sendo decisao administrativa posterior.
- Publicacao: tela de importacao publicada no Vercel em 2026-08-01; a carga
  piloto de Treinamentos foi executada manualmente no mesmo dia.
- Qualidade: a auditoria identificou que criterios textuais foram indevidamente
  convertidos em checklist. A proxima carga usara `Orientacoes`, `Checklist` ou
  `Misto`, conforme a natureza de cada desafio. Ver
  `docs/roadmap/UNIVERSO_RAMOS_IMPORT_AUDIT.md`.

## Registro de execucao

```text
2026-08-25 - Central do Cliente visual e automacao de prioridades preparada
Resumo: a Central do Cliente deixa de abrir em abas e passa a apresentar
indicadores visuais para Tarefas, Prioridades, Entregaveis e Auditorias. O
atalho de tarefas segue abrindo diretamente o lancamento e a lista de tarefas
passa a informar ha quantos dias cada item esta aberto. Tarefas ja vinculadas
a prioridades agora aparecem como "Prioridade vinculada", sem nova promocao.
Banco: migration 20260825133000_task_priority_automation.sql adiciona a politica
editavel (45 dias, peso 1, incremento a cada 15 dias, maximo 5) e uma RPC
idempotente que registra a promocao e os aumentos de peso em activity_logs.
Validacao: build Vite de producao aprovado localmente. O lint geral continua
bloqueado por erros preexistentes fora deste escopo.
Publicacao: frontend publicado no link oficial do Vercel em 2026-08-25; a rota
`/universo-ramos` respondeu HTTP 200 no smoke test.
Pendencia: aplicar a migration no Supabase correto e regenerar os tipos. Ate
isso ocorrer, a regra automatica de 45 dias permanece inativa no banco, sem
alterar as tarefas existentes.

2026-08-24 - Gestao de Desafios, negociacao e contrapropostas preparada
Resumo: migration aditiva e interface do Universo Ramos criadas para
solicitacao de aceite, contraproposta, ajuste de desafio ativo, aceite explicito
do colaborador, notificacoes internas e linha do tempo de auditoria.
Arquivos: 20260824130000_challenge_negotiation_management.sql,
ChallengeManagementPanel, useOpportunityProgram, tipos e plano dedicado.
Validacao: build Vite de producao aprovado localmente.
Pendencia: aplicar a migration no projeto Supabase correto, regenerar tipos e
executar smoke test no link oficial antes de publicar.

2026-08-02 - OP-0 a OP-4 implementados localmente na branch feat/oportunidades-tesouro-op
Resumo: modelo aditivo de perfis de recompensa, adesao ao Tesouro, taxa
versionada, solicitacoes de aceite, livro de recompensas individuais, rota
Oportunidades, Minha Jornada, fila administrativa e Tesouro segregado criados.
Validacao: build de producao aprovado. Os testes Vitest nao iniciam no runtime
Node empacotado por incompatibilidade preexistente entre Vitest e Vite.
Ambiente: o conector Supabase desta sessao nao lista o projeto Radar Vital
(ixiffabjunvpoizdhwtk). A implementacao e a migration seguirao na branch, mas
nenhum SQL sera aplicado em outro projeto por seguranca. A aplicacao real no
banco e a publicacao final dependem de o projeto correto ficar disponivel no
conector ou de acesso administrativo equivalente.

2026-08-01 - Correcao do contrato de importacao de desafios preparada
Resumo: o Banco Mestre possui 103 desafios e 1.262 clausulas de conclusao.
Resultado: criterios tecnicos extensos deixam de virar checks automaticos; o
novo modelo separa orientacoes, checklist e modo misto, com migration aditiva,
interface e validacao de importacao preparadas localmente.
Pendencia: aplicar a migration em ambiente de teste, validar lote pequeno e
somente depois decidir sobre limpeza e nova carga dos rascunhos existentes.

2026-08-01 - Carga-piloto de Treinamentos executada
Resumo: 19 itens elegiveis do Banco Mestre foram importados para o Universo
Ramos como desafios em rascunho.
Resultado: todos permanecem sem valor, prazo, recompensa, penalidade e
publicacao no mural. O desafio previamente configurado continua preservado.
Proxima acao: revisar a qualidade textual dos rascunhos e configurar somente
os desafios que fizerem sentido para publicacao.

2026-08-01 - Tela de importacao controlada publicada
Resumo: o commit `658425d` foi enviado a `main` e o Vercel concluiu o deploy
de producao com sucesso para `radar-vital.vercel.app`.
Resultado: a funcionalidade esta disponivel no Banco de oportunidades, mas os
19 desafios de Treinamentos ainda aguardam a confirmacao manual da carga-piloto.

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

2026-09-16 - Gestao operacional de tarefas
Resumo: o Painel de Tarefas recebeu a aba `Gestao de tarefas`, com planilha editavel no desktop e cartoes operacionais no celular.
Arquivos: `src/pages/JackboxUnified.tsx` e `src/components/tasks/TaskManagementSheet.tsx`.
Migrations: nenhuma; a implementacao reutiliza os campos e atualizacoes existentes da tabela `tasks`.
Testes: 23 testes Vitest e build de producao aprovados; lint dos arquivos alterados sem erros; verificacao visual local e oficial em desktop e mobile aprovada, sem erros de console ou estouro horizontal.
Resultado: busca, filtros por status/cliente/responsavel/prioridade, ordenacao por coluna e edicao direta de responsavel, prioridade, prazo e conclusao disponiveis na mesma pagina.
Pendencias: nenhuma para esta entrega.

2026-10-18 - Upgrade da Central do Cliente
Resumo: as quatro etapas do upgrade foram consolidadas em uma unica experiencia operacional: base de status e contexto, execucao diaria com subtarefas, visao integrada de comentarios e historico, e escala com dependencias, modelos e recorrencia.
Arquivos: `docs/roadmap/CLIENT_WORKSPACE_UPGRADE_PLAN.md`, `src/components/checklist/TaskModal.tsx`, `src/components/tasks/TaskDetailSheet.tsx`, hooks, adaptadores, tipos e integracoes desktop/mobile.
Migrations: `20261018050305_client_workspace_upgrade.sql`, aditiva e pendente de aplicacao no projeto Supabase do Radar Vital.
Testes: TypeScript sem erros, ESLint dos arquivos alterados sem erros, 26 testes Vitest aprovados e build de producao aprovado.
Resultado: implementacao local concluida, com resumo gerencial do cliente, linha do tempo, comentarios integrados, descricao, situacao operacional, responsaveis, prazo, prioridade, subtarefas, dependencias, modelos e recorrencia.
Pendencias: o conector Supabase atual nao tem permissao no projeto `ixiffabjunvpoizdhwtk`; aplicar a migration, regenerar os tipos a partir do banco, validar o fluxo autenticado e somente entao publicar no Vercel.

2026-11-25 - Processos (prioridades e tarefas unificadas)
Resumo: menu unico Processos e aba unica na Central, com as melhorias que estavam paradas na pasta radar-vital-visual-release: Vencimento e Planejamento, planejadas contando como abertas, status fora do formulario, peso 5 "Maxima", subtarefas visiveis com participantes, cor do responsavel e canais realtime unicos. Repeticao semanal ou mensal no cadastro de prioridades e tarefas; concluir uma prioridade repetida abre o proximo periodo. Decisao registrada em D-024.
Arquivos: `src/pages/Processos.tsx`, `src/App.tsx`, `src/components/layout/navigationModel.ts`, `src/pages/CentralEntregas.tsx`, `src/components/central-entregas/PrioritiesTab.tsx`, `PriorityModal.tsx`, `src/hooks/usePriorities.ts`, `src/lib/processRecurrence.ts`, `src/lib/taskOperations.ts`; `TasksTab.tsx` removido por ficar sem uso.
Migrations: nenhuma. A coluna `tasks.recurrence` ja existe em producao (conferido por leitura em 25/11).
Testes: TypeScript sem erros, ESLint dos arquivos alterados sem erros, 241 testes Vitest aprovados (no Node 26 rodar com `NODE_OPTIONS=--no-webstorage`), build aprovado e tela conferida no navegador local sem gravar dados.
Resultado: implementacao concluida na branch `feature/processos-publicacao` e publicada por solicitacao expressa do usuario em 25/11/2026 (mesclagem em `main` com deploy automatico na Vercel), como excecao a publicacao unica, no mesmo espirito de D-021. Sem migrations.
Pendencias: acompanhar a primeira criacao e conclusao real de um processo repetido; intervalos livres de repeticao exigem migration futura.

2026-11-25 - Processos v2, passo 1 de 8 (migration)
Resumo: inicio do desenho "tudo vira processo" (docs/roadmap/PROCESSOS_V2.md, D-025). Migration aditiva: peso 1 a 5 e relogio do peso na tarefa; prioridades abertas viram processos (sem cliente vao para RAMOS ENGENHARIA, sem tarefa raiz ganham uma); repeticao com intervalo livre; comentario ligado ao processo; processo principal concluido gera entregavel sem duplicar o da prioridade; envelhecimento nao cria mais prioridades. Gatilhos mantem peso e urgencia iguais enquanto o codigo atual estiver publicado.
Arquivos: `supabase/migrations/20261125180000_processos_v2.sql`, `docs/roadmap/PROMPT_APLICAR_PROCESSOS_V2_SQL.md`, `docs/roadmap/PROCESSOS_V2.md`, `supabase/tests/processos_v2/`.
Migrations: `20261125180000_processos_v2.sql`, pendente de aplicacao pelo usuario no Lovable (texto pronto no PROMPT). Numeros lidos em producao em 25/11: 206 prioridades abertas, 190 com tarefa raiz, 15 sem cliente e sem tarefa, 1 com cliente e sem tarefa, 18 com tarefa raiz ja concluida (seguem concluidas).
Testes: migration executada duas vezes em Postgres local (PGlite) com casos reais simulados; 34 verificacoes aprovadas, inclusive o texto do PROMPT exatamente como sera colado.
Resultado: branch `feature/processos-v2`. Nada publicado; o app atual continua funcionando antes e depois da migration.
Pendencias: aplicar a migration e conferir as quatro consultas; depois seguir o passo 2 (modelo de processo no codigo). No dia da publicacao, rodar de novo `convert_open_priorities_to_processes`.
2026-11-25 - Processos v2, migration aplicada em producao
Resumo: o usuario aplicou `docs/lovable/processos-v2/1_aplicar_processos_v2.sql` no Lovable, sem erros (commit do Lovable `321562b`, registrado em `drizzle/migrations/0017_processos_v2.sql`). Conferencia: 0 prioridades abertas sem processo; 15 processos criados pela conversao; nenhum processo aberto sem peso (peso 1: 53, 2: 85, 3: 49, 4: 11, 5: 72); 4 colunas novas.
Achados: (1) o gatilho antigo `sync_task_to_priority` (drizzle 0012, ausente de `supabase/migrations`) marcou como concluidas 17 prioridades abertas cuja tarefa raiz ja estava concluida, com a data de conclusao da tarefa; e o mesmo que a tela ja mostrava, e nenhum entregavel novo foi criado. (2) A conversao criou 15 processos, nao 16: a prioridade que tinha cliente e nao tinha tarefa provavelmente mudou durante o dia, antes da migration. (3) Existem prioridades concluidas de envelhecimento com tarefa raiz ainda pendente (ex.: EDIFICACAO MULTIFAMILIAR VERTICAL - LO); o passo 2 decide como elas aparecem.
Pendencias: passo 2; incluir os gatilhos de `drizzle/migrations/0012_client_priority_tasks.sql` no teste local.
2026-11-25 - Processos v2, passo 2 de 8 (modelo de processo no codigo)
Resumo: a tarefa ganhou `weight` (1 a 5) no tipo, na leitura e na gravacao; criar com peso grava tambem a urgencia equivalente, e repeticoes copiam o peso. Novo `src/lib/processWeight.ts` (rotulos, Maxima = 5, mapas iguais aos do banco). `src/lib/processModel.ts` passa a montar processos so a partir das tarefas: tarefa raiz = processo, subtarefas = etapas, ordem por peso, vencimento e idade, Painel = abertos de peso 5. Prioridades nao entram mais no modelo.
Arquivos: `src/lib/processWeight.ts`, `src/lib/processModel.ts`, `src/lib/processModel.test.ts`, `src/hooks/useTasks.ts`, `src/types/task.ts`, dados de teste com peso.
Migrations: nenhuma.
Testes: TypeScript sem erros, ESLint dos arquivos alterados sem erros, 246 testes Vitest aprovados, build aprovado.
Resultado: branch `feature/processos-v2`. Nada publicado. As telas atuais ainda usam prioridades; os botoes de promover/rebaixar saem com elas nos passos 3 e 4.
Pendencias: passo 3 (tela Processos + Painel e Novo processo).
Decisao do usuario (25/11): as 3 prioridades concluidas cuja tarefa principal segue pendente (RENOVACAO LO; MONTAR PROCESSO DE LP - FLORECER; EDIFICACAO MULTIFAMILIAR VERTICAL - LO, todas peso 5) ficam abertas como processos de peso Maxima. Nenhum dado alterado.
2026-11-25 - Processos v2, passo 3 de 8 (tela Processos, Painel e Novo processo)
Resumo: nova aba unica `ProcessesTab` em `/processos` e na aba Processos da Central, montada so a partir das tarefas (`buildProcesses`). Duas visoes: Processos (todos, agrupados por cliente) e Painel (so abertos de peso Maxima, em cartoes). Cada processo mostra idade, peso (troca no proprio selo), repeticao, vencimento/atraso, planejamento, responsavel e participantes das etapas abertas; acoes: concluir, planejar, link, editar, excluir; etapas com conclusao e nova etapa. Botao unico Novo processo (peso, detalhes, clientes, responsavel, vencimento, planejamento, repeticao); criar pelo cartao do Painel ja grava peso Maxima. Sem estrela, sem promover e sem voltar para tarefa. `PrioritiesTab` removida. Filtro por responsavel conta so etapas abertas. Planejar processo de peso Maxima em `/processos` segue restrito ao Patrick, como era com prioridades; os demais pesos qualquer um planeja.
Arquivos: `src/components/processos/ProcessesTab.tsx`, `ProcessModal.tsx`, `processParts.tsx`, `ProcessesTab.test.tsx`, `src/lib/processDisplay.ts`, `src/lib/processModel.ts` (+ teste), `src/pages/Processos.tsx`, `src/pages/CentralEntregas.tsx`, `src/hooks/useTasks.ts` (aviso "Processo criado!"/"Etapa criada!"); removidos `PrioritiesTab.tsx` e seu teste.
Migrations: nenhuma.
Testes: TypeScript sem erros, ESLint dos arquivos novos sem erros, 228 testes Vitest aprovados (10 novos da aba; os da aba antiga sairam junto com ela), build aprovado. Conferido no navegador com os dados reais (perfil Patrick: 103 processos em 48 clientes; Painel com 12 de peso Maxima), sem gravar nada; Central e tela de celular conferidas.
Resultado: branch `feature/processos-v2`. Nada publicado.
Pendencias: passo 4 (Gestao de processos e processo-mae; `JackboxUnified` e `QuickCreatePanel` ainda usam `PriorityModal`). Os indicadores da Central ainda dizem "Prioridades/Tarefas" (passo 6).
2026-11-25 - Processos v2, passo 4 de 8 (Gestao de processos e processo-mae)
Resumo: `/jackbox-unificado` vira "Gestao de processos" com tres secoes (Todos, Planejados, Recorrentes) e indicadores de abertos, concluidos, clientes, sem responsavel, planejados e recorrentes. Todos = planilha de sempre, agora com todos os processos (saiu o recorte Tarefas/Prioridades, a estrela e o promover). Planejados e Recorrentes usam a aba de processos com recorte fixo (filtro por responsavel). Processo-mae: o processo que se repete fica aberto e ganha uma etapa por periodo (titulo "<processo> · dd/mm/aaaa", `parent_task_id` e `recurrence_origin_id` = mae, ordem por data); a mae mostra o periodo aberto mais antigo como "Proximo periodo"/"Periodo atrasado". Concluir a mae encerra a repeticao (nao cria mais outro processo). Formulario com Semanal, Quinzenal (14 dias), Mensal, Trimestral (3 meses), A cada N dias e A cada N meses (`recurrence = 'custom'` + intervalo). Menu "+" da Central: Processo, Anotacao e Entregavel (sairam Tarefa e Prioridade). `PriorityModal` removido.
Regras escolhidas: as etapas sao criadas a cada carga das tarefas, so as que faltam (o indice unico por mae e data evita duplicar entre abas); no maximo os 12 periodos vencidos mais recentes de uma vez, mais o proximo; o primeiro periodo e o vencimento da mae (sem vencimento, o dia do cadastro). A geracao so roda na versao publicada, porque o modo de desenvolvimento usa o banco de producao.
Arquivos: `src/pages/JackboxUnified.tsx`, `src/lib/processRecurrence.ts`, `src/lib/processModel.ts`, `src/hooks/useTasks.ts`, `src/types/task.ts`, `src/components/processos/*`, `src/components/central-entregas/QuickCreatePanel.tsx`, `src/pages/CentralEntregas.tsx`, `src/components/tasks/TaskManagementSheet.tsx`, `src/components/tasks/TaskDetailSheet.tsx`; testes `src/lib/processMotherRecurrence.test.ts` e `ProcessesTab.test.tsx`; removido `PriorityModal.tsx`.
Migrations: nenhuma (colunas `recurrence_interval`/`recurrence_unit` e o valor `custom` vieram na migration do passo 1).
Testes: TypeScript sem erros, ESLint dos arquivos alterados sem erros (os 7 erros restantes em `src/lib` sao antigos: pdfParser e universeChallengeImport), 243 testes Vitest aprovados, build aprovado. Navegador com dados reais, sem gravar: Gestao com 148 abertos, 35 planejados em 24 clientes e 0 recorrentes entre clientes ativos; menu "+" e campo "A cada N dias" conferidos.
Resultado: branch `feature/processos-v2`. Nada publicado.
Pendencias: passo 5 (Entregaveis: Em acompanhamento). A primeira geracao real de etapas so acontece depois da publicacao; conferir entao um processo recorrente criado de teste. Os nomes "Tarefa/Prioridade" que restam na planilha e na Central saem no passo 6.
2026-11-25 - Processos v2, passo 5 de 8 (Em acompanhamento)
Resumo: botao Comentar em cada processo grava em `client_comments.task_id` (aparece tambem nos Comentarios do cliente). Nova aba Em acompanhamento nos Entregaveis: 5 ultimas semanas com o ultimo comentario e faixas sem acompanhamento de 30, 60, 90 e mais de 90 dias (nunca comentado entra em mais de 90), com filtro por responsavel. Entregavel gerado por processo aparece como "Processo".
Arquivos: `src/hooks/useProcessComments.ts`, `src/lib/processFollowUp.ts` (+ teste), `src/components/central-entregas/FollowUpView.tsx` (+ teste), `src/components/processos/ProcessCommentDialog.tsx`, `DeliverablesTab.tsx`, `CentralEntregas.tsx`, `Processos.tsx`, `JackboxUnified.tsx`.
Migrations: nenhuma. Testes: 253 aprovados. Navegador: aba conferida com dados reais, sem gravar.
2026-11-25 - Processos v2, passos 6 e 7 de 8 (nomenclatura, marca de cliente e ranking)
Resumo: nenhuma tela fala mais em prioridade, estrela de prioridade, promover ou voltar para tarefa. Central: indicadores Processos (com planejados a parte), Peso Maxima e Atrasos, todos por processo (`processWorkloadFor`); seletor de colaborador conta processos. Historico mostra Processos concluidos com o peso; Desempenho conta processos e processos Maxima. Modal do cliente com um unico tipo "Processo" e editor de Peso (1 a 5); planilha de gestao sem selo/promover, com filtro e alteracao em massa por peso. Marca de cliente prioritario (estrela amarela) removida do Painel AC, cards, filtros, ordenacoes, celular, TV (cena "Geral"; cenas salvas com o valor antigo caem na ordem padrao), Universo Ramos e cadastro; os campos seguem no banco e o cadastro preserva o valor ao salvar. Ranking Geral = pontos + soma dos pesos dos entregaveis concluidos - processos atrasados (`deliverableWeight`: peso do processo, ou da prioridade antiga, ou 1 no manual); novos rankings Peso entregue e Processos Maxima entregues. Removidos 10 arquivos sem uso que ainda mostravam a marca ou prioridades.
Migrations: nenhuma. Conferido em producao por leitura: 0 prioridades abertas sem processo e nenhuma prioridade criada depois da migration; `convert_open_priorities_to_processes` nao precisou ser rodada de novo (pode ser rodada a qualquer momento, sem duplicar).
Testes: TypeScript sem erros, ESLint dos arquivos alterados sem erros novos (restam 2 `any` antigos em `ClientContext.tsx`), 258 testes Vitest aprovados, build aprovado. Navegador com dados reais, sem gravar: Painel AC sem a estrela, Central com os novos indicadores e Ranking Geral por peso, modal do cliente com Processos e Peso.
Observacao: o atalho "Prioridades" na barra de Painéis do Painel AC e um link cadastrado pelos usuarios (tabela `panel_links`), nao codigo; renomear ou apagar pela tela "Gerenciar Painéis Vinculados".

2026-11-25 - Processos v2, passo 8 de 8 (publicacao)
Resumo: publicacao feita por pedido expresso do usuario em 25/11/2026 ("Pode publicar"): PR #5 mesclado em `main` (commit `defc339`), deploy da Vercel com sucesso e site conferido em radar-vital.vercel.app (Processos com 103 processos do Patrick em 48 clientes, sem erros no console). Mesmo espirito de D-021 e da publicacao de Processos v1.
Testes antes de publicar: TypeScript sem erros, 258 testes Vitest aprovados, build aprovado; ESLint sem erros novos (2 erros antigos em `ClientContext.tsx`). Navegador local com dados reais, sem gravar: Processos, Painel, Gestao de processos e Em acompanhamento.
Conversao final: o usuario rodou `convert_open_priorities_to_processes('Publicacao Processos v2')` no Lovable em 25/11; 191 prioridades abertas verificadas, 0 processos criados, 0 atualizados, 0 movidas (todas ja tinham processo).
Pendencias: conferir o primeiro processo recorrente real (a geracao de etapas so roda na versao publicada).

2026-11-26 - Novo processo: peso so com icones e versao de celular
Resumo: a pedido do usuario, o formulario Novo processo/Editar processo escolhe o peso por uma fileira de 5 icones coloridos (nome do peso no titulo, no title e no leitor de tela); campos no mesmo padrao, botao Criar sempre visivel e, no celular, formulario como folha que sobe do rodape com botoes grandes.
Arquivos: `src/components/processos/ProcessModal.tsx`, `src/components/processos/processParts.tsx` (`WeightIconOptions`), `ProcessesTab.test.tsx`.
Testes: TypeScript sem erros, 258 testes Vitest aprovados, build aprovado; conferido no navegador em computador e celular (375 px), sem gravar.
Resultado: publicado por pedido expresso do usuario em 26/11/2026 (PR #6, commit `9710f6d`), deploy da Vercel com sucesso e formulario conferido em radar-vital.vercel.app.

2026-11-26 - Acompanhamentos recorrentes (implementacao)
Resumo: desenho em `docs/roadmap/PROCESSOS_RECORRENTES.md`, com as decisoes do usuario. Gestao de processos (antes "Gestao por cliente") passa a ter Recorrentes, Planejados e Todos, abrindo em Recorrentes. Novo acompanhamento: comeca de uma data ou de um marco (ex.: emissao da LO), frequencia por atalhos ou a cada N dias/semanas/meses/anos, primeira vez no marco ou um periodo depois, ate quando (sem fim, data ou numero de vezes), avisar antes (padrao 0) e a projecao das datas para marcar (passadas marcadas entram atrasadas; das futuras, a proxima sempre entra). Cartao com proxima data, atrasos e linha do tempo (feita, atrasada, dispensada, nao conta, prevista) para concluir, dispensar, lancar, editar, pausar e encerrar. O campo Repeticao do Novo processo abre o mesmo cadastro. A geracao automatica cria so a proxima data, nunca datas passadas.
Arquivos: `src/lib/recurringFollowUp.ts` (+ teste), `src/components/processos/FollowUpModal.tsx` (+ teste), `FollowUpBoard.tsx`, `formStyles.ts`, `ProcessModal.tsx`, `ProcessesTab.tsx`, `src/pages/JackboxUnified.tsx`, `src/hooks/useTasks.ts`, `src/types/task.ts`, `src/integrations/supabase/types.ts`, `navigationModel.ts`.
Migrations: `20261126120000_acompanhamentos_recorrentes.sql` (colunas opcionais em `tasks`), pendente de aplicacao pelo usuario no Lovable (`docs/lovable/acompanhamentos-recorrentes/`).
Testes: TypeScript sem erros, testes novos de datas, projecao, linha do tempo e formularios; navegador local sem gravar (formulario no computador e no celular).
Pendencias: aplicar a migration; publicar; conferir o primeiro acompanhamento real.
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
