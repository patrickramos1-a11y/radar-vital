# Validacao Isolada e Lancamento Unico

## Finalidade

Este roteiro valida o pacote integrado do Radar Vital antes da unica publicacao
no Lovable. Ele deve ser executado em um projeto Supabase de teste com o schema
atual do Radar Vital, nunca diretamente no banco publicado.

## Migrations do pacote de lancamento

Aplicar nesta ordem, mantendo os arquivos como fonte de verdade:

1. `20260730130000_universo_ramos.sql`
2. `20260730140000_audits.sql`
3. `20260731010205_challenges.sql`
4. `20260731011448_star_treasury.sql`
5. `20260731012821_performance_aggregates.sql`

Nao aplicar neste lancamento:

- `20260730120000_auth_foundation.sql`
- `20260730121000_conditional_rls_cutover.sql`

O acesso continua pelo seletor operacional de colaboradores. A autoria das
novas acoes usa o nome do colaborador selecionado e as acoes administrativas
permanecem controladas pela interface atual.

## Preparacao do ambiente de teste

1. Criar uma branch de banco ou projeto Supabase temporario.
2. Replicar apenas schema e dados anonimizados/minimos necessarios.
3. Confirmar as tabelas base: `clients`, `collaborators`, `tasks`,
   `priorities`, `deliverables`, `deliverable_ratings` e `client_comments`.
4. Registrar backup/logico do schema antes de aplicar o pacote.
5. Aplicar as cinco migrations em ordem.
6. Gerar novamente `src/integrations/supabase/types.ts` a partir do schema de
   teste e comparar com os tipos locais.

## Matriz de validacao funcional

### Universo Ramos

- Criar um cliente `UNIVERSO_RAMOS` pelo cadastro unico.
- Confirmar que nao entra nos totais nem no grid AC/AV.
- Criar comentario, tarefa, prioridade e entregavel para ele.
- Confirmar que aparece apenas ao selecionar o escopo Universo Ramos.

### Auditorias

- Abrir duas auditorias simultaneas com criterios diferentes.
- Confirmar snapshot apenas de clientes AC ativos no momento da abertura.
- Atualizar criterio, status, nota e evidencia de uma empresa.
- Encerrar uma auditoria e confirmar que a outra permanece ativa.
- Conferir autoria e eventos pelo nome do colaborador selecionado.

### Desafios

- Criar desafio para um ou mais participantes, com prazo, recompensa e
  penalidade.
- Confirmar que vencimento muda somente para `awaiting_validation`.
- Validar como ganho e como perdido em desafios separados.
- Repetir a resolucao e confirmar idempotencia, sem duplicar movimento.

### Tesouro

- Avaliar entregavel concluido com joinha, estrelas e Super Estrela.
- Confirmar que joinha nao altera saldo e Super Estrela gera 10 estrelas.
- Conceder credito manual e penalidade manual.
- Confirmar que saldo pode ficar negativo.
- Estornar uma transacao e conferir trilha imutavel.
- Liquidar colaboradores e confirmar que o extrato permanece, com nova
  transacao de compensacao e valor em reais calculado apenas para saldo
  positivo.

### Performance

- Conferir totais individual e geral contra tarefas, comentarios, clientes,
  prioridades, auditorias, desafios e extrato do Tesouro.
- Comparar a visao mensal com os registros de origem.
- Confirmar que a pontuacao oficial usa estrelas e Super Estrelas, nunca
  joinhas.

## Validacao tecnica final

- Executar `bun run test`.
- Executar `bun run build`.
- Fazer verificacao manual em desktop, mobile e modo apresentacao.
- Revisar avisos de seguranca do Supabase no ambiente de teste.
- Confirmar que nenhum fluxo do pacote exige login, senha ou `auth.uid()`.
- Confirmar que a versao atual publicada permaneceu sem alteracoes durante a
  validacao.

## Criterio para publicacao unica

Somente depois de todos os itens acima aprovados:

1. aplicar as mesmas migrations na producao em uma janela unica;
2. sincronizar o commit aprovado no projeto Lovable;
3. validar a preview publicada;
4. publicar uma unica vez no Lovable;
5. registrar versao, horario e resultado no `STATUS.md`.
