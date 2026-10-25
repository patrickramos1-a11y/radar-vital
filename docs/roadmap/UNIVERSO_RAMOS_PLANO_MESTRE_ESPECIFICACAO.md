# Plano Mestre do Universo Ramos - especificacao de produto e telas

Estado: proposta detalhada para validacao visual e funcional; nao representa
funcionalidade ja publicada. Atualizado em 2026-10-24.

## 1. Para que esta plataforma existe

O Plano Mestre sera uma camada de desenvolvimento da empresa dentro do
Universo Ramos existente. Ele responde: **o que a Ramos precisa aprender a
fazer, o que ja consegue fazer de forma confiavel, o que falta construir, o que
esta bloqueado e qual passo faz sentido agora?**

Nao e um segundo SISRAMOS, uma lista maior de tarefas nem um cronograma anual
rigido. O SISRAMOS continua registrando a operacao; a Central de Entregas
continua mostrando trabalho e reconhecimento por pessoa; desafios continuam
mobilizando colaboradores. O Plano Mestre conecta esses fatos para explicar a
evolucao estrutural da empresa.

```text
Setor existente -> capacidade desejada -> lacuna comprovada
  -> iniciativa -> dependencias e janela de execucao
  -> tarefas/desafios/processos que a executam
  -> evidencias -> validacao -> nova maturidade
```

O sistema pode chegar a 100% de uma **meta de maturidade definida para um
ciclo**, mas nao se torna definitivamente "100% pronto" por zerar iniciativas.
O backlog muda conforme a empresa aprende. A maturidade exige capacidade
repetivel, responsavel e substituto, processo, recursos, integracao e prova
de funcionamento. Uma iniciativa concluida sem consolidacao nao eleva a
maturidade automaticamente.

## 2. Fontes e limites desta especificacao

- O levantamento de problemas esta em
  [UNIVERSO_RAMOS_MASTER_PLAN_FOUNDATION.md](UNIVERSO_RAMOS_MASTER_PLAN_FOUNDATION.md).
- A proposta conceitual recebida esta em
  [UNIVERSO_RAMOS_MASTER_PLAN_CONCEPT_SOURCE.md](UNIVERSO_RAMOS_MASTER_PLAN_CONCEPT_SOURCE.md).
- O plano de integracao inicial esta em
  [UNIVERSO_RAMOS_MASTER_PLAN_INTEGRATION.md](UNIVERSO_RAMOS_MASTER_PLAN_INTEGRATION.md).
- A interface atual usa unidades internas do tipo `EMPRESA`, `SETOR`,
  `COLABORADOR` e `PROJETO`; a ficha atual da unidade ja mostra desafios,
  planejamento, tarefas, comentarios e historico.
- Em 2026-10-24 foi consultada, somente para leitura, a tabela `public.clients`
  do banco conectado ao projeto Lovable Radar Vital, filtrando
  `client_type = 'UNIVERSO_RAMOS'` e `universe_category = 'SETOR'`. A lista
  ativa da secao seguinte reflete essa consulta, nao apenas nomes sugeridos.
- **Nomes dos setores sao dados reais; capacidades, gargalos, pessoas,
  percentuais e iniciativas nos exemplos sao hipoteticos.** Precisam de
  diagnostico e validacao antes de virar dado oficial.

## 3. Setores atuais como ponto de partida

Nao criar novos cadastros de setor para o Plano Mestre. Cada ficha de setor
deve referenciar a unidade interna existente por ID, preservando nome, logo,
historico, tarefas, comentarios e desafios. `BRINDES` e o nome ativo no banco;
`BRINDES E PAPELARIA` tambem esta mapeado em recursos visuais, mas nao como
outro setor confirmado.

