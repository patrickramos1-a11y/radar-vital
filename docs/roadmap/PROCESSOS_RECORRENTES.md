# Acompanhamentos recorrentes — proposta (26/11/2026)

Refinamento do processo-mãe recorrente do Processos v2 (D-025), a pedido do
Patrick. Implementado e publicado em 26/11/2026 (PR #7).

## 1. O problema hoje

- A repetição é só um campo dentro do Novo processo. A data de partida é o
  "Vencimento", e isso não é óbvio: não fica claro **quando começa**.
- Ao salvar, o sistema cria sozinho até 12 períodos já vencidos, todos como
  atrasados, sem perguntar se eles contam.
- Não existe um lugar para ver a projeção: o que ficou para trás, o que está
  em dia, quando é a próxima.
- Hoje não há nenhum processo recorrente em produção, então dá para mudar a
  lógica sem migrar dados.

## 2. Exemplos que precisam ficar fáceis

| Caso | Marco | Frequência | 1ª vez |
|---|---|---|---|
| Visita de acompanhamento no Fasano | 26/11/2026 (hoje) | todo mês | no próprio marco |
| Laudo da caixa separadora de água e óleo | LO emitida em 15/09/2026 | a cada 180 dias | 14/03/2027 (180 dias depois) |
| Análise de efluentes | LO emitida em 15/09/2026 | a cada 6 meses, até o vencimento da LO | 15/03/2027 |

## 3. Como cadastrar (formulário "Novo acompanhamento")

Um formulário próprio, em passos curtos, com a resposta sempre à vista. Ele
abre pela aba Gestão ("Novo acompanhamento") e também pelo campo Repetição do
Novo processo, que leva ao mesmo formulário.

Primeiro a pessoa escolhe **como começa**. São caminhos diferentes da mesma
coisa; muda só o que vem preenchido:

- **A partir de hoje / de uma data**: "a cada 2 meses fazer acompanhamento com
  tal cliente", "a cada 40 dias". A primeira vez é na própria data.
- **A partir de um marco**: licença emitida, contrato assinado, visita feita. A
  primeira vez é um período depois do marco, e dá para escrever o que é o marco.

Depois:


1. **O quê e para quem**: título, cliente, responsável, peso.
2. **A contar de quando**: data do marco e, opcional, o que é o marco
   ("Emissão da LO 123/2026").
3. **De quanto em quanto tempo**: atalhos (Mensal, Trimestral, Semestral,
   Anual, 180 dias) ou "a cada N dias / semanas / meses / anos".
4. **Primeira vez**: "no próprio marco" ou "um período depois do marco"
   (padrão para licenças).
5. **Até quando** (opcional): sem fim, até uma data (validade da licença) ou
   um número de vezes.
6. **Avisar antes** (opcional, padrão 0): N dias antes, a ocorrência aparece
   como planejada.

Abaixo do formulário, a **projeção** se atualiza a cada mudança, numa frase e
numa lista:

> Começa em **14/03/2027** e repete **a cada 180 dias**. Próximas: 14/03/2027,
> 10/09/2027, 08/03/2028…

A projeção é uma **lista de datas com caixa de marcar**: a pessoa escolhe
quais datas o processo já cria como etapas. As datas vencidas aparecem
separadas das futuras; a vencida marcada entra como atrasada, a desmarcada fica
no histórico como "não conta". Atalhos: "Marcar todas", "Só as próximas" e
"Só a próxima".

## 4. Como acompanhar (aba "Gestão de processos")

Na página Processos, uma aba **Gestão de processos** com duas visões:

- **Recorrentes**: um cartão por acompanhamento, agrupado por cliente, com
  frequência, marco, **próxima data** e situação (em dia / N atrasadas /
  encerrado). Abrindo o cartão, a **linha do tempo**:
  - feitas (✓, com a data em que foram concluídas);
  - atrasadas (contam como atraso);
  - dispensadas (não contam);
  - próximas, projetadas até o fim ou até 12 meses à frente.
  Ações: concluir a ocorrência, dispensar ("não conta"), editar a regra,
  pausar e encerrar.
- **Planejados**: processos com data de planejamento futura, como hoje.

## 5. Regras

- O acompanhamento é um processo aberto (o "processo-mãe"); cada ocorrência é
  uma etapa dentro dele, como já é hoje.
- Viram etapa as datas marcadas no cadastro. As datas futuras não marcadas são
  só projeção, calculadas na tela, e a próxima delas nasce como etapa quando a
  anterior vencer; assim nunca falta a próxima.
- Concluir uma ocorrência não muda as datas seguintes: elas seguem o marco
  (o laudo vence a cada 180 dias da LO, não da data em que foi feito).
- "Não conta" grava a ocorrência como dispensada: sai dos atrasos e do ranking,
  mas fica na linha do tempo.
- Editar a regra recalcula só as ocorrências futuras; as passadas ficam como
  estão.
- Encerrar conclui o processo-mãe e dispensa as datas em aberto. Quando passa a
  última data do "até quando", o cartão mostra "Sem próximas datas" para a
  pessoa encerrar.
- Padrão da projeção: datas passadas vêm marcadas (entram atrasadas) e, das
  futuras, só a próxima. A próxima sempre entra: o sistema mantém uma etapa
  aberta à frente. Data passada que ficou de fora pode ser lançada depois, na
  linha do tempo do cartão.

## 6. Banco (uma migration pequena, aplicada pelo Patrick no Lovable)

Colunas novas em `tasks`, só para o processo-mãe:

- `recurrence_anchor_date` (marco) e `recurrence_anchor_label` (o que é o marco);
- `recurrence_first` (`anchor` ou `after_interval`);
- `recurrence_end_date` e `recurrence_max_count` (até quando);
- `recurrence_lead_days` (avisar antes);
- `recurrence_paused_at` (pausa).

Semanas e anos são gravados como dias e meses. A ocorrência dispensada usa o
status `cancelada`, que já existe.

## 7. Decisões do Patrick (26/11/2026)

- Projeção como lista de datas para marcar: ele escolhe quais o processo já
  cria como etapas.
- Vários jeitos de começar (de hoje, de uma data, de um marco), todos o mesmo
  tipo de acompanhamento.
- Gestão de processos com três visões: Recorrentes, Planejados e Todos.
- A repetição fica nos dois lugares: aba Gestão e Novo processo.
- Avisar antes: escolhido em cada acompanhamento, padrão 0.
