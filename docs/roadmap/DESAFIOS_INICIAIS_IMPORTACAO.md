# Carga Inicial de Desafios do Universo Ramos

Use `desafios-iniciais.csv` como planilha-base. Cada linha representa um
desafio; ela pode ser aberta, direcionada ou coletiva.

## Regras de preenchimento

- `origem_nome` deve corresponder a uma unidade ja cadastrada no Universo Ramos;
- `origem_categoria`: `EMPRESA`, `SETOR`, `COLABORADOR` ou `PROJETO`;
- `tipo`: `company`, `sector`, `project`, `individual_goal` ou `company_general`;
- deixe `responsavel_inicial` e `participantes` vazios para publicar como desafio aberto;
- use `participantes` separados por `;` para um desafio coletivo;
- `prazo` e opcional, no formato `AAAA-MM-DD`;
- recompensas e penalidades sao inteiros. A recompensa de Super Estrelas e
  integral para cada participante; penalidade so pode ser aplicada por Patrick
  depois da validacao;
- `status_inicial` recomendado: `open`, `accepted` ou `draft`.

## Validacao antes da importacao

O importador deve rejeitar, antes de gravar qualquer linha:

1. titulo, origem ou condicoes de conclusao vazios;
2. origem inexistente ou categoria diferente da cadastrada;
3. tipo invalido;
4. prazo invalido;
5. colaborador inexistente;
6. valores negativos.

O arquivo ainda nao e importado automaticamente porque a migration UR-1 nao
foi aplicada no projeto Supabase desta sessao. O modelo e versionado para a
carga idempotente da UR-6 assim que houver ambiente de validacao disponivel.