| Setor ativo | Exemplo de capacidade a diagnosticar | Exemplo de conexao intersetorial |
| --- | --- | --- |
| ADMINISTRAÇÃO | Registrar e distribuir demandas internas com responsavel claro | Recebe solicitacoes de todos os setores e encaminha compras |
| BRINDES | Planejar, produzir e conferir kits ou materiais institucionais | Depende de Marketing para identidade e de Suprimentos para materiais |
| GESTÃO E PLANEJAMENTO | Definir metas, acompanhar indicadores e revisar prioridades | Consolida sinais de Projetos, Administracao e Pessoas |
| IA E AUTOMAÇÃO | Automatizar um fluxo com dono, controle e revisao humana | Depende de processo bem definido pelo setor solicitante |
| LICENCIAMENTO E PROCESSOS | Receber requisitos, acompanhar condicionantes e rastrear protocolos | Recebe dados de Projetos e devolve pendencias formais |
| MANUTENÇÃO | Planejar manutencao preventiva, registrar falhas e validar retorno | Depende de agenda, materiais e sinalizacao de uso dos demais setores |
| MARKETING | Produzir e publicar comunicacao com revisao e padrao | Recebe briefing de Gestao e artefatos de Brindes |
| PESSOAS E CULTURA | Integrar pessoas, manter matriz de competencias e cobertura | Identifica lacunas de treinamento em todos os setores |
| SETOR DE PROJETOS | Elaborar, revisar e entregar projetos com padrao reproduzivel | Envia insumos tecnicos a Licenciamento e Treinamentos |
| SUPRIMENTOS E COMPRAS | Solicitar, comparar, comprar e registrar recebimento | Suporta Manutencao, Brindes, Projetos e Administracao |
| TREINAMENTOS | Planejar, executar e comprovar transferencia de conhecimento | Recebe lacunas de Pessoas e conteudo de especialistas |

Esta tabela e um **roteiro de entrevista**, nao uma declaracao de que essas
capacidades ja existem ou de que os fluxos ocorrem assim hoje. Um setor pode
ter varias capacidades; uma capacidade pode beneficiar varios setores, mas
deve ter um guardiao principal para evitar responsabilidade difusa.

## 4. Mapa de navegacao

Ao clicar em `Universo Ramos`, a estrutura atual permanece acessivel. A
proposta acrescenta um acesso `Plano Mestre`. A primeira tela do Plano Mestre
e `Visao da Empresa`, nao uma pagina publicitaria nem uma grade de centenas
de tarefas. O menu lateral acompanha todas as paginas principais; breadcrumbs
e links contextuais mantem a volta ao ponto anterior.

```text
Universo Ramos
|-- Unidades internas (atual)
|-- Desafios e oportunidades (atual)
`-- Plano Mestre
    |-- 1. Visao da Empresa
    |-- 2. O que podemos fazer agora?
    |-- 3. Ciclo e Roadmap
    |-- 4. Iniciativas
    |-- 5. Bloqueios e Dependencias
    |-- 6. Unidades e Setores
    |-- 7. Capacidades
    |-- 8. Pessoas e Cobertura
    |-- 9. Direcao e Decisoes
    |-- 10. Aprendizados e Experimentos
    `-- 11. Evolucao e Historia

Profundidade contextual:
  Unidade -> Ficha Mestre do Setor
  Capacidade -> Ficha da Capacidade
  Iniciativa -> Ficha da Iniciativa
  Ciclo -> Ficha da Meta e do Checkpoint
  Bloqueio -> Ficha do Bloqueio
  Pessoa -> Perfil de Cobertura
  Decisao -> Registro da Decisao
  Evidencia -> Registro de origem (tarefa, desafio, comentario etc.)
```

Sao **11 entradas principais + fichas profundas**, nao 11 tabelas soltas. A
Ficha Mestre do Setor e uma pagina de detalhe da entrada `Unidades e Setores`.
A `Visao da Empresa` e a pagina inicial do Plano Mestre. Para a primeira
implementacao visual, todas as entradas e fichas devem ser navegaveis mesmo
quando os dados forem demonstrativos.

## 5. Especificacao das paginas

### 5.1 Visao da Empresa - a abertura

**Pergunta:** onde a Ramos esta evoluindo, fragil ou dependente de uma decisao?

Topo: seletor do ciclo (ano e trimestre), data da ultima avaliacao, periodo
comparado e alertas de dados incompletos. O corpo apresenta uma tabela compacta
dos 11 setores com logo, nome, capacidades mapeadas, atual versus alvo,
tendencia, gargalo principal, responsavel estrutural e proxima revisao.
Contadores secundarios mostram iniciativas disponiveis, bloqueadas,
em validacao e decisoes aguardando direcao. A area `O que mudou` mostra
marcos recentes com link para prova, nao apenas um numero verde.

Clique no setor abre a Ficha Mestre; clique no gargalo abre Bloqueios; clique
na meta abre Ciclo e Roadmap; clique em `ver possiveis agora` abre a fila
filtrada. Nao exibir maturidade agregada quando nao houver Marco Zero: mostrar
`a diagnosticar` e quais evidencias faltam. Uma contagem de tarefas concluidas
nao substitui evidencia de capacidade consolidada.

