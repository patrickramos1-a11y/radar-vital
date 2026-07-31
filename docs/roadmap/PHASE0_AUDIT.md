# Auditoria Tecnica da Fase 0 - Referencia de autenticacao adiada

Atualizado em: 2026-07-30

> Status: nao executar nesta rodada. O lancamento atual preserva o acesso sem
> login da versao publicada.

## Escopo auditado

- fluxo de identidade no frontend;
- relacionamento entre `auth.users`, `profiles` e `collaborators`;
- papel administrativo;
- politicas RLS existentes;
- tipos TypeScript do Supabase;
- capacidade local de executar migrations e testes.

## Diagnostico

### Identidade

O aplicativo usava a chave `painel_ac_user` do `localStorage` como identidade.
Isso permitia trocar o nome exibido sem uma sessao real do Supabase.

Tambem existiam verificacoes administrativas baseadas no texto `Patrick`.
Essas verificacoes nao constituem autorizacao e nao podem proteger operacoes
financeiras, auditorias ou desafios.

### Banco

O schema ja possui:

- `app_role`;
- `user_roles`;
- `collaborators.user_id`;
- `profiles`;
- a funcao historica `has_role`.

Migrations posteriores reabriram varias tabelas para acesso publico para manter
compatibilidade com o seletor local de usuario. A Fase 0 precisa encerrar esse
modo de compatibilidade apenas quando o frontend autenticado estiver validado.

### Tipos

Os tipos versionados nao representavam todas as funcoes e campos preparados
pela Fase 0. O arquivo foi atualizado junto das migrations, mas a geracao oficial
com `supabase gen types` continua pendente ate existir um banco isolado aplicado.

### Ambiente

- build local: disponivel;
- Vitest: instalado e funcionando;
- Docker: indisponivel;
- Supabase CLI autenticado: indisponivel;
- projeto Supabase de teste: ainda nao fornecido.

Por isso, migrations e RLS podem ser revisadas estaticamente, mas nao podem ser
consideradas validadas em banco nesta maquina.

## Solucao preparada para futuro roadmap

1. `AuthProvider` usa sessao real do Supabase.
2. O usuario autenticado e vinculado a um colaborador por `user_id` ou e-mail.
3. O papel administrativo vem de `user_roles`.
4. A aplicacao possui tela de login por senha e link magico.
5. Autoria de tarefas, prioridades, entregaveis, comentarios e avaliacoes usa
   o colaborador autenticado.
6. Avaliacoes administrativas deixam de depender do nome exibido.
7. `activity_logs` recebe `actor_user_id`.
8. O corte de RLS usa a configuracao `auth_enforced`.

## Estrategia de corte

As migrations criam as novas funcoes e politicas com `auth_enforced = false`.
Nesse estado, o frontend antigo continua funcionando durante a janela final.

Depois que:

- os usuarios tiverem sido provisionados;
- Patrick possuir o papel `admin`;
- o frontend autenticado tiver sido publicado;
- login, leitura e escrita tiverem sido validados;

o administrador executa `set_auth_enforced(true)`. A partir desse momento o
acesso anonimo deixa de atender as politicas operacionais.

Esse procedimento faz parte da mesma janela de lancamento da Fase 7. Ele nao e
uma publicacao parcial.

## Pendencias para concluir a Fase 0

- disponibilizar Docker ou um projeto Supabase remoto de teste;
- aplicar todas as migrations em banco limpo;
- regenerar os tipos pelo schema aplicado;
- criar usuarios de teste admin e comum;
- testar RLS com sessao anonima, comum e administrativa;
- validar recuperacao por link magico;
- registrar as evidencias no `STATUS.md`.
