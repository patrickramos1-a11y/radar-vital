type Guidance = { performance: string; levels: [string, string, string]; review: string };

const performanceProofs: Record<string, string[]> = {
  T01: [
    "Escolha um documento da amostra, informe seu nome e pasta e registre quanto tempo levou para encontrá-lo.",
    "Mostre a versão vigente e onde as versões antigas ficaram identificadas ou arquivadas, sem circulação como final.",
    "Indique a convenção de nomes e compare duas pastas reais com esse padrão.",
    "Abra o controle do acervo e confira uma amostra de campos, responsáveis e datas de atualização.",
    "Mostre como o histórico ou backup permite recuperar um documento sem sobrescrever a versão anterior.",
  ],
  T02: [
    "Indique registros próprios e confira campos obrigatórios, cliente, responsável e prazo contra a fonte.",
    "Escolha demandas em estados distintos e compare o status no SISRAMOS com o andamento real.",
    "Indique uma divergência encontrada, responsável pela correção e registro da solução ou encaminhamento.",
    "Escolha um painel, explique o indicador e a ação que ele pede com base nos registros exibidos.",
    "Relacione uma decisão tomada com os dados do sistema, sem depender de planilha paralela para confirmar.",
  ],
  T03: [
    "Compare prazo planejado e data real; se houve desvio, mostre o aviso enviado antes do vencimento.",
    "Apresente o checklist de uma entrega e marque como cada etapa foi concluída ou replanejada.",
    "Mostre agenda de uma semana e explique como a carga foi ajustada à capacidade disponível.",
    "Indique a mudança de data, pessoas impactadas e registro da comunicação.",
  ],
  T04: [
    "Indique prazos da carteira, ação tomada e comprovante anterior ao vencimento.",
    "Mostre um alerta enviado ao cliente, com data e antecedência em relação ao marco.",
    "Registre um risco identificado, quando foi escalado e a decisão tomada antes do atraso.",
    "Compare duas demandas e explique a ordem escolhida pelo risco de vencimento e impacto.",
  ],
  T05: [
    "Indique uma mensagem real e o retorno do destinatário que confirme entendimento sem retrabalho.",
    "Apresente ata datada com decisão, ação, responsável e prazo de uma reunião conduzida.",
    "Mostre a versão final revisada e correções relevantes feitas antes do envio.",
    "Compare público e objetivo de duas comunicações e explique a linguagem adotada.",
    "Aponte onde o acordo ficou registrado e como outra pessoa pode recuperá-lo.",
  ],
  T06: [
    "Mostre atualização enviada antes de cobrança do cliente e o andamento informado.",
    "Compare mensagem ao cliente com escopo contratado, prazo possível e aceite do alinhamento.",
    "Indique pedido fora do escopo e seu encaminhamento para decisão comercial, sem execução informal.",
    "Registre reclamação, responsável, resposta e confirmação de resolução.",
    "Use o histórico de uma carteira para verificar se o mesmo assunto precisou ser cobrado novamente.",
  ],
  T07: [
    "Mostre entrega recebida por outro setor e eventual devolução, com o motivo tratado.",
    "Indique pedido enviado e confira se contém contexto, insumos, prazo e critério de aceite.",
    "Percorra uma etapa entre setores e identifique quem era dono antes e depois da passagem.",
    "Apresente registro datado da passagem e confirmação de recebimento.",
  ],
  T08: [
    "Descreva um caso com data, fonte e fatos observados, separando hipóteses.",
    "Mostre a investigação da causa antes da solução escolhida.",
    "Compare alternativas e registre por que a decisão adotada era adequada.",
    "Mostre verificação posterior e se a falha voltou a ocorrer.",
    "Indique escalonamento com diagnóstico, impacto e recomendação objetiva.",
  ],
  T09: [
    "Compare uma entrega com o checklist do padrão vigente e registre desvios corrigidos.",
    "Indique ocorrências repetidas que justificaram a melhoria, com datas ou quantidade.",
    "Peça a outra pessoa que execute um passo pelo POP ou modelo e registre dúvidas encontradas.",
    "Mostre versão divulgada, pessoas informadas e uma entrega que já use o novo padrão.",
  ],
  T10: [
    "Compare o nível inicial e o atual de uma pessoa acompanhada com critérios e datas.",
    "Indique feedbacks específicos, data, ação combinada e acompanhamento posterior.",
    "Nomeie uma responsabilidade crítica e quem consegue assumi-la durante a ausência do titular.",
    "Mostre decisão de avaliação ligada a trabalho observado, não apenas à presença em treinamento.",
  ],
  F01: [
    "Escolha demandas recentes e confira setor, responsável e prazo em cada registro.",
    "Compare entrada e triagem de uma amostra com o tempo definido para classificação.",
    "Conte classificações refeitas na amostra e explique os principais motivos.",
    "Indique demandas sem movimentação e a ação para destravar cada uma.",
    "Registre um tipo de atrito recorrente e quem recebeu o encaminhamento.",
  ],
  F02: [
    "Indique processo e fundamento que determinou a modalidade escolhida.",
    "Compare checklist e protocolo final; registre exigências e se eram evitáveis.",
    "Mostre datas de consulta ao andamento e providências decorrentes.",
    "Indique validade, prazo de renovação e protocolo anterior ao vencimento.",
    "Mostre atualização de status enviada ao cliente, com data e próximo passo.",
  ],
  F03: [
    "Compare uma operação na plataforma com os dados de origem e o comprovante emitido.",
    "Mostre controle de validade do acesso e certificado, sem compartilhar credenciais.",
    "Aponte onde o protocolo ou recibo de cada operação ficou arquivado.",
    "Indique uma checagem que evitou pendência operacional ou como uma falha foi corrigida.",
  ],
  F04: [
    "Compare a matriz de obrigações com todas as condicionantes da licença ou outorga escolhida.",
    "Indique obrigação, vencimento, alerta e ação registrada antes da data.",
    "Mostre protocolo e pasta de arquivamento da comprovação enviada.",
    "Mostre a comunicação ao cliente sobre a obrigação que depende dele e o aceite do encaminhamento.",
  ],
  F05: [
    "Mostre documento final e checklist de nome, assinatura, modelo e informações obrigatórias.",
    "Compare validade da certidão com a data efetiva do protocolo.",
    "Indique prazo de publicação, comprovante e data de veiculação.",
    "Compare relação de documentos protocolados com exigências posteriores do órgão.",
  ],
  F06: [
    "Mostre pauta e objetivo definidos antes do contato com o órgão.",
    "Indique data, interlocutor, tema e resumo arquivado de cada interação.",
    "Relacione a resposta recebida à providência que fez o processo avançar.",
    "Mostre comunicação ou ata revisada com linguagem e limites adequados à representação institucional.",
  ],
  F07: [
    "Compare o índice do produto com os itens exigidos no termo de referência.",
    "Aponte dados de origem e mostre como diagnóstico, conclusão e medida se conectam.",
    "Indique norma ou ato aplicável e o trecho do produto em que foi corretamente usado.",
    "Mostre checklist do padrão Ramos e versão final entregue.",
    "Compare comentários da revisão com a versão aprovada e identifique correções estruturais.",
    "Indique despacho ou aceite do órgão e eventual exigência técnica recebida.",
  ],
  F08: [
    "Escolha uma revisão real e mostre checklist, versão corrigida e decisão de liberação.",
    "Aponte uma inconsistência relevante e onde ela foi identificada antes da emissão.",
    "Indique documento retido por incompletude e o requisito que faltava.",
    "Mostre comentário de revisão que permita ao autor localizar e corrigir a falha.",
    "Compare a versão revisada com o padrão documental vigente.",
    "Indique alteração de conteúdo técnico e a justificativa aceita pelo autor ou responsável.",
    "Mostre erro recorrente e uma ação de revisão que reduziu sua repetição.",
  ],
  F09: [
    "Indique insumos listados antes da produção e verifique se faltou algum previsível.",
    "Compare o escopo técnico planejado com o contrato e mudanças formalizadas.",
    "Mostre solicitação de levantamento com local, método, dados esperados e prazo.",
    "Indique definição da ART e data anterior ao começo da produção técnica.",
  ],
  F10: [
    "Compare objetivo da visita com o que foi coletado e registre se houve retorno evitável.",
    "Mostre checklist preenchido antes, durante e após a ida a campo.",
    "Indique orientação de segurança aplicada e ocorrência registrada, se houve.",
    "Mostre registro de comunicação e postura perante o cliente durante a visita.",
  ],
  F11: [
    "Indique pacote entregue e confirmação de aceite sem pedido de complemento.",
    "Abra uma amostra de fotos e confirme local e data identificados.",
    "Mostre autor, horário, localização e arquivo de origem de um dado coletado.",
    "Compare medição registrada com unidade, método e conferência de plausibilidade.",
  ],
  F12: [
    "Indique sistema de referência da base e do produto final e como foram compatibilizados.",
    "Mostre área ou distância calculada e conferência por fonte ou método independente.",
    "Confira escala, legenda, norte, fonte, data e identificação em um mapa entregue.",
    "Indique aceite ou retorno do órgão sobre o produto cartográfico.",
  ],
  F13: [
    "Mostre briefing com escopo, produto esperado, prazo e critério de aceite enviados ao terceiro.",
    "Indique revisão técnica e aceite do produto antes da incorporação à entrega Ramos.",
    "Compare prazo combinado e realizado; registre aviso e novo acordo se houve desvio.",
    "Mostre avaliação datada de fornecedor baseada em qualidade, prazo e comunicação.",
  ],
  E01: [
    "Aponte premissas, fórmulas, unidades e conferência do dimensionamento no memorial.",
    "Indique normas aplicáveis e onde cada requisito foi atendido no projeto.",
    "Mostre despacho de aprovação e exigências técnicas, se existirem.",
    "Relacione solução projetada com espaço, operação e manutenção disponíveis ao cliente.",
  ],
  E02: [
    "Indique tipo de uso e fundamento da modalidade de outorga ou dispensa.",
    "Compare vazão declarada, medições e necessidade efetiva do empreendimento.",
    "Mostre ato de concessão e exigência técnica recebida ou sua ausência.",
    "Indique calendário e comprovantes das declarações hídricas devidas.",
  ],
  E03: [
    "Confira uma cota da prancha contra levantamento, cálculo ou medida de origem.",
    "Mostre carimbo, escala, revisão, assinatura e demais campos exigidos.",
    "Abra a prancha em escala de leitura e confira rótulos, linhas e hierarquia gráfica.",
    "Compare simbologia, layers e apresentação com o padrão Ramos vigente.",
  ],
  E04: [
    "Indique recibo ou aceite do CAR e como pendências foram encerradas.",
    "Compare titularidade, área e perímetro do documento com o mapa utilizado.",
    "Mostre consultas de andamento, resposta a exigências e decisão final.",
  ],
  E05: [
    "Relacione os parâmetros escolhidos ao objetivo e à exigência legal da campanha.",
    "Indique laboratório, escopo de acreditação e laudos utilizados, sem expor dados sensíveis.",
    "Compare resultado, unidade, método e limite aplicável e registre interpretação.",
    "Mostre aviso de não conformidade ao cliente e à equipe, com data e ação proposta.",
  ],
};