### 5.2 O que podemos fazer agora?

**Pergunta:** entre as iniciativas viaveis neste momento, qual destrava mais?

Lista densa com iniciativa, setor guardiao, capacidades impactadas, janela
planejada, prontidao, recurso necessario, numero de dependentes desbloqueados,
esforco e proximo passo. Filtros por setor, tipo, recurso disponivel, janela,
impacto e responsavel. As abas sao `Disponiveis`, `Aguardando decisao`,
`Bloqueadas` e `Todas`; a padrao e `Disponiveis`.

O ranqueamento e explicavel: obrigacao critica, risco, efeito de desbloqueio,
janela de oportunidade e esforco estimado. Nao transformar esse conjunto em
uma nota opaca. Cada linha explica por que esta disponivel ou bloqueada; a
direcao pode reordenar manualmente e registrar o motivo. `Comecar` solicita
responsavel, janela e criterio de conclusao; no prototipo, abre formulario
visual sem gravacao.

### 5.3 Ciclo e Roadmap

**Pergunta:** que evolucao prometemos neste ano e quando vamos revisar?

Visoes por ano, trimestre e mes, com alternancia entre linha do tempo e lista.
O ano e uma lente de acompanhamento, nao a unidade que detem as iniciativas.
Uma meta anual aponta para capacidades-alvo e evidencias, podendo atravessar
setores. Exemplo ilustrativo: `2027: padronizar a passagem de Projetos para
Licenciamento`. Essa meta liga as capacidades dos dois setores, iniciativas,
marcos, checkpoints e evidencias.

Cada iniciativa pode ter inicio planejado, janela de execucao, prazo externo
obrigatorio e revisao prevista. Sao campos diferentes. Se a janela e fevereiro
mas um sistema indispensavel nao esta disponivel, mostrar `prevista para
fevereiro; aguardando sistema`, e nao somente `atrasada`. Um prazo legal
vencido continua sendo atraso real. Checkpoints mensais ou trimestrais
registram esperado, observado, impedimentos, decisao, novo alvo e autor.

Clique na barra abre a iniciativa; clique no marco abre evidencias; clique no
checkpoint abre registro de revisao. A virada do ano nao apaga historico nem
recria iniciativas: vincula as iniciativas persistentes ao novo ciclo quando
cabivel e conserva o resultado do ciclo anterior.

### 5.4 Iniciativas

**Pergunta:** que construcao organizacional esta em ideia, pronta, em curso ou
consolidacao?

Tabela com busca, filtros por setor, capacidade, estado, tipo, dono, ciclo,
prontidao e dependencia. A linha mostra problema, resultado esperado,
responsavel, beneficiados, estado, janela, proxima revisao e evidencias
pendentes. O comando `Nova iniciativa` pede origem e lacuna real; uma tarefa
isolada nao deve ser convertida automaticamente.

Ficha profunda: contexto e hipotese; capacidade antes/alvo; escopo e limites;
dependencias; recursos; plano de execucao; trabalhos vinculados; evidencias;
criterios de validacao; decisoes; cronologia. A ficha distingue `trabalho
concluido` de `capacidade consolidada`. Exemplo ilustrativo: Treinamentos
estruturar um programa interno para revisao de projetos; Projetos e Pessoas e
Cultura sao beneficiados, mas a iniciativa tem um unico guardiao.

### 5.5 Bloqueios e Dependencias

**Pergunta:** o que impede a evolucao e qual liberacao muda o maior numero de
itens?

Tabela de bloqueios com tipo (pessoa, competencia, metodo, ferramenta,
infraestrutura, dinheiro, decisao, documento, fornecedor, regulacao), causa,
dono, idade, revisao, iniciativas afetadas e alternativa temporaria. Uma
segunda visualizacao mostra o grafo `depende de` e `desbloqueia`. Clicar no
no abre a ficha; nao depender apenas do grafo para leitura.

Exemplo ilustrativo: `Treinamentos precisa de sala adequada` pode bloquear a
etapa presencial, mas nao a criacao de roteiro e materiais. O bloqueio deve
apontar ambos: o que esta impedido e o que segue executavel. Ao resolver a
causa, registrar evidencia, autor e data; o sistema recalcula a prontidao dos
dependentes. Evitar ciclos logicos como A depende de B e B depende de A.

