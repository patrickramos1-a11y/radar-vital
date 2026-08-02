# Plano - Oportunidades, Tesouro e Recompensas Individuais

## Objetivo

Evoluir Desafios do Universo Ramos de uma biblioteca administrativa para um
Banco de Oportunidades. O colaborador consulta oportunidades, solicita a
aceitacao com prazo e valor quando necessario, e Patrick decide. A conclusao
validada gera credito no Tesouro ou recompensa individual conforme as regras
deste documento.

## Decisoes fechadas

- Uma estrela-base vale R$ 1,00 no periodo atual.
- Uma Super Estrela equivale a 10 estrelas-base; portanto vale R$ 10,00 na
  taxa atual.
- A taxa e versionada por vigencia e registrada em cada credito, pagamento ou
  liquidacao. Alteracoes futuras nao recalculam historico.
- Colaboradores de producao podem solicitar participacao no Tesouro. Apenas
  participantes ativos entram no ranking e no saldo coletivo.
- Estagiarios e prestadores nao participam do Tesouro: seus desafios geram
  somente recompensa individual de 100% do valor definido.
- Desafio individual vinculado a colaborador de producao gera Tesouro
  obrigatoriamente.
- Desafio de setor, projeto, empresa ou geral permite ao participante de
  producao escolher Tesouro ou saque individual.
- Saque individual de participante de producao paga 25% do valor financeiro
  aprovado, nao gera estrelas no Tesouro e nao afeta ranking.
- Patrick aprova solicitacoes, valores, prazos, destinos, conclusoes,
  recompensas, penalidades e pagamentos.
- Nenhum credito e criado no aceite. Credito ou penalidade so ocorre apos a
  validacao administrativa da conclusao.

## Fase OP-0 - Fundacao e migracao segura

### Banco

1. Criar `collaborator_reward_profiles` com `production`, `intern`,
   `provider` e `admin`.
2. Criar `treasury_memberships` com estados `not_participant`,
   `requested`, `active` e `ended`, incluindo autor e datas de decisao.
3. Criar `star_value_rates` com valor por estrela, vigencia e autor.
   Criar a primeira taxa: R$ 1,00 por estrela-base.
4. Criar `challenge_acceptance_requests` para prazo proposto, proposta de
   Super Estrelas quando o valor estiver aberto, destino solicitado e decisao
   administrativa.
5. Estender `challenge_participants` com origem da aprovacao, destino da
   recompensa e estado operacional, sem alterar participantes existentes.
6. Criar livro imutavel `individual_reward_transactions`, separado de
   `star_transactions`, contendo valor bruto em estrelas, taxa congelada,
   percentual pago, valor em reais, status de pagamento e chave de
   idempotencia.
7. Criar views para oportunidade elegivel, jornada individual, Tesouro e fila
   administrativa.

### Regras de integridade

- RPC transacional valida perfil, adesao ao Tesouro e politica do desafio.
- A mesma validacao nao pode gerar dois creditos ou dois pagamentos.
- Estorno cria nova movimentacao; nunca edita ou apaga livro financeiro.
- Desafios ja importados permanecem `draft`, sem valor, politica e destino
  inferidos automaticamente.

### Aceite

- Migracao aditiva aplicada sem impacto em AC/AV.
- Tipos Supabase regenerados e hooks compatibilizados.
- Testes cobrem cada perfil e cada destino de recompensa.

## Fase OP-1 - Classificacao e administracao

1. Ampliar o Banco de Oportunidades atual para configurar em lote perfil-alvo,
   politica de recompensa, visibilidade e destino permitido.
2. Criar fila de solicitacoes para Patrick aprovar, ajustar prazo/valor/destino
   ou recusar com justificativa.
3. Manter importacao como rascunho: ela nunca publica, define valores ou
   insere participantes finais automaticamente.
4. Separar claramente `Rascunho`, `Publicado`, `Solicitado`, `Ativo`,
   `Aguardando validacao`, `Concluido`, `Nao concluido` e `Cancelado`.

## Fase OP-2 - Mercado de oportunidades

Criar rota/tela `Oportunidades` para a equipe, independente da tabela de
administracao.

- Blocos por setor com total aberto, maior recompensa e desafios sem valor.
- Busca por titulo, contexto, entregavel e setor.
- Filtros: setor, perfil elegivel, valor, sem valor, prazo, novidade,
  disponibilidade e maior recompensa.
- Cards mostram setor, titulo, contexto resumido, entregavel esperado, prazo,
  recompensa e acao principal.
- Detalhe mostra objetivo, orientacoes, entregavel, evidencia e historico da
  solicitacao, com leitura apropriada para celular.

## Fase OP-3 - Solicitacao e Minha Jornada

1. Criar formulario de solicitacao: prazo obrigatorio, valor proposto quando
   aberto e destino de recompensa quando elegivel.
2. Criar `Minha Jornada` com solicitacoes, ativos, aguardando validacao,
   concluidos e historico financeiro individual.
3. Mostrar escolha Tesouro/saque individual apenas a colaborador de producao
   com adesao ativa, em desafio cuja politica permita escolha.
4. Para estagiario/prestador, mostrar somente recompensa individual integral.

## Fase OP-4 - Tesouro, ranking e pagamentos

1. Ajustar views e tela do Tesouro para incluir somente membros ativos.
2. Separar saldo de Tesouro, ranking e saldo individual pagavel na interface.
3. Criar painel administrativo de participantes, taxas vigentes, pagamentos
   individuais, liquidacoes e estornos.
4. Registrar taxa e percentual aplicados no pagamento para preservar auditoria.

## Fase OP-5 - Cores, artes e ordenacao do Universo Ramos

### Ordem universal

Em cards, listas, filtros e seletores: Colaboradores, Setores, Projetos,
Empresas e Sem categoria. Dentro de cada grupo, ordem alfabetica.

### Cores setoriais

| Setor | Cor |
| --- | --- |
| Administracao | `#EF6F3C` |
| Brindes e Papelaria | `#B8CEE8` |
| Gestao e Planejamento | `#876029` |
| IA e Automacao | `#52A5CE` |
| Licenciamento e Processos | `#25533F` |
| Manutencao | `#6D1F42` |
| Marketing | `#AFAB23` |
| Pessoas e Cultura | `#FF7BAC` |
| Setor de Projetos | `#EFCE7B` |
| Suprimentos e Compras | `#D3B6D3` |
| Treinamentos | `#F4BEAE` |

Colaboradores usam a estrutura verde Ramos `#0DD375`; somente o nome usa a
cor do perfil. Projetos usam o verde SisRamos `#2B4226`.

As artes PNG ficam em `public/universe-sectors`. A migration correspondente
atualiza apenas cards de Universo Ramos da categoria `SETOR`.

## Fase OP-6 - Qualidade e lancamento

- Testes de regras financeiras, aceite, idempotencia, ranking e estorno.
- Testes de filtros e ordenacao em desktop e mobile.
- Smoke tests para Oportunidades, Minha Jornada, Tesouro e Banco administrativo.
- Backup, dry-run e publicacao somente depois da validacao integrada.

## Sequencia recomendada

`OP-0 -> OP-1 -> OP-5 -> OP-2 -> OP-3 -> OP-4 -> OP-6`

A Fase OP-5 pode ser publicada de modo independente por ser apenas visual e
por usar migration aditiva de URLs estaticas. As demais formam um pacote
funcional unico porque compartilham regras financeiras e transacionais.
