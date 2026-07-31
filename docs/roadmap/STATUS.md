# Estado de Execucao

Atualizado em: 2026-07-30

## Estrategia ativa

- Modelo: desenvolvimento faseado com publicacao unica.
- Producao: deve permanecer inalterada durante as Fases 0 a 6.
- Codigo: sera desenvolvido em branch de integracao.
- Banco de desenvolvimento: Supabase local ou projeto de teste.
- Banco de producao: migrations somente no ciclo final.
- Lovable: uma unica publicacao depois da Fase 7.

## Legenda

- `NAO INICIADA`
- `EM ANDAMENTO`
- `BLOQUEADA`
- `CONCLUIDA`

## Fases

| Fase | Estado | Dependencia | Proxima acao |
| --- | --- | --- | --- |
| 0. Fundacao e seguranca | EM ANDAMENTO | Supabase de teste | Aplicar migrations e provar RLS |
| 1. Universo Ramos | EM ANDAMENTO | Supabase de teste | Aplicar migration e validar isolamento com dados reais |
| 2. Visao Unificada | EM ANDAMENTO | Login de teste | Validar a Central do Cliente com dados autenticados |
| 3. Auditorias | EM ANDAMENTO | Supabase de teste | Validar migration, RPCs e RLS com usuarios autenticados |
| 4. Desafios | EM ANDAMENTO | Supabase de teste | Validar migration, RPCs e RLS com usuarios autenticados |
| 5. Tesouro | EM ANDAMENTO | Supabase de teste | Validar livro, RPCs, RLS e liquidacao com usuarios autenticados |
| 6. Performance | EM ANDAMENTO | Supabase de teste | Validar agregados, periodos e conciliacao com dados reais |
| 7. Integracao e publicacao unica | EM ANDAMENTO | Conectores Supabase e Lovable | Validar banco isolado e executar ciclo final |

## Estado dos ambientes

| Ambiente | Estado | Regra |
| --- | --- | --- |
| Producao atual | PRESERVADO | Nao alterar durante as Fases 0 a 6 |
| Branch de integracao | ATIVA | `roadmap/radar-vital-integrado` |
| Supabase de desenvolvimento | BLOQUEADO | Docker indisponivel; avaliar projeto remoto de teste |
| Supabase de producao | PRESERVADO | Aplicar migrations apenas na Fase 7 |
| Lovable publicado | PRESERVADO | Publicar uma unica vez no final |

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
5. Migrations de Tesouro, Desafios e Performance ainda nao foram executadas em banco isolado.
6. Relacionamentos antigos usam nomes em vez de UUID.
7. Estatisticas sao calculadas em grande parte no cliente.
8. O carregamento sob demanda foi aplicado, mas deve ser medido com dados e navegacao autenticada.

## Proxima entrega recomendada

Conectar o Supabase e o Lovable nesta sessao. Depois, criar ou selecionar um
ambiente Supabase isolado, aplicar as migrations, regenerar os tipos, executar
as matrizes de RLS e os fluxos autenticados acumulados. Somente entao executar
o backup, a revisao de migrations e a publicacao unica da Fase 7.

## Registro de execucao

```text
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