### 5.6 Unidades e Setores

**Pergunta:** como a estrutura atual se organiza e onde estao as fronteiras?

Lista inicial dos 11 setores reais com logo, nome, finalidade resumida,
responsavel estrutural, capacidades mapeadas e maturidade com estado de
diagnostico. Alternar para mapa intersetorial, mantendo tabela como base
acessivel. Projetos e colaboradores existentes aparecem em secoes separadas,
nao como setores. Busca e filtro por categoria e por situacao de avaliacao.

Clique em `MARKETING`, por exemplo, abre a mesma unidade ja cadastrada, agora
com a Ficha Mestre. Nao se cria um segundo cadastro Marketing. Acoes de editar
identidade devem reutilizar o fluxo atual ou explicitar que editam somente o
perfil de desenvolvimento.

### 5.7 Ficha Mestre do Setor

Cabecalho: logo e nome existentes, finalidade, guardiao, substituto, ciclo,
ultima revisao e situacao do diagnostico. Abas:

1. **Panorama:** resultado esperado, limites de atuacao, maturidade das
   capacidades, gargalo, tendencia e proximo checkpoint.
2. **Capacidades:** lista com nivel atual, alvo, evidencia, lacuna e dono.
3. **Iniciativas:** disponiveis, bloqueadas, em execucao e em validacao.
4. **Processos e Integracoes:** recebe de quem, entrega a quem, contrato de
   informacao, ferramentas, fonte oficial e partes ainda informais.
5. **Pessoas e Cobertura:** competencias, titular, substituto, lacunas e
   dependencia de pessoa unica, sem virar avaliacao individual prematura.
6. **Recursos e Riscos:** disponibilidade de espaco, sistemas, equipamentos,
   fornecedores, planejamento financeiro e decisoes pendentes.
7. **Historico:** avaliacoes anteriores, marcos, evidencias, aprendizados.
8. **Operacao existente:** acesso a tarefas, comentarios, desafios e historico
   da unidade que ja existem no Universo Ramos.

Exemplo de navegação: `SETOR DE PROJETOS` -> capacidade `revisar projetos` ->
lacuna `revisao depende de uma pessoa` -> iniciativa `padronizar checklist e
treinar revisor substituto` -> tarefas e desafio ligados -> duas entregas
comprovadas -> avaliacao do novo estagio. Isto e um exemplo de fluxo, nao
um diagnostico real do setor.

### 5.8 Capacidades

**Pergunta:** o que a empresa precisa conseguir fazer de modo repetivel?

Catalogo em tabela com capacidade, setor guardiao, beneficiados, nivel atual,
alvo, tendencia, data da avaliacao e evidencia mais recente. Filtros por
estagio, setor, criticidade, dependencia do fundador e ciclo. Ficha profunda
mostra definicao operacional, resultado observavel, processo, ferramenta,
competencias, cobertura, interfaces, riscos, evidencias favoraveis e contrarias,
avaliacoes historicas e iniciativas relacionadas.

Exemplo ilustrativo: `SUPRIMENTOS E COMPRAS - comprar e rastrear materiais`
deve ser avaliada por repetibilidade e rastreabilidade, nao pela mera
existencia de uma compra concluida. Se a compra depende de uma unica pessoa e
nao ha registro de recebimento, a lacuna aparece explicitamente.

### 5.9 Pessoas e Cobertura

**Pergunta:** onde o trabalho ou o conhecimento depende de uma pessoa so?

Matriz por setor e competencia, mostrando titular, substituto, nivel de
cobertura, disponibilidade conhecida e plano de transferencia. O perfil de
uma pessoa liga suas competencias e participacoes em iniciativas, sem misturar
reconhecimento da Central de Entregas com diagnostico estrutural. Exemplo:
`LICENCIAMENTO E PROCESSOS` pode ter competencia de protocolo conhecida por
uma pessoa; o sistema sugere documentacao e treinamento, nao a rotula como
baixo desempenho. Dados pessoais sensiveis nao entram nessa tela.

### 5.10 Direcao e Decisoes

**Pergunta:** o que precisa de escolha executiva e qual e o custo de nao
decidir?

