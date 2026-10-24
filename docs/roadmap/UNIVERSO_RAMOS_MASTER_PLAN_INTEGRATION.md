# Plano Mestre no Universo Ramos

## Propósito

Este documento conecta dois materiais:

- `UNIVERSO_RAMOS_MASTER_PLAN_FOUNDATION.md`: os problemas reais que a
  plataforma precisa resolver;
- `UNIVERSO_RAMOS_MASTER_PLAN_CONCEPT_SOURCE.md`: a proposta conceitual de um
  Plano Mestre completo, inicialmente pensada como uma plataforma nova.

A decisão de arquitetura proposta é **não criar uma plataforma paralela**.
O Plano Mestre deve nascer dentro do Universo Ramos, aproveitando a estrutura,
os dados e os fluxos que já existem no Radar Vital.

> O Universo Ramos passa a ser a interface da empresa que está se construindo.
> O Plano Mestre é o domínio que explica o que a empresa precisa construir,
> por que, em que ordem e com quais evidências.

## Norte do produto

O produto não será um novo gerenciador de tarefas, um cronograma anual nem uma
réplica do SISRAMOS. Ele será o **gêmeo organizacional da Ramos**: uma
representação viva de capacidades, lacunas, iniciativas, dependências,
recursos, evidências e decisões.

As perguntas permanentes que ele deve responder são:

1. O que a Ramos precisa ser capaz de fazer?
2. O que já está consolidado, com evidência?
3. O que ainda falta construir?
4. O que depende de quê e o que está bloqueado?
5. Dentre o que está pronto agora, o que mais destrava a evolução?

## Fronteiras que não podem se perder

| Domínio | Pergunta que responde | Fonte de verdade |
| --- | --- | --- |
| SISRAMOS e painéis operacionais | Como a Ramos executa o trabalho recorrente? | Processos, tarefas, clientes e registros operacionais existentes |
| Central de Entregas | O que cada colaborador entregou ou precisa concluir? | Tarefas, prioridades, entregáveis e avaliações |
| Desafios e Tesouro | Como reconhecer, mobilizar e recompensar pessoas? | `challenges`, participantes, evidências e transações de estrelas |
| Plano Mestre no Universo Ramos | Como a Ramos se torna mais capaz, autônoma e integrada? | Novos registros de desenvolvimento e ligações com os domínios existentes |

Uma atividade operacional pode produzir evidência para o Plano Mestre, mas não
deve ser duplicada nele. Uma iniciativa de desenvolvimento pode gerar tarefas,
prioridades, desafios ou demanda para o SISRAMOS, mas continua sendo um único
registro estratégico no Plano Mestre.

## O que já existe e deve ser aproveitado

| Ativo atual | Papel no Plano Mestre | Direção |
| --- | --- | --- |
| Unidades internas do Universo Ramos (`EMPRESA`, `SETOR`, `COLABORADOR`, `PROJETO`) | Mapa inicial da estrutura organizacional | Manter como identidade das unidades; enriquecer perfis, não duplicar cadastros |
| Colaboradores | Pessoas, competências, disponibilidade e cobertura | Continuar usando o cadastro de colaboradores como fonte de pessoas |
| Tarefas, prioridades e entregáveis | Trabalho e resultados operacionais | Viram referências e possíveis evidências; não viram iniciativas automaticamente |
| Desafios | Mobilização, metas, oportunidades e reconhecimento | Permanecem como domínio próprio; podem executar uma iniciativa, mas não substituem a iniciativa |
| Tesouro de Estrelas | Reconhecimento e histórico de recompensa | Continua separado de orçamento, investimento e prontidão financeira |
| Comentários, histórico e auditorias | Contexto, decisão e evidência | Podem ser vinculados como prova, sem criar cópias |
| Central de Entregas | Visão do trabalho por pessoa | Recebe referências para iniciativas, sem tornar-se o Plano Mestre |

## Correção de modelo importante

O desafio atual não deve ser promovido a objeto central de toda construção
empresarial. Ele serve muito bem para execução e reconhecimento, mas uma
iniciativa de desenvolvimento possui ciclo mais longo e precisa guardar
dependências, recursos, impacto em capacidades, decisão, risco, consolidação e
evidências múltiplas.

Assim, a relação correta é:

```text
Capacidade com lacuna
  -> Iniciativa de desenvolvimento
    -> pode gerar tarefas, prioridades, desafios e solicitações
      -> produzem evidências
        -> atualizam a maturidade da capacidade
```

## Domínio mínimo novo

Os nomes finais dependem da leitura do schema antes das migrations. A proposta
é criar estruturas aditivas, com UUIDs e sem alterar o significado dos dados
operacionais existentes.

### 1. Perfil de unidade e setor

As unidades internas existentes continuam sendo o cadastro-base. Setores e,
quando aplicável, projetos ganham um perfil de desenvolvimento com:

- finalidade, resultados e limites de atuação;
- responsabilidades e decisões escaláveis;
- sistemas, fontes oficiais de informação e integrações;
- recursos, fornecedores e infraestrutura relevantes;
- indicador de integração com o SISRAMOS;
- responsável estrutural, substituto e riscos conhecidos.

### 2. Catálogo de capacidades

Uma capacidade é algo que a empresa precisa conseguir fazer de maneira
repetível. Exemplos: elaborar projetos, receber dados de levantamento, treinar
equipe, controlar orçamento ou publicar informações.

Cada capacidade deve ter:

- unidade principal e unidades beneficiadas;
- descrição do estado-alvo;
- responsabilidades, processos, recursos e competências necessárias;
- nível atual e nível-alvo;
- dependência do fundador;
- lacunas e evidências relacionadas.

### 3. Avaliação de maturidade e evidências

Maturidade não será uma nota solta. A régua inicial será de seis estágios:

`inexistente`, `dependente`, `funcional`, `padronizado`, `integrado_autônomo`
e `resiliente_autoevolutivo` como evolução posterior do nível máximo.

Uma avaliação precisa registrar quem avaliou, quando, quais evidências a
sustentam, quais lacunas permanecem e qual era o estágio anterior. A nota 0-10,
quando existir, será apenas uma leitura visual derivada da régua e das provas.

### 4. Iniciativas de desenvolvimento

Uma iniciativa responde a uma lacuna concreta e pode afetar mais de uma
capacidade ou setor. Ela precisa guardar:

- problema, origem e hipótese de melhoria;
- capacidade principal impactada e capacidades beneficiadas;
- unidade responsável;
- tipo: processo, sistema, treinamento, infraestrutura, contratação,
  automação, método, integração ou investimento;
- estado: ideia, triagem, validada, aguardando dependência, disponível, em
  execução, validação, consolidação, consolidada, cancelada, superada,
  substituída ou arquivada;
- critério de consolidação e evidências exigidas;
- impacto esperado, custo e esforço;
- vínculos opcionais com tarefas, prioridades, desafios, entregáveis e
  solicitações operacionais.

### 5. Grafo de dependências e bloqueios

O sistema precisa permitir ligações direcionadas entre iniciativa, capacidade,
recurso, decisão, risco e unidade. Cada ligação possui um tipo: financeira,
humana, competência, infraestrutura, sistêmica, decisória, documental,
regulatória, fornecedor, cliente ou estratégica.

Bloqueio não será apenas um campo textual. Ele deve informar causa, dono,
próximo passo, data de revisão e o que permanece liberado.

### 6. Recursos, decisões e oportunidades

No MVP, orçamento e disponibilidade entram como dados de planejamento, sem
substituir o sistema financeiro. Decisões da direção devem receber opções,
impactos e recomendação. Oportunidades registram uma janela concreta, como
saldo disponível, uma pessoa livre ou uma infraestrutura liberada.

### 7. Aprendizados, experimentos e sobras organizacionais

Uma ocorrência inédita não deve ir direto para processo ou para Patrick. Ela
entra como experimento, exceção, novo aprendizado ou sobra organizacional.
Após triagem, pode ser encerrada, virar melhoria, abrir uma iniciativa ou
gerar uma proposta de mudança operacional no SISRAMOS.

## Experiência dentro do Universo Ramos

O caminho visual proposto não substitui as telas atuais de unidades e desafios;
ele acrescenta uma camada de navegação voltada ao desenvolvimento.

### Visão Empresa

Tela inicial executiva com setores, maturidade, tendência, riscos, gargalos,
iniciativas disponíveis e dependência de Patrick. Não deve expor listas longas
de tarefas.

### Ficha Mestre do Setor

Ao abrir uma unidade do tipo `SETOR`, a ficha atual deve evoluir para abas:

1. Visão geral e finalidade.
2. Capacidades e maturidade.
3. Iniciativas e dependências.
4. Processos, integrações e fontes de informação.
5. Pessoas, competências e cobertura.
6. Recursos, riscos e decisões.
7. Histórico e marcos.

As abas atuais de tarefas, comentários e desafios continuam acessíveis como
evidência operacional, não como o centro da ficha.

### O que podemos fazer agora?

Lista somente iniciativas disponíveis, segmentada por poder de destravamento,
obrigação crítica, oportunidade de recurso e necessidade de decisão. Uma
iniciativa importante, porém bloqueada, não entra na fila executável.

### Central de Bloqueios

Ordena bloqueios pelo número de itens afetados, impacto, tempo bloqueado e
custo de resolução. Cada bloqueio precisa mostrar os dependentes e as opções
de desbloqueio.

### Central da Direção

Mostra somente decisão, risco, gargalo e oportunidade. A intenção é transformar
uma demanda malformada em uma escolha contextualizada para a direção.

## Sequência de implementação

### PM-0 — Descoberta e Marco Zero

