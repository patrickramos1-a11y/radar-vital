# Auditoria da Importacao de Desafios

Atualizado em: 2026-08-01

## Diagnostico

- O Banco Mestre contem 103 desafios em 19 frentes internas.
- As condicoes de conclusao somam 1.262 clausulas, media de 12,3 por desafio.
- A versao anterior do importador separava cada frase por ponto e virgula e criava
  um checklist. Isso transformava orientacoes tecnicas em um progresso artificial.

## Regra nova

Cada desafio declara um modo de conclusao:

| Modo | Uso | Progresso |
| --- | --- | --- |
| `Orientacoes` | criterios, contexto e direcao para avaliacao administrativa | nao exibe percentual nem checks |
| `Checklist` | etapas curtas, objetivas e efetivamente marcaveis | exibe checks e percentual |
| `Misto` | orientacoes gerais mais etapas verificaveis | exibe os dois blocos |

## Contrato da proxima planilha

Manter as colunas atuais e acrescentar:

- `Modo de conclusao`: `Orientacoes`, `Checklist` ou `Misto`.
- `Itens do checklist`: uma etapa verificavel por linha ou separada por ponto e virgula.
- `Orientações de conclusão`: texto orientador, criterios e contexto de validacao.

Para a primeira revisao de toda a base, todos os 103 itens devem entrar como
`Orientacoes`, preservando o texto que hoje esta em `Condicoes de conclusao`.
Somente desafios revisados manualmente devem usar `Checklist` ou `Misto`.

## Fluxo seguro

Banco Mestre revisado -> previa de validacao -> rascunho no Universo Ramos ->
definicao administrativa de responsaveis, prazo e valor -> publicacao.

Nenhuma carga define automaticamente estrelas, penalidades, prazo ou publicacao.
O criador de cada rascunho continua sendo o perfil operacional de Patrick; isso
nao se confunde com solicitacao de valor nem com responsavel final.

## Estado

- A migration local `20260801140000_challenge_completion_modes.sql` esta pronta.
- Ela ainda nao foi aplicada ao Supabase de producao.
- Os desafios existentes nao devem ser apagados por esta correcao.
- Antes de uma nova importacao, aplicar a migration em ambiente de teste e validar
  um pequeno lote representativo em `Orientacoes`, `Checklist` e `Misto`.