Fila curta com decisao, prazo de oportunidade, alternativas, impacto por
setor, custo estimado, recomendacao fundamentada, autor e bloqueios
dependentes. Abrir uma decisao revela historico, evidencias, opcao escolhida,
justificativa e data de revisao. Exemplo ilustrativo: aprovar sala de
Treinamentos, terceirizar temporariamente ou adiar presencial; cada opcao
altera iniciativas afetadas. A direcao decide, o PAD prepara o contexto.

### 5.11 Aprendizados e Experimentos

**Pergunta:** uma ocorrencia nova e excecao, padrao emergente ou capacidade
que precisa ser construida?

Caixa de entrada de sugestoes, recorrencias, retrabalho e sobras
organizacionais. Fluxo: registrar -> classificar -> testar pequeno -> revisar
-> descartar como excecao, incorporar processo existente ou abrir lacuna e
iniciativa. O registro mostra origem, setores atingidos, hipotese, risco,
resultado e decisao. Um comentario antigo pode ser vinculado como contexto;
nao vira iniciativa so por conter uma ideia. Exemplo: Manutencao registrar
falha recorrente e decidir se cabe checklist preventivo.

### 5.12 Evolucao e Historia

**Pergunta:** o que realmente mudou na Ramos entre dois momentos?

Linha do tempo e comparador por periodo, setor e capacidade. Mostra Marco
Zero, mudancas de maturidade, causas, evidencias, iniciativas que contribuiram,
decisoes e regressoes. Comparar `inicio de 2027` com `fim de 2027` sem somar
indicadores incompatíveis. Se uma capacidade retrocede, preservar o nivel
anterior e registrar o motivo. Exportacao ou relatorio e uma fase posterior,
nao requisito da primeira maquete visual.

## 6. Regras de dominio

### 6.1 Glossario e identidade

| Termo | Definicao | Nao confundir com |
| --- | --- | --- |
| Setor | Unidade interna ja cadastrada como `SETOR` | Cliente AC/AV ou projeto |
| Capacidade | Resultado que a empresa consegue reproduzir com confiabilidade | Tarefa isolada |
| Lacuna | Distancia comprovada entre estado atual e necessario | Ideia sem diagnostico |
| Iniciativa | Trabalho temporario para resolver uma lacuna estrutural | Desafio ou tarefa operacional |
| Dependencia | Condicao necessaria para iniciar ou consolidar algo | Simples correlacao |
| Bloqueio | Dependencia ainda nao satisfeita com impacto atual | Todo risco futuro |
| Evidencia | Registro verificavel que sustenta ou contesta uma avaliacao | Comentario sem verificacao |
| Marco | Resultado relevante na evolucao da capacidade | Apenas data no calendario |
| Ciclo | Recorte anual/trimestral para metas e revisoes | Container que encerra o plano |

### 6.2 Maturidade e consolidacao

Regua proposta, sujeita a calibracao com os pilotos:

| Nivel | Nome | Evidencia minima esperada |
| --- | --- | --- |
| 0 | Inexistente | Resultado necessario definido, mas sem execucao demonstrada |
| 1 | Dependente | Execucao possivel por pessoa especifica ou improviso |
| 2 | Funcional | Entrega ocorre, mas varia e ainda depende de intervencao frequente |
| 3 | Padronizado | Metodo, responsabilidade, ferramenta e registros repetiveis |
| 4 | Integrado e autonomo | Interface com outros setores, substituicao e tratamento de excecoes |
| 5 | Resiliente e autoevolutivo | Mede, aprende, corrige e mantem qualidade apos mudancas |

O nivel pertence **a cada capacidade**, nao nasce de media automatica de
tarefas. Um resumo por setor pode mostrar distribuicao dos niveis e cobertura
do diagnostico, evitando uma nota de aparente precisao. A avaliacao registra
avaliador, data, criterio, evidencias, pontos ainda frageis e proxima revisao.
Quando o material e insuficiente, o estado e `sem avaliacao`, nao nivel zero.
Mudancas exigem validacao humana e trilha de auditoria. A definicao final de
quem valida cada nivel ainda precisa de decisao.

### 6.3 Iniciativa versus execucao

- Uma iniciativa pode gerar varias tarefas ou desafios e ainda existir apos a
  conclusao deles, enquanto sua eficacia e observada.
- Concluir desafio pode remunerar e reconhecer a pessoa conforme as regras
  atuais, mas nao valida automaticamente maturidade.
- Prioridade e entregavel continuam no dominio da Central de Entregas; podem
  servir como evidencias se houver vinculo e revisao.
