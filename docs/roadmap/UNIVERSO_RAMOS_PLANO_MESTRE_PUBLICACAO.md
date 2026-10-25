# Plano Mestre: publicacao inicial

Estado em 2026-10-25: SQL aplicado no projeto `ixiffabjunvpoizdhwtk` e
frontend publicado em `https://radar-vital.vercel.app/universo-ramos/plano-mestre`.
Decisao de escopo: D-021.

## Fonte de dados

- Setores (`clients` do Universo Ramos), pessoas (`collaborators`), desafios,
  tarefas e comentarios continuam no banco operacional. Estas telas os leem,
  mas nao os alteram.
- `master_plan_documents` guarda um documento JSON versionado com os cadastros
  feitos nas dez areas do Plano Mestre: nucleo por setor, capacidade,
  responsabilidade, solicitacao nova, planejamento, pedidos de capacitacao,
  pedidos para assumir responsabilidade e limiar de cobertura do nucleo.
- `master_plan_document_revisions` arquiva a versao anterior em cada gravacao.
  O frontend usa revisao condicional para evitar sobrescrever alteracoes de
  outro navegador e tenta novamente quando ha concorrencia.
- O backup JSON pode ser exportado. O antigo rascunho deste navegador pode ser
  incorporado por acao explicita; em conflito de IDs, o registro ja salvo no
  banco prevalece. Importar JSON tambem mescla, sem apagar registros atuais.

## Aplicacao e verificacao realizada

1. O usuario confirmou a aplicacao do SQL no projeto `ixiffabjunvpoizdhwtk`.
2. A API de producao retornou o documento `universo-ramos`, com `version = 1`.
3. Uma gravacao controlada do mesmo payload avancou a revisao de 0 para 1 e
   confirmou o caminho de escrita sem criar cadastro de teste.
4. A suite Vitest passou (57 testes) e o build Vite local terminou com a
   configuracao de contingencia para o SWC indisponivel nesta instalacao.
5. O commit `da0359d` foi enviado a `main`; a Vercel marcou o deploy
   `dpl_FBAqeoMri58Dza5LjA9Vro9FHTbt` como READY e atribuiu o dominio oficial.
6. No dominio oficial, foram verificados o mapa inicial, os setores e pessoas
   reais, as telas de responsabilidades, capacidades e solicitacoes e a abertura
   do formulario de cadastro. Os demais fluxos tem cobertura automatizada,
   mas ainda dependem de uso real para validacao operacional.

A consulta de integridade do documento continua disponivel:

```sql
SELECT document_key, revision, payload->>'version' AS version
FROM public.master_plan_documents
WHERE document_key = 'universo-ramos';
```

Nao foi cadastrado nenhum exemplo artificial em producao. Na primeira sessao
de uso, exportar um backup JSON apos os cadastros iniciais e conferir a
persistencia apos recarregar a pagina.

## Limites desta versao

- O acesso segue o painel atual sem login. A politica de leitura e gravacao do
  documento permite `anon` e `authenticated`; nao constitui autorizacao por
  pessoa. Nao usar o Plano Mestre para dados sensiveis ou decisoes financeiras
  enquanto a autenticacao e o controle de papeis nao forem implementados.
- Pedidos de capacitacao ou responsabilidade ficam registrados, nao aprovados.
  Selecionar um titular nao certifica competencia. Os registros do Plano Mestre
  nao criam ou concluem tarefas nem desafios operacionais automaticamente.
- Anexos sao referencias textuais, sem upload. Subtarefas do planejamento sao
  texto por linha, ainda sem fluxo proprio de conclusao. Metas anuais e
  checkpoints sao uma evolucao posterior.
- O documento unico tem limite de 2 MB. A proxima etapa pode normalizar suas
  entidades em tabelas sem alterar o historico operacional existente.

## Retorno seguro

Se a publicacao falhar, restaurar a versao anterior do frontend. A migration
e aditiva e nao precisa ser revertida para a versao antiga continuar operando.
Nao excluir o documento nem o historico para corrigir uma falha de interface.
