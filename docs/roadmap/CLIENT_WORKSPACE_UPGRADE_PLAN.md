# Upgrade da Central do Cliente

## Objetivo

Transformar a Central do Cliente em um espaco operacional conectado, mantendo
os dominios atuais e adicionando contexto, hierarquia e continuidade ao trabalho.

## Etapa 1 - Fundacao operacional

- ampliar tarefas com descricao e status operacional;
- diferenciar urgencia, demanda prioritaria e cliente em atencao;
- permitir uma camada de subtarefas;
- registrar a origem de tarefas criadas a partir de comentarios;
- preservar compatibilidade com o campo legado `completed`.

## Etapa 2 - Execucao diaria

- abrir detalhes da tarefa em painel lateral;
- editar status, responsaveis, prazo, urgencia e recorrencia;
- criar, concluir e acompanhar subtarefas;
- exibir o progresso agregado sem inflar a contagem de tarefas principais.

## Etapa 3 - Contexto do cliente

- incluir comentarios no resumo do cliente;
- converter comentario em tarefa com vinculo de origem;
- apresentar proxima acao, atrasos, bloqueios e itens sem responsavel;
- reunir tarefas, comentarios e prioridades em uma linha do tempo.

## Etapa 4 - Escala e automacao

- permitir dependencias entre tarefas;
- fornecer modelos reutilizaveis com subtarefas predefinidas;
- criar recorrencia semanal e mensal;
- gerar a proxima ocorrencia ao concluir uma tarefa recorrente.

## Criterios de aceite

1. Registros antigos continuam legiveis e editaveis.
2. Uma tarefa principal aceita subtarefas com responsavel e prazo proprios.
3. Comentarios podem originar tarefas rastreaveis.
4. O resumo do cliente evidencia a proxima acao e os principais riscos.
5. Dependencias, modelos e recorrencia funcionam sem duplicar registros.
6. Build, testes e verificacao visual passam antes da publicacao unica.