- Uma iniciativa pode beneficiar varios setores; uma tarefa existente nao
  deve ser clonada em cada setor beneficiado.
- Cancelar ou substituir iniciativa nao apaga tarefas, comentarios e provas
  historicas; registra motivo e sucessora quando houver.

Estados propostos: `ideia`, `triagem`, `validada`, `bloqueada`, `disponivel`,
`em_execucao`, `em_validacao`, `em_consolidacao`, `consolidada`, `cancelada`,
`substituida` e `arquivada`. A prontidao e uma **dimensao separada** do estado:
uma iniciativa validada pode estar bloqueada hoje e disponivel amanha.

### 6.4 Tempo, recorrencia e checkpoints

Registrar separadamente: `inicio_desejado`, `janela_planejada`,
`prazo_obrigatorio`, `data_de_revisao`, `data_real_de_inicio` e
`data_real_de_consolidacao`, conforme o tipo de item. Metas anuais podem ter
checkpoints trimestrais e a iniciativa pode atravessar mais de um ano. Revisao
mensal de uma iniciativa nao significa repetir sua execucao. Para rotinas
recorrentes, manter processo operacional e usar o Plano Mestre apenas para a
capacidade que o sustenta. A cadencia oficial de revisao fica em aberto ate
validacao com a equipe.

### 6.5 Prontidao e ordenacao

Uma iniciativa e `disponivel` quando as dependencias obrigatorias estao
satisfeitas, existe responsavel elegivel, recurso minimo confirmado e nao ha
decisao impeditiva. Pode permanecer `planejada` por escolha mesmo estando
disponivel. A interface mostra `por que` e `o que falta`. Recomendacoes
ordenam por efeito de desbloqueio, obrigatoriedade, risco e oportunidade;
o gestor pode ajustar com justificativa. Dinheiro, estrelas e pontuacao de
desafio nao sao a mesma grandeza.

### 6.6 Decisoes, permissao e auditoria

Na fase visual, botoes de decisao demonstram fluxo, sem persistir alteracoes.
Na fase real, proposta, edicao operacional, validacao de maturidade e decisao
executiva devem ser papeis separados. O acesso atual sem login obrigatorio
nao oferece autorizacao robusta; **nenhuma restricao sensivel pode depender
somente de esconder botoes no frontend**. O desenho final de permissoes e
uma decisao de seguranca antes da implementacao transacional. Toda mudanca de
estado, nivel, dependencia e decisao precisa de autor, data e historico.

## 7. Como reaproveitar o historico atual

Nao executar migracao destrutiva. Fazer uma **curadoria de vinculos**: os
registros ficam nas tabelas e telas de origem; o Plano Mestre guarda referencias
e a interpretacao organizacional aprovada. O mesmo item pode contribuir para
mais de uma capacidade com papel diferente, sem ser duplicado.

| Registro existente | Continua onde esta | No Plano Mestre pode ser |
| --- | --- | --- |
| Unidade `SETOR` | Cadastro e identidade atuais | Setor base da Ficha Mestre |
| Unidade `PROJETO` ou `EMPRESA` | Universo Ramos atual | Contexto de uma iniciativa ou unidade beneficiada |
| Colaborador | Cadastro e Central de Entregas | Responsavel, substituto ou competencia ligada |
| Tarefa e subtarefa | Gestao operacional | Acao de uma iniciativa ou prova de execucao |
| Prioridade | Central de Entregas | Trabalho focal relacionado, nao maturidade automatica |
| Entregavel | Central de Entregas e avaliacao | Possivel evidencia de resultado |
| Desafio | Mural, aceite, validacao e Tesouro | Instrumento de mobilizacao de uma iniciativa |
| Comentario | Conversa e historico de origem | Contexto, hipotese, decisao a confirmar ou evidencia |
| Auditoria e atividade | Seus fluxos atuais | Sinal de risco ou evidencia, mediante revisao |

Processo de migracao em etapas:

1. **Inventariar:** listar registros por setor, data, origem, responsavel e
   estado; identificar duplicatas e vinculos ausentes, sem altera-los.
2. **Classificar:** `operacao`, `contexto`, `evidencia candidata`, `lacuna`,
   `iniciativa candidata`, `sem relacao` ou `exige esclarecimento`.
3. **Vincular:** relacionar o item original a capacidade ou iniciativa com
   justificativa, autor e data; manter link de volta ao registro.
