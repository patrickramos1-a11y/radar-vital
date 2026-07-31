# Registro de Decisoes Funcionais

As decisoes abaixo sao consideradas fechadas. Qualquer alteracao deve registrar
o motivo, a data e o impacto neste documento.

## D-001 - Tipos de cliente

O cadastro tera exatamente tres opcoes:

- Cliente AC;
- Cliente AV;
- Universo Ramos.

Dentro de Universo Ramos nao havera distincao obrigatoria entre setor, projeto,
departamento ou iniciativa. Todos usam a mesma natureza de cliente interno.

## D-002 - Isolamento do Universo Ramos

Universo Ramos:

- possui pagina propria;
- usa os mesmos recursos de tarefa, comentario, prioridade e entregavel;
- nao aparece por padrao no Painel AC/AV;
- nao entra nos totais AC/AV;
- nao aparece nas consultas gerais da Central sem selecao explicita;
- nao tera permissoes especificas nesta primeira etapa.

## D-003 - Novo cadastro

Havera um unico comando `Novo cliente`. O usuario escolhe AC, AV ou Universo
Ramos no formulario.

Municipio continua obrigatorio para AC/AV e sera opcional ou oculto para
Universo Ramos.

## D-004 - Visao Unificada

Tarefas, prioridades, entregaveis, auditorias e desafios aparecem juntos na
visao operacional do cliente.

Eles nao serao convertidos para uma unica tabela. A unificacao acontece por um
adaptador de consulta e apresentacao.

## D-005 - Auditorias

- Uma auditoria e uma campanha que abrange clientes AC ativos.
- Varias auditorias podem existir simultaneamente.
- Cada campanha cria um item individual por cliente.
- O painel permite selecionar uma auditoria e visualizar seus estados.
- Apenas Patrick valida e encerra auditorias.
- Auditorias vinculadas ao cliente aparecem na Visao Unificada.

## D-006 - Desafios

- Um desafio pode ter um ou varios participantes.
- Recompensa e penalidade sao configuradas antes da validacao.
- Cada participante recebe recompensa integral.
- Cada participante recebe penalidade integral.
- O vencimento apenas muda o desafio para `aguardando_validacao`.
- Apenas Patrick confirma sucesso ou insucesso.
- Penalidades podem deixar o colaborador com saldo negativo.

## D-007 - Avaliacoes e unidades

- Joinha e reconhecimento visual e vale zero ponto.
- Uma estrela comum vale uma estrela-base.
- A Super Estrela vale dez estrelas-base.
- A recompensa nao e dividida entre os participantes.

## D-008 - Tesouro

- O saldo oficial vem de um livro de transacoes imutavel.
- O Tesouro coletivo e a soma dos saldos individuais, inclusive negativos.
- Patrick pode conceder estrelas sem vinculo obrigatorio com entregavel.
- O credito inicial de 500 estrelas sera uma acao administrativa em lote.
- Zerar uma divida significa criar uma liquidacao, sem apagar o historico.
- Ajustes usam estorno e nova transacao.

## D-009 - Valor financeiro

As estrelas futuramente serao convertidas em reais, mas o valor de conversao
ainda nao foi definido.

O sistema deve armazenar a taxa utilizada em cada liquidacao. A taxa nao pode
ser codificada como constante definitiva.

## D-010 - Meta coletiva

A meta de 4.000 estrelas e contexto gerencial e nao e requisito obrigatorio da
primeira implementacao. Ela podera ser configurada futuramente como meta anual.

## D-011 - Performance

A Performance nao se limita a entregaveis. Ela deve permitir comparacao
separada e consolidada de:

- estrelas e Super Estrelas;
- joinhas;
- tarefas;
- comentarios;
- prioridades;
- entregaveis;
- desafios;
- auditorias;
- clientes vinculados;
- empresas atendidas;
- tempo medio e atrasos.

## D-012 - Governanca administrativa na versao atual

Patrick e o unico administrador autorizado a:

- validar e encerrar auditorias;
- resolver desafios;
- conceder ou remover estrelas manualmente;
- realizar liquidacoes;
- corrigir movimentacoes financeiras.

Nesta versao, o painel permanece com o fluxo atual de acesso, sem login
obrigatorio. Portanto, essa regra sera operacional e de interface, seguindo o
usuario selecionado no painel. Ela nao constitui uma fronteira de seguranca no
banco enquanto a autenticacao estiver adiada.

## D-013 - Publicacao unica

As fases do roadmap sao etapas internas de desenvolvimento. Nao havera uma
publicacao no Lovable ao final de cada fase.

Todo o pacote sera publicado uma unica vez, depois da validacao integrada das
Fases 0 a 7.

## D-014 - Ambiente isolado

Durante o desenvolvimento:

- o codigo fica em uma branch de integracao separada de `main`;
- o banco usa Supabase local ou projeto de teste;
- commits intermediarios podem ser enviados para a branch de integracao;
- o Supabase de producao permanece sem as novas migrations;
- o Lovable publicado permanece com a versao atual.

## D-015 - Ordem do lancamento final

No ciclo final:

1. gerar backup do banco de producao;
2. revisar o `dry-run` das migrations;
3. aplicar somente migrations compativeis com o acesso atual;
4. confirmar que a versao antiga continua funcional;
5. mesclar a branch de integracao em `main`;
6. confirmar a sincronizacao do Lovable;
7. publicar a atualizacao;
8. executar smoke tests operacionais.

O banco entra primeiro porque o novo frontend dependera das novas estruturas.
As migrations precisam manter compatibilidade temporaria com o frontend antigo.

## D-016 - Autenticacao adiada

O lancamento atual nao tera login, senha, link magico, convite por e-mail nem
cadastro de contas. O painel continuara com o mesmo acesso e seletor de usuario
existentes na versao publicada.

Os artefatos locais de Supabase Auth, `AuthGate`, pagina de login, convite por
e-mail e corte de RLS nao devem ser publicados nesta rodada. Eles permanecem
apenas como estudo tecnico e poderao ser retomados em um roadmap futuro.

## D-017 - Compatibilidade das migrations atuais

As migrations locais de fundacao, auditorias, desafios, Tesouro e Performance
foram inicialmente escritas assumindo `auth.users`, `auth.uid()` e politicas
RLS para usuarios autenticados. Antes do lancamento atual, elas devem ser
revisadas ou substituidas por migrations compativeis com o acesso vigente.

Nenhuma migration que exija login pode ser aplicada no banco de producao nesta
rodada sem nova decisao registrada.

## Decisoes pendentes

| ID | Tema | Momento limite |
| --- | --- | --- |
| P-001 | Valor em reais de uma estrela | Antes da primeira liquidacao |
| P-002 | Forma de pagamento e comprovante | Antes da primeira liquidacao |
| P-003 | Exibicao publica ou privada do valor em reais | Durante a Fase 5 |
| P-004 | Meta anual configuravel no produto | Depois da Fase 6 |
| P-005 | Supabase local ou projeto remoto de teste | Antes de concluir a Fase 0 |
