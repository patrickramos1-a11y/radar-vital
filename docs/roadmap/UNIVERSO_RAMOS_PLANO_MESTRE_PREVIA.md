# Plano Mestre: prévia organizacional navegável

> Documento histórico da fase visual. A publicação inicial com persistência
> compartilhada está descrita em `UNIVERSO_RAMOS_PLANO_MESTRE_PUBLICACAO.md`.

Estado: prévia de interface com leitura dos registros atuais do Universo Ramos.
Não executa SQL, não cria ou altera registros no Supabase, não migra desafios e
não é uma publicação de produção.

## Acesso

- Universo Ramos -> Plano Mestre (prévia).
- Rota direta: `/universo-ramos/plano-mestre`.
- `view`, `id` e, nas abas do setor, `tab` ficam na URL para permitir abrir
  fichas diretamente e usar voltar/avançar do navegador.
- O projeto pode rodar com Vite. Se o binding SWC não estiver disponível no
  ambiente local, `vite.codex.config.mjs` usa esbuild para a prévia.

## Organização das páginas

1. **Visão geral:** núcleos propostos, setores e colaboradores reais, volumes
   de origem e início do mapeamento.
2. **Núcleos:** Núcleo Técnico, Suporte e Administrativo sobre os setores
   existentes. A associação pode ser alterada na sessão, sem persistência.
3. **Setores:** registros atuais; cada setor tem abas de Visão geral,
   Responsabilidades, Capacidades, Solicitações, Pessoas e Histórico.
4. **Responsabilidades:** começa vazio; novas responsabilidades são simuladas
   setor a setor, com capacidades, titular e substituto a definir.
5. **Banco de capacidades:** começa vazio; o usuário cadastra as capacidades
   que deseja mapear e depois as vincula às responsabilidades.
6. **Capacitações:** descoberta de capacidades e responsabilidades, com pedidos
   simulados de capacitação e de assunção de responsabilidade.
7. **Solicitações:** desafios setoriais lidos como futuras solicitações, em
   Kanban ou lista. A ficha permite simular planejamento, responsável,
   prioridade, peso, orçamento, dependência, subtarefas, comentário e referência
   de anexo.
8. **Cronologia:** prazos cadastrados e meses de tratamento simulados, sem
   confundir data planejada com prontidão para executar.
9. **Minha jornada:** tarefas atribuídas, pedidos simulados e oportunidades de
   um colaborador selecionado. A seleção não muda o usuário do Radar Vital.
10. **Cobertura e sucessão:** responsabilidades sem titular ou substituto na
    prévia, capacidades sem habilitação confirmada e simulação de saída de uma
    pessoa. Não há transferência automática para Patrick.

Fichas de núcleo, setor, responsabilidade, capacidade, pessoa e solicitação
permitem navegar pelo caminho completo. O setor mantém suas tarefas e
comentários na aba Histórico.

## Navegação e apresentação

- O menu separa Organização, Trabalho e Pessoas, sem dar o mesmo peso visual
  a todas as páginas.
- Toda ficha tem Voltar e uma trilha clicável. Trocar abas dentro do setor não
  acrescenta uma etapa artificial à trilha.
- A página inicial apresenta os núcleos como mapa de setores e mostra as
  pessoas ativas. O setor exibe três camadas conectadas: capacidades,
  responsabilidades e solicitações, com ações para iniciar o mapeamento.
- As fichas de responsabilidade e capacidade mostram o percurso relacionado
  antes dos detalhes. Cores distinguem cada tipo de informação, não seu
  estado de aprovação.
- A explicação de proveniência fica no botão de informações do cabeçalho, em
  vez de repetir uma legenda em todas as páginas.

## Proveniência

`src/features/master-plan-preview/data.ts` lê `clients` do tipo
`UNIVERSO_RAMOS`, `challenges`, `tasks`, `client_comments` não arquivados e
colaboradores ativos. A interface sempre diferencia:

- **Cadastrado:** registro que veio das tabelas atuais;
- **Proposta visual:** agrupamento inicial dos setores em núcleos, sujeito a
  revisão humana;
- **Simulação local:** criada ou ajustada na memória desta sessão;
- **A definir:** não há vínculo ou avaliação formal.

O ponto de partida tem **zero capacidades, zero responsabilidades e zero
pedidos de capacitação**. Desafios existentes não geram esses registros por
inferência. Setores, colaboradores, desafios, tarefas e comentários continuam
disponíveis. Não se infere titularidade, certificação, dependência ou
maturidade a partir de tarefa atribuída. Os desafios mantêm seus IDs e status
de origem; não foram convertidos nem duplicados. Sem responsabilidade
vinculada, a solicitação fica "A classificar".

A associação inicial entre núcleos e setores é uma proposta revisável.
`BRINDES` e `IA E AUTOMAÇÃO` permanecem com núcleo a definir. A divisão não
cria setores paralelos aos 11 setores atuais.

## Limites antes da integração

- Os formulários e seletores da prévia não gravam no banco nem em
  `localStorage`; seu estado se perde ao recarregar a página.
- O cadastro permanente de capacidades e responsabilidades é uma etapa
  posterior. Esta mudança não exclui registros existentes do Supabase.
- A prévia não implementa permissões, certificação, aprovação, upload de
  anexos, orçamento oficial ou regra de elegibilidade de líder de núcleo.
- O percentual necessário para liderar um núcleo pode ser simulado, mas não
  possui valor oficial nem pessoas certificadas para o cálculo.
- A conclusão de solicitações mede trabalho executado. Maturidade do setor
  depende também de capacidades comprovadas, autonomia e cobertura.
- Os comentários existentes permanecem vinculados ao setor, não são
  automaticamente associados a uma solicitação específica.

## Próximas decisões

1. Confirmar a composição dos núcleos, especialmente `BRINDES` e
   `IA E AUTOMAÇÃO`.
2. Validar nomes, granularidade e capacidades de cada responsabilidade.
3. Definir critérios de habilitação, substituição e liderança de núcleo.
4. Curar a relação de cada desafio com uma ou mais responsabilidades.
5. Projetar escrita, autorização, auditoria e migração aditiva em ambiente
   isolado. Nenhum desses passos faz parte desta prévia.

As demais especificações históricas do Plano Mestre foram anteriores à
estrutura organizacional acima; divergências devem ser resolvidas antes de
criar SQL.
