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
| 2. Visao Unificada | NAO INICIADA | Fase 1 local | Definir `WorkItem` e adaptadores atuais |
| 3. Auditorias | NAO INICIADA | Fases 0 e 2 | Criar migration e RPC de abertura |
| 4. Desafios | NAO INICIADA | Fases 0 e 2 | Criar modelo e fluxo de validacao |
| 5. Tesouro | NAO INICIADA | Fases 0 e 4 | Criar livro de transacoes |
| 6. Performance | NAO INICIADA | Fases 3, 4 e 5 | Criar consultas agregadas |
| 7. Integracao e publicacao unica | NAO INICIADA | Todas | Validar e executar ciclo final |

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
5. Pontuacao de entregaveis e dividida entre responsaveis.
6. Relacionamentos antigos usam nomes em vez de UUID.
7. Estatisticas sao calculadas em grande parte no cliente.
8. O bundle deve ser dividido antes de receber muitas rotas novas.

## Proxima entrega recomendada

Implementar a Visao Unificada da Fase 2 enquanto a validacao das migrations das
Fases 0 e 1 aguarda um projeto Supabase isolado. Quando o ambiente estiver
disponivel, aplicar as migrations em ordem, regenerar os tipos e executar a
matriz de testes RLS documentada em `PHASE0_AUDIT.md`.

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