4. **Validar:** guardiao do setor e revisao designada confirmam se a prova e
   suficiente; comentario antigo nao e prova por default.
5. **Registrar Marco Zero:** avaliar nivel inicial por capacidade com data e
   ressalvas; nao retroagir uma avaliacao de hoje como se fosse de anos atras.
6. **Acompanhar:** importar novos fatos por referencia ou sugestao, sempre
   distinguindo sugestao automatica de vinculo aprovado.

Exemplo ilustrativo: um desafio ja cadastrado em `TREINAMENTOS` sobre preparar
material nao muda de natureza. Se ele contribuir para a iniciativa `criar
trilha interna de revisao tecnica`, a iniciativa aponta para o desafio. A
tarefa de revisar o material e uma segunda referencia. A capacidade so sobe
de nivel depois de evidencias de uso, repeticao e transferencia, nao pela soma
de dois itens concluidos.

## 8. Exemplos completos usando setores reais

### A. SETOR DE PROJETOS + LICENCIAMENTO E PROCESSOS

Hipotese: a passagem de dados tecnicos gera retrabalho. No Marco Zero, cada
setor descreve o que envia e recebe. A capacidade `preparar pacote tecnico
completo` pertence a Projetos; `receber e protocolar processo com
rastreabilidade` pertence a Licenciamento. A iniciativa compartilha um padrao
de envio, checklist, responsavel e excecoes. Dependencia: definir requisitos
minimos com Licenciamento. Execucao: tarefas operacionais nas ferramentas
atuais. Evidencias: dois pacotes reais aceitos sem retorno e registro de
tratamento de excecao. Checkpoint: revisar depois de um mes. Resultado possivel:
capacidade funcional ou padronizada, conforme prova, nao por antecipacao.

### B. TREINAMENTOS + PESSOAS E CULTURA + SETOR DE PROJETOS

Hipotese: conhecimento de revisao tecnica esta concentrado. Pessoas e Cultura
identifica cobertura; Projetos define conteudo; Treinamentos organiza a
transferencia. A meta anual pode ser `ter substituto apto ate o fim do ciclo`.
Ha uma janela desejada em fevereiro e uma dependencia de agenda e material.
Se a sala nao estiver pronta, o roteiro e o teste remoto continuam. O
checkpoint mostra a parte bloqueada e a parte possivel. Evidencia de
consolidacao: substituto executou revisao real com criterio aprovado e o
processo ficou documentado.

### C. MARKETING + BRINDES + SUPRIMENTOS E COMPRAS

Hipotese: solicitacoes de material institucional chegam sem briefing e geram
refacao. Marketing define identidade e aprovacao; Brindes define producao;
Suprimentos trata disponibilidade e compra. A iniciativa pode criar um fluxo
unico de pedido e aprovacao. Dependencias: modelo de briefing e regra de compra.
Uma entrega de kit e evidencia de execucao, mas a capacidade `produzir kits
com previsibilidade` requer repeticao e registro de custo e prazo. O nome
do setor no sistema permanece `BRINDES`.

### D. MANUTENÇÃO + ADMINISTRAÇÃO + IA E AUTOMAÇÃO

Hipotese: ocorrencias repetitivas de equipamento chegam por canais informais.
Manutencao descreve triagem e criterio de gravidade; Administracao define o
canal e a aprovacao; IA e Automacao so entra depois que o processo estiver
compreendido. Um experimento manual pode validar o fluxo antes de investir em
automacao. Isso impede automatizar um problema mal definido.

### E. GESTÃO E PLANEJAMENTO

Hipotese: metas dos setores nao sao revisadas na mesma cadencia. Uma
iniciativa define checkpoints, fonte de indicadores e responsavel por
interpretacao. Ela nao absorve as tarefas de todos os setores. Seu resultado
e a capacidade de conduzir revisao com decisoes registradas e ajustadas ao
contexto; o ciclo anual mostra o progresso, e o historico persiste no seguinte.

Esses cenarios sao materiais de prototipacao e entrevista. Nenhum confirma
problema atual, dono especifico, nivel de maturidade ou prazo existente.

## 9. Primeiro produto: prototipo visual navegavel

O primeiro incremento solicitado e **somente visual**. Deve usar dados
demonstrativos marcados `Exemplo`, sem alterar `public.clients`, tarefas,
desafios, prioridades, entregaveis ou pontuacao. Pode ler identidade e logo
dos setores existentes, com fallback visual se indisponivel. O acesso fica
dentro do Universo Ramos, preservando a navegacao atual.

