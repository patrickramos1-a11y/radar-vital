# Processo de Importação Controlada - Universo Ramos

## Objetivo

Transformar itens aprovados no Banco Mestre em desafios no status `Rascunho`,
sem publicar oportunidades, notificar colaboradores ou atribuir valores
automaticamente.

## Fonte e elegibilidade

A aba `Banco Mestre` da planilha `BANCO_MESTRE_UNIVERSO_RAMOS.xlsx` é a fonte
de carga. Uma linha somente pode ser importada quando tiver:

- `Estado de maturidade = Pronto para rascunho`;
- `Status no aplicativo = Não enviado`;
- título, unidade/setor, descrição, condições, entregável e evidências
  preenchidos;
- responsável sugerido reconhecido no cadastro de colaboradores, quando existir.

Linhas em revisão, arquivadas, publicadas ou já enviadas não entram na carga.

## Fluxo de execução

1. A gestão abre `Universo Ramos > Desafios e oportunidades > Importar rascunhos`.
2. Seleciona o Banco Mestre em `.xlsx` ou `.csv`.
3. A aplicação lê apenas a aba `Banco Mestre`, filtra linhas elegíveis e exibe
   uma prévia com origem, responsável, tipo e erros por linha.
4. A gestão confirma somente as linhas válidas.
5. Cada linha é enviada pela RPC `import_universe_challenge` com chave
   `universe-ramos:<ID mestre>`, status `draft`, prazo nulo e valores zerados.
6. As condições são convertidas em checklist marcável.
7. A aplicação mostra o resultado por linha. Reexecutar a mesma planilha não
   cria duplicidades porque a chave de importação é única.
8. O administrador abre cada rascunho, define responsáveis finais, prazo,
   recompensa, super estrelas, penalidade e ajustes das condições.
9. Somente depois disso o desafio pode ser publicado.

## Regras preservadas

- Importação não publica no mural e não permite aceite da equipe.
- Recompensa, super estrelas e penalidade devem estar vazias ou em zero. Se a
  planilha possuir valor preenchido por engano, a prévia bloqueia a linha até a
  correção; valores serão definidos somente no rascunho.
- Prazo permanece opcional e não gera penalidade automática.
- Desafio aberto permanece sem responsável; desafio direcionado exige um
  responsável mapeado antes da importação.
- O identificador mestre é a referência para idempotência e auditoria.
- Falhas de uma linha não interrompem as outras linhas válidas; o resultado
  precisa informar exatamente quais linhas exigem correção.

## Lote inicial: Treinamentos

O primeiro lote autorizado é a frente de Treinamentos: `UR-014` a `UR-020`,
`UR-023` a `UR-025` e `UR-090` a `UR-098`, totalizando 19 itens. Eles foram
marcados como `Pronto para rascunho` na planilha e continuam `Não enviado`
até uma importação explicitamente confirmada na aplicação.

## Critérios de aceite

- A prévia informa quantidade elegível, erros e itens bloqueados.
- A aplicação cria somente rascunhos.
- Reimportar um item mantém um único desafio para o mesmo `ID mestre`.
- Condições surgem como checklist no desafio importado.
- O administrador consegue localizar os rascunhos e configurá-los antes de
  qualquer publicação.