// The source spreadsheet remains authoritative. These prompts explain how to
// demonstrate and verify each source criterion without changing its stable ID.
export const criterionGuidance: Record<string, Guidance> = {
  T01: {
    performance: "Indique o acervo sob sua guarda e uma amostra de documentos com nome, pasta, versão vigente e registro de conferência. Mostre como localiza um item e como evita duplicidade ou perda.",
    levels: ["Nomeie os 2 acervos, descreva a organização aplicada e indique onde está a conferência de cada um.", "Indique a lista dos 10 documentos sorteados, a versão encontrada e o registro do teste prático de localização.", "Indique o acervo auditado de outra pessoa, o relatório de achados, o treinamento com participantes e a melhoria implantada com resultado observado."],
    review: "Confirme acesso aos itens citados, versões corretas, rastreabilidade da conferência e ausência de desvios relevantes.",
  },
  T02: {
    performance: "Informe os registros ou painel do SISRAMOS usados, a data da conferência e uma divergência identificada ou descartada. Mostre a correção e a decisão apoiada nesses dados.",
    levels: ["Indique os 20 registros próprios e a conferência de campos, status e responsável; identifique eventuais erros corrigidos.", "Indique a carteira auditada, a lista de inconsistências e correções e uma leitura do painel com a ação recomendada.", "Indique participantes e material do treinamento, escopo da auditoria geral e a regra ou melhoria aprovada com sua aplicação."],
    review: "Compare a amostra com os registros originais; verifique status reais, correções e utilidade do painel para decidir.",
  },
  T03: {
    performance: "Mostre uma agenda real com etapas, responsáveis e prazos, além do registro de conclusão ou aviso antecipado de desvio e replanejamento comunicado.",
    levels: ["Indique as 4 semanas de agenda ou checklist e a conferência feita com o acompanhamento.", "Indique os 2 meses planejados, cálculo da aderência de pelo menos 80% e avisos dos desvios antes do prazo.", "Indique a programação de equipe do mês, ajustes comunicados e orientação documentada aos colegas."],
    review: "Confira datas planejadas versus realizadas, etapas omitidas, capacidade de execução e comunicação dos desvios.",
  },
  T04: {
    performance: "Apresente o controle de prazos da carteira com marco legal, responsável, alerta e ação tomada. Para risco, mostre quando e a quem foi escalado.",
    levels: ["Indique a carteira conferida e um exemplo de contagem de prazo sem erro.", "Indique o controle de 3 meses sem perda de prazo e um caso de contagem legal com marco inicial e vencimento.", "Indique as carteiras auditadas, o treinamento realizado e um caso crítico tratado antes do vencimento."],
    review: "Recalcule ao menos um prazo e confirme alertas, evidência da ação e escalonamento anterior ao vencimento.",
  },
  T05: {
    performance: "Indique a comunicação ou ata, público, objetivo, data e encaminhamentos. Mostre que o destinatário recebeu uma mensagem clara e que o combinado ficou localizável.",
    levels: ["Indique 5 comunicações reais revisadas e o aceite sem retrabalho.", "Indique 10 e-mails, atas ou relatórios e as atas de 2 reuniões conduzidas, com decisões e responsáveis.", "Indique um caso sensível conduzido, os modelos produzidos e o treinamento com participantes e aplicação."],
    review: "Leia a amostra como destinatário: clareza, correção, tom, decisão e registro recuperável devem estar presentes.",
  },
  T06: {
    performance: "Indique cliente, período e histórico dos contatos. Relacione atualização proativa, escopo combinado, reclamação tratada e retorno do cliente quando aplicável.",
    levels: ["Indique um mês de contatos com data, assunto, encaminhamento e conferência.", "Indique 3 meses de carteira e 2 alinhamentos de escopo, verificando se houve cobranças repetidas.", "Indique o caso crítico, a orientação dada aos atendentes e o retorno registrado dos clientes."],
    review: "Confronte histórico e escopo contratado; verifique antecedência, tratamento das reclamações e encerramento do contato.",
  },
  T07: {
    performance: "Apresente uma passagem entre setores com pedido, insumos, responsável receptor, data, aceite e eventual devolução resolvida.",
    levels: ["Indique 5 passagens conferidas com receptor e confirmação de recebimento.", "Indique 10 passagens reais e uma cadeia entre setores, registrando devoluções e a causa delas.", "Indique a interface implantada, os responsáveis de cada etapa e um conflito de fronteira resolvido e comunicado."],
    review: "Confirme que o setor seguinte recebeu tudo para começar e que nenhuma etapa ficou sem responsável.",
  },
  T08: {
    performance: "Registre problema, fatos observados, causa provável, alternativa escolhida, responsável e verificação posterior para mostrar se houve reincidência.",
    levels: ["Indique 2 relatos com fatos, impacto e encaminhamento, sem confundir hipótese com causa.", "Indique 3 análises reais com causa, decisão, execução e resultado verificado.", "Indique a análise conduzida com a equipe, a solução padronizada e a verificação de adoção."],
    review: "Distinga fato de opinião e confira se a solução ataca a causa e teve resultado observado.",
  },
  T09: {
    performance: "Mostre o padrão aplicável, a entrega conferida ou a falha recorrente que motivou mudança, e como a nova versão foi comunicada e usada.",
    levels: ["Indique 3 entregas e o checklist de conformidade ao padrão vigente.", "Indique 2 melhorias justificadas por recorrência e um modelo ou POP atualizado com versão.", "Indique método ou biblioteca implantado, pessoas orientadas e amostra que comprove adoção."],
    review: "Verifique versão, motivo da mudança e uso por outras pessoas, não apenas a criação do documento.",
  },
  T10: {
    performance: "Indique pessoa acompanhada, objetivo de aprendizagem, feedback datado, evolução observável e quem cobre a responsabilidade crítica na ausência dela.",
    levels: ["Indique a formação de que participou, conteúdo e aplicação prática observada.", "Indique a pessoa supervisionada por 3 meses, feedbacks e evolução registrada contra critérios claros.", "Indique 2 pessoas que evoluíram de nível, material usado e avaliação conduzida com evidências."],
    review: "Confirme período, feedback específico e evolução comprovada; não trate presença em treinamento como certificação.",
  },
  F01: {
    performance: "Use uma amostra de demandas com entrada, classificação, setor, responsável, prazo e movimentações. Explique reclassificações e pendências paradas.",
    levels: ["Indique 2 semanas de triagem e a conta da taxa de erro, limitada a 10%.", "Indique um mês de distribuição, reclassificações e auditoria das pendências sem dono ou paradas.", "Indique 3 meses de fluxo, regra de distribuição implantada e relatório dos gargalos tratados."],
    review: "Compare classificação e destino com as demandas originais; confira tempos, reclassificações e tratamento do backlog.",
  },
  F02: {
    performance: "Indique processo, modalidade, checklist documental, protocolo, andamento e decisão. Mostre o alerta de renovação e a atualização enviada ao cliente.",
    levels: ["Indique 3 processos montados e o registro de conferência documental.", "Indique 3 modalidades diferentes do protocolo à decisão e verifique exigências por falha evitável.", "Indique plano de caso complexo, revisão de processos de colegas e roteiro regulatório usado pela equipe."],
    review: "Confira modalidade, completude do protocolo, acompanhamento, prazos e comunicação do resultado.",
  },
  F03: {
    performance: "Indique plataforma, operação, dado lançado, comprovante e validade do acesso ou certificado, omitindo credenciais sensíveis.",
    levels: ["Indique 5 operações conferidas com seus protocolos ou recibos.", "Indique operações em 4 plataformas e controle de acessos válidos de uma carteira, sem expor senhas.", "Indique roteiros criados por plataforma e treinamento com teste de execução pelos participantes."],
    review: "Compare lançamento com fonte e recibo; confirme validade de acesso sem exigir senha ou certificado privado.",
  },
  F04: {
    performance: "Indique licença ou outorga, obrigação extraída, prazo, responsável, protocolo e aviso ao cliente. Mostre como omissões foram conferidas.",
    levels: ["Indique calendário completo de um cliente conferido contra a licença.", "Indique obrigações de 3 instrumentos e controle de 3 meses sem vencimento perdido.", "Indique carteiras auditadas, matriz de obrigações criada e treinamento de uso."],
    review: "Confronte cada obrigação com a condicionante original e confira comprovante e prazo.",
  },
  F05: {
    performance: "Indique documento, modelo vigente, validade de certidões, data do protocolo e exigências recebidas ou descartadas.",
    levels: ["Indique 5 documentos aprovados e a conferência formal de cada um.", "Indique 3 processos montados e resposta do órgão sem exigência documental evitável.", "Indique modelos versionados, revisão de documentos de colegas e treinamento aplicado."],
    review: "Confira data de validade, assinatura, versão, publicação e retorno do órgão.",
  },
  F06: {
    performance: "Indique órgão, pauta, objetivo, data, interlocutor, registro do contato e encaminhamento que destravou ou esclareceu o processo.",
    levels: ["Indique 3 interações acompanhadas e notas de cada contato.", "Indique 3 interações conduzidas com preparação, registro e resultado obtido.", "Indique caso sensível, decisão registrada e orientação dada a colegas."],
    review: "Confira objetivo prévio, registro fiel, postura institucional e efeito concreto no processo.",
  },
  F07: {
    performance: "Indique produto, termo de referência, base de dados, conclusão, fundamento legal e revisão. Mostre a ligação entre diagnóstico e medidas propostas.",
    levels: ["Indique 2 documentos produzidos e comentários da revisão incorporados.", "Indique 3 tipos de produto aprovados sem correção estrutural, incluindo 1 aceite do órgão.", "Indique estudo complexo, orientação a produtores e melhoria de modelo adotada."],
    review: "Leia fonte, método, conclusão e exigências do órgão; confira coerência técnica e aceite real.",
  },
  F08: {
    performance: "Indique documento revisado, checklist, falhas detectadas, correções solicitadas e versão final. Separe alterações técnicas justificadas de ajustes formais.",
    levels: ["Indique 3 revisões com checklist e validação do revisor responsável.", "Indique 5 entregas reais de complexidades diferentes e a checagem de falhas críticas antes da liberação.", "Indique revisão crítica, evolução de um novo revisor e ajuste implantado no padrão de qualidade."],
    review: "Compare versão antes/depois e confira se falhas relevantes foram identificadas sem alterar conteúdo sem justificativa.",
  },
  F09: {
    performance: "Indique escopo contratado, insumos necessários, pedido de levantamento, responsáveis, marcos e definição da ART antes da produção.",
    levels: ["Indique 2 planos técnicos validados com lista de insumos e responsáveis.", "Indique 3 planos executados e demonstre que a produção não parou por insumo previsível.", "Indique plano de produto complexo e checklists-padrão testados em uso."],
    review: "Confira se contrato, insumos, levantamento e ART estavam resolvidos antes do início.",
  },
  F10: {
    performance: "Indique visita, objetivo, logística, checklist, segurança, dados coletados e eventual necessidade de retorno a campo.",
    levels: ["Indique 3 visitas acompanhadas com checklist e orientação recebida.", "Indique 5 visitas autônomas sem retorno por falha e avaliação do setor solicitante.", "Indique checklists criados, programação de campo e formação prática de colega."],
    review: "Compare planejamento e resultado; confirme segurança e ausência de retorno por falha evitável.",
  },
  F11: {
    performance: "Indique pacote de campo com fotos datadas e localizadas, autor, medidas, arquivos de origem e aceite do setor que recebeu.",
    levels: ["Indique 3 pacotes conferidos e correções realizadas antes da entrega.", "Indique 5 pacotes aceitos sem devolução, com dados rastreáveis.", "Indique padrão de pacote, auditoria de uma amostra e treinamento para quem produz os registros."],
    review: "Abra amostra de fotos e dados; confira local, data, autoria, consistência e aceite.",
  },
  F12: {
    performance: "Indique produto cartográfico, dados de origem, sistema de referência, cálculos de área/distância, elementos do mapa e aceite.",
    levels: ["Indique 3 mapas conferidos, com sistema de referência e elementos obrigatórios.", "Indique 5 produtos aprovados, incluindo análise espacial com método e resultado.", "Indique padrão cartográfico implantado e revisão documentada de produtos de colegas."],
    review: "Reproduza uma medida ou confira metadados; verifique legibilidade e exigência do órgão.",
  },
  F13: {
    performance: "Indique escopo enviado ao terceiro, critérios de escolha, prazo, produto recebido, validação técnica e avaliação do fornecedor.",
    levels: ["Indique 2 cotações comparadas contra escopo e critérios.", "Indique 3 contratações até o aceite do produto, com desvios de prazo tratados.", "Indique critérios de seleção publicados e revisão da carteira de fornecedores."],
    review: "Confira escopo, comparação, validação antes de uso e registro do desempenho do terceiro.",
  },
  E01: {
    performance: "Indique projeto, memorial de cálculo, norma aplicada, premissas de dimensionamento, retorno do órgão e condição de operação pelo cliente.",
    levels: ["Indique 2 dimensionamentos revisados e correções das premissas ou cálculos.", "Indique 2 projetos aprovados pelo órgão, com versões e despachos.", "Indique projeto complexo, revisão de projetos de colegas e planilha-padrão validada."],
    review: "Rastreie premissa até cálculo e prancha; confirme norma, aprovação e operabilidade.",
  },
  E02: {
    performance: "Indique uso hídrico, modalidade, balanço de vazões, dados da demanda, protocolo e situação de outorga ou dispensa.",
    levels: ["Indique 2 processos revisados e como vazão e modalidade foram conferidas.", "Indique 3 autorizações ou dispensas de tipos distintos e seus atos de concessão.", "Indique caso complexo e revisão documentada de processos de colegas."],
    review: "Compare dados e vazões com a fonte; confirme modalidade, validade e ato emitido.",
  },
  E03: {
    performance: "Indique prancha, base de medidas, revisão dimensional, carimbo, escala, legibilidade e versão do padrão gráfico aplicada.",
    levels: ["Indique 3 pranchas conferidas com checklist dimensional e formal.", "Indique 5 pranchas aprovadas sem correção dimensional e seus retornos de revisão.", "Indique biblioteca ou padrão gráfico adotado e revisão de pranchas de colegas."],
    review: "Confira uma medida com a fonte e verifique escala, carimbo, leitura e padrão.",
  },
  E04: {
    performance: "Indique imóvel, documentação dominial, mapa, cadastro CAR, exigências e acompanhamento até o aceite, sem expor dados pessoais desnecessários.",
    levels: ["Indique 2 CAR revisados e divergências documentais ou cartográficas tratadas.", "Indique 3 CAR ou retificações aceitos e a caracterização de um imóvel.", "Indique caso complexo e revisão de cadastros de colegas com resultado."],
    review: "Compare documentação, perímetro e ato de aceite; confira se pendências foram encerradas.",
  },
  E05: {
    performance: "Indique campanha, parâmetro, matriz, laboratório, laudo, limite aplicado, interpretação e comunicação de não conformidade.",
    levels: ["Indique 2 campanhas organizadas com plano de coleta e laudos.", "Indique 3 campanhas de matrizes distintas com interpretação dos resultados.", "Indique programa de monitoramento desenhado e revisão de campanhas de colegas."],
    review: "Confira acreditação, cadeia de dados, limite correto e aviso tempestivo de não conformidade.",
  },
};

export function guidanceFor(code: string, kind: "performance" | "evidence", level: number, index = 0) {
  const guidance = criterionGuidance[code];
  if (!guidance) return undefined;
  return { submitter: kind === "performance" ? performanceProofs[code]?.[index] ?? guidance.performance : guidance.levels[level - 1], reviewer: guidance.review };
}

export function performanceGuidanceCount(code: string): number {
  return performanceProofs[code]?.length ?? 0;
}

export function criterionPrompt(text: string): string {
  return `Consigo explicar, com uma situação real, como realizo este resultado?`;
}

export function criterionResponsePrompt(kind: "performance" | "evidence"): string {
  return kind === "performance"
    ? "Descreva o contexto, o que você fez, como conferiu o resultado e uma referência que permita verificá-lo."
    : "Descreva a evidência, onde ela está e como ela demonstra sua prática neste nível.";
}