Objetivo: transformar unidades internas atuais em uma fotografia inicial da
empresa, sem prometer automação prematura.

- confirmar as unidades que são setores, projetos, empresas e colaboradores;
- definir o glossário: capacidade, lacuna, iniciativa, evidência, bloqueio,
  consolidação, experimento e sobra organizacional;
- escolher 3 setores-piloto;
- registrar perfis mínimos, capacidades e maturidade inicial desses setores;
- definir quem compõe o PAD e quem pode validar maturidade.

Critério de aceite: três setores possuem um Marco Zero revisado, com
capacidades e evidências suficientes para orientar uma primeira iniciativa.

### PM-1 — Fundação de capacidades

Objetivo: dar ao Universo Ramos um modelo organizacional que conviva com os
cadastros atuais.

- migrations aditivas para perfis, capacidades, avaliações e evidências;
- ficha de setor com suas novas abas;
- histórico de maturidade e comparação atual versus alvo;
- vínculos de evidência com os registros que já existem.

Critério de aceite: a maturidade de uma capacidade só pode ser alterada com
evidência e fica registrada no histórico.

### PM-2 — Iniciativas, dependências e prontidão

Objetivo: construir a fila inteligente de desenvolvimento.

- iniciativas separadas de desafios;
- dependências tipadas e bloqueios com dono;
- cálculo de prontidão explicável;
- referências a tarefas, prioridades, entregáveis e desafios;
- telas de iniciativas disponíveis e central de bloqueios.

Critério de aceite: para cada iniciativa-piloto, é possível explicar por que
ela está disponível ou bloqueada e o que ela desbloqueia.

### PM-3 — Direção, oportunidades e governança

Objetivo: reduzir o Patrick como integrador manual.

- Central da Direção;
- decisões estruturadas com opções e impactos;
- registro de oportunidade e de recurso disponível;
- triagem PAD, experimento, aprendizado e sobra organizacional;
- estados de cancelamento, substituição e arquivamento.

Critério de aceite: uma novidade pode receber destino sem virar tarefa solta,
processo prematuro ou dependência informal da direção.

### PM-4 — Pessoas, recursos e integrações

Objetivo: ligar desenvolvimento organizacional à capacidade real de execução.

- matriz de competências e cobertura;
- dependência do fundador e autonomia por decisão;
- orçamento de planejamento e leitura de disponibilidade;
- integrações formais com SISRAMOS e financeiro, depois de confirmar suas APIs
  e fontes de verdade.

Critério de aceite: a plataforma explica se um gargalo é de pessoa,
competência, método, ferramenta, infraestrutura, dinheiro ou decisão.

### PM-5 — Inteligência e evolução contínua

Objetivo: usar dados acumulados para recomendação sem retirar a decisão humana.

- sugestões de lacuna a partir de recorrência e retrabalho;
- recomendação de iniciativas prontas e destravadoras;
- alertas de maturidade estagnada, risco de concentração e bloqueio prolongado;
- painel anual de evolução e marcos empresariais.

Critério de aceite: toda recomendação explica os dados e as relações que a
originaram; a plataforma não executa mudanças estratégicas sozinha.

## Primeiro recorte recomendado

Não começar pelos 25 objetos conceituais nem pela IA. O primeiro produto útil é
um recorte pequeno e profundo:

1. três setores-piloto;
2. suas capacidades-alvo;
3. Marco Zero de maturidade com evidência;
4. uma iniciativa por lacuna relevante;
5. dependências e bloqueios explícitos;
6. uma tela "O que podemos fazer agora?";
7. uma Central da Direção limitada a decisões e gargalos desses pilotos.

Esse recorte prova a lógica central antes de expandir para orçamento, pessoas,
integrações e inteligência.

## Decisões que precisam amadurecer antes de código

1. Quais três setores serão o piloto e qual capacidade será analisada primeiro?
2. Quem compõe o PAD e qual papel tem permissão para avaliar maturidade?
3. Qual fonte financeira será usada apenas como referência de planejamento?
4. Qual é a cadência de revisão: semanal para bloqueios, mensal para
   iniciativas e trimestral para maturidade?
5. Quais evidências mínimas tornam uma capacidade `padronizada` ou
   `integrada_autônoma`?
6. Qual informação operacional o SISRAMOS consegue devolver como evidência,
   sem duplicar seus registros no Radar Vital?

## Regras de execução

- Nenhum dado atual de AC/AV, tarefas, prioridades, entregáveis, desafios ou
  Tesouro será convertido automaticamente para o novo domínio.
- As migrations serão aditivas, reversíveis quando possível e testadas fora de
  produção antes da publicação.
- Cada tela executiva deve apontar para evidências e relações concretas.
- O Plano Mestre não medirá desempenho individual antes de mapear o ambiente,
  os processos e os recursos necessários para a pessoa executar bem.
- A IA entra como apoio à leitura e à recomendação, nunca como fonte final de
  maturidade, prioridade ou decisão estratégica.
