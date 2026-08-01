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
- `descricao` deve conter contexto, orientacoes e detalhes que nao precisam
  ser marcados como concluidos;
- `condicoes_conclusao` deve conter somente checks verificaveis, separados por
  `;`. Cada item sera importado como uma condicao individual de progresso;
- todos os desafios iniciais devem entrar sem recompensa e sem penalidade. A
  gestao de valores sera feita depois na Biblioteca de Oportunidades;
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

O arquivo ainda nao deve ser importado automaticamente. A estrutura de checks
ja existe no banco; a proxima etapa e revisar os dados para separar contexto
de condicoes verificaveis e manter todos os valores inicialmente zerados.
