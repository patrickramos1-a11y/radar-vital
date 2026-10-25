# Plano Mestre: publicacao inicial

Estado em 2026-10-25: frontend e migration preparados; SQL de producao e
publicacao ainda dependem de validacao. Decisao de escopo: D-021.

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

## Aplicacao e verificacao

1. Confirmar que o SQL Editor aponta para o projeto `ixiffabjunvpoizdhwtk`.
2. Fazer backup do banco de producao conforme D-015.
3. Aplicar integralmente `supabase/migrations/20261025004456_master_plan_document.sql`.
4. Verificar que a consulta abaixo retorna uma linha com `revision = 0` e
   `version = 1` antes da primeira gravacao:

```sql
SELECT document_key, revision, payload->>'version' AS version
FROM public.master_plan_documents
WHERE document_key = 'universo-ramos';
```

5. Abrir a rota local, cadastrar uma capacidade de teste, atualizar a pagina e
   confirmar que ela permanece. Exportar um backup JSON.
6. Publicar o frontend somente apos a verificacao de leitura e gravacao no
   projeto correto. Executar smoke tests na URL oficial: abrir as dez areas,
   cadastrar uma responsabilidade, vincular capacidade/setor, planejar uma
   solicitacao e verificar persistencia apos recarga.

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