Escopo navegavel de ponta a ponta:

- As 11 entradas principais e todas as fichas profundas acima, com links
  coerentes de ida e volta e pelo menos um exemplo por fluxo relevante.
- Cards/setores reais clicaveis; exemplos de Projetos, Treinamentos e Brindes
  mais completos para mostrar profundidade intersetorial.
- Filtros, busca, alternancia de ano/trimestre/mes, expandir, tabs, breadcrumbs,
  estados de disponibilidade, comparacao antes/depois e modais de proposta.
- Modais visuais para criar iniciativa, registrar bloqueio, relacionar
  evidencia, registrar decisao, adicionar meta e revisar checkpoint.
- Acoes de "salvar" no prototipo nao fazem escrita real; devem sinalizar
  `Previa visual` de modo claro, sem fingir persistencia.
- Estados vazios (`a diagnosticar`, `sem evidencias`, `sem bloqueios`), carga,
  erro e ausencia de permissao simulados para testar a experiencia.
- Desktop: tabelas compactas para comparar e gerir. Mobile: linhas empilhadas
  com os mesmos campos e comandos prioritarios, sem rolagem horizontal
  obrigatoria ou texto cortado.

**Criterio de aceite visual:** partir da Visao da Empresa, abrir um setor
real, entrar numa capacidade, ver lacuna e iniciativa, abrir seu bloqueio,
voltar ao roadmap, seguir a evidencia ate o registro de origem simulado e
retornar sem perder o contexto. Em outro fluxo, abrir uma meta anual,
inspecionar dois checkpoints e entender por que uma iniciativa esta prevista
para um mes mas ainda bloqueada. Nenhum clique deve alterar dados atuais.

## 10. Caminho posterior a maquete

1. **Descoberta PM-0:** entrevistar guardioes, escolher tres setores-piloto,
   mapear capacidades, evidencias e Marco Zero; validar glossario.
2. **Modelo aditivo:** desenhar IDs, relacionamentos, auditoria e permissoes;
   migrations somente em ambiente isolado, apos decisao de produto.
3. **Piloto real:** Ficha Mestre, capacidades, evidencias, iniciativas,
   dependencias, fila executavel e checkpoints dos pilotos.
4. **Governanca:** Direcao, triagem, experimentos, cobertura e recursos;
   integracao gradual com SISRAMOS e financeiro por referencias verificadas.
5. **Expansao:** demais setores, comparacao historica e recomendacoes
   explicaveis. IA sugere; pessoas validam.

Nenhuma dessas etapas e autorizacao para publicar ou executar SQL agora. A
politica de desenvolvimento e publicacao do repositorio continua valendo.

## 11. Decisoes em aberto para conversar com a equipe

1. Quais tres setores reais entram no piloto? Sugestao para contraste de
   fluxos: `SETOR DE PROJETOS`, `TREINAMENTOS` e `SUPRIMENTOS E COMPRAS`.
2. Quem e o guardiao de cada capacidade e quem valida sua maturidade?
3. Qual criterio minimo de prova por nivel e por tipo de capacidade?
4. Quais fontes de dados do SISRAMOS e financeiro podem ser apenas lidas?
5. Como registrar prazo legal versus janela desejada em cada iniciativa?
6. Qual cadencia de checkpoint e revisao e viavel para cada tipo de meta?
7. Quem faz a curadoria do historico e como tratar itens sem setor confiavel?
8. Qual e o limite do PAD e quais decisoes sao exclusivas da direcao?
9. Como proteger decisoes e avaliacoes se o acesso atual permanece sem login?
10. Quais criterios tornam a maquete visual aprovada para iniciar o piloto?

## 12. Nao objetivos desta primeira etapa

- Nao publicar uma plataforma paralela.
- Nao renomear ou duplicar setores existentes.
- Nao transformar todos os desafios ou tarefas antigos em iniciativas.
- Nao misturar Universo Ramos nos totais AC/AV por padrao.
- Nao criar pontuacao individual de maturidade nem misturar Tesouro com caixa.
- Nao afirmar que um setor esta maduro com base em dados demonstrativos.
- Nao prometer automacao ou previsao por IA antes de existir diagnostico.
- Nao aplicar migrations ou alterar a producao para construir a maquete.
