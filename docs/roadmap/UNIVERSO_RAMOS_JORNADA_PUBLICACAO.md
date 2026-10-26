# Biblioteca e jornada de capacitacao: ativacao

## O que foi preparado

- Biblioteca com as 28 capacidades, 56 responsabilidades e 262 criterios extraidos da planilha curada. O SHA-256 identifica a fonte.
- Os setores mencionados na planilha sao apenas contexto de origem. Nenhum vinculo com os 11 setores atuais e afirmado automaticamente.
- Autoavaliacoes sucessivas, com quatro respostas, comentario, historico e nivel indicado pela menor resposta. Autoavaliacao nao certifica.
- Pedido de nivel Assistido, Autonomo ou Multiplicador com criterios cumulativos, justificativa e referencia textual de evidencia; rascunho e pedido de ajustes.
- Fila administrativa com aceite por criterio, justificativa de ajuste e decisao final. Eventos de envio e decisao ficam registrados.
- A interface usa o perfil ja selecionado no Radar Vital (`collaborators.id`). O papel `admin` desse cadastro habilita a fila administrativa; os demais perfis usam a visao do colaborador.
- Anexos nao sao enviados nem armazenados nesta etapa. Uma referencia textual deve apontar para evidencia ja existente em local apropriado.

## Limite de identidade e privacidade

O seletor atual de colaboradores guarda o nome escolhido no navegador; qualquer pessoa que acesse o aplicativo pode trocar de perfil. **Ele nao comprova identidade nem oferece autorizacao confiavel.** A migracao usa o papel `admin` para organizar a interface e validar o identificador informado a funcao SQL, mas um cliente externo pode informar o UUID de um administrador. Assim, neste modelo:

- uma avaliacao ou aprovacao nao pode ser tratada como certificacao auditavel da pessoa indicada;
- a leitura das respostas, justificativas e avaliacoes e concedida a chave publica do aplicativo para permitir a jornada sem login; nao registrar dados pessoais sensiveis, documentos ou informacoes sigilosas;
- a filtragem por colaborador na interface melhora a experiencia, **nao** restringe acesso ao banco;
- nao ativar anexos privados ou alegar privacidade individual ate existir identidade verificavel e RLS por pessoa.

O fluxo e adequado apenas a um ambiente de confianca operacional em que esse risco seja aceito conscientemente. Para certificacao formal ou dados sensiveis, a proxima etapa precisa de autenticacao individual e politicas de acesso correspondentes. Nao ha como obter essa garantia somente com o seletor atual.

## SQL no projeto `ixiffabjunvpoizdhwtk`

Esta sessao nao tem acesso de DDL ao projeto. **As migracoes abaixo ainda nao foram aplicadas por mim.** Se decidir ativar o modelo de confianca descrito acima, aplique nesta ordem no SQL Editor ou pipeline:

1. [`20261025185002_master_plan_capability_journey.sql`](../../supabase/migrations/20261025185002_master_plan_capability_journey.sql): tabelas, RLS e funcoes de autoavaliacao, solicitacao e revisao.
2. [`20261025185225_master_plan_capability_library_seed.sql`](../../supabase/migrations/20261025185225_master_plan_capability_library_seed.sql): catalogo curado. Gerado por [`generate-master-plan-library-sql.mjs`](../../scripts/generate-master-plan-library-sql.mjs); nao edite o seed manualmente.

As migracoes nao apagam nem alteram `master_plan_documents`, colaboradores, desafios, tarefas ou certificacoes anteriores. O catalogo usa `ON CONFLICT DO NOTHING`, sem sobrescrever edicoes futuras.

### Conferencia depois da aplicacao

```sql
SELECT 'capacidades' AS item, count(*) FROM public.master_plan_capability_library
UNION ALL SELECT 'responsabilidades', count(*) FROM public.master_plan_responsibility_library
UNION ALL SELECT 'criterios', coalesce(sum(jsonb_array_length(criteria)), 0) FROM public.master_plan_capability_library;
-- Esperado: 28, 56, 262.

SELECT count(*) FROM public.master_plan_self_assessments;
SELECT count(*) FROM public.master_plan_certification_requests;
-- Esperado antes do primeiro uso: 0 em ambas.
```

## Estado da publicacao

O frontend usa a biblioteca do banco apenas se encontra as 28 capacidades e 56 responsabilidades com a mesma assinatura da fonte. Sem o SQL, mantem a **previa visual sem gravacao**. O build local e os testes foram executados, mas nao houve validacao de escrita no Supabase de producao nem publicacao em Vercel nesta etapa. Antes de promover a versao, confirmar o risco de identidade acima, aplicar e validar o SQL e testar a jornada completa com perfis distintos.
