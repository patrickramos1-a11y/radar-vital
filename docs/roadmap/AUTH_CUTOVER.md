# Autenticacao e Corte de RLS - Adiado

Este documento registra uma proposta tecnica futura. Ele **nao faz parte do
lancamento atual** e nao deve ser executado nesta rodada.

O Radar Vital continuara com o mesmo acesso da versao atualmente publicada:
sem login obrigatorio, senha, link magico, convite ou cadastro de e-mail.

Os comandos abaixo foram preservados apenas como referencia para um futuro
roadmap de autenticacao, caso essa decisao seja retomada formalmente.

## Pre-condicoes

- backup recente do banco;
- migrations revisadas com `db push --dry-run`;
- frontend da branch de integracao aprovado;
- e-mail preenchido para cada colaborador que tera acesso;
- URL publicada cadastrada nos redirects do Supabase Auth.

## Provisionamento

1. Em `Acessos da equipe`, cadastrar o e-mail de cada colaborador ativo e enviar o convite. A Edge Function `invite-collaborator` cria o convite apenas quando acionada por administrador.
2. Confirmar que o e-mail do usuario corresponde ao e-mail do colaborador.
3. Fazer o primeiro login para executar `bootstrap_current_profile()`.
4. Conferir o vinculo em `profiles.collaborator_id` e
   `collaborators.user_id`.
5. Conceder o papel administrativo apenas ao usuario de Patrick:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('<EMAIL_DO_PATRICK>')
on conflict (user_id, role) do nothing;
```

6. Confirmar que os demais usuarios possuem somente o papel `user`.

## Validacao antes do corte

Com `auth_enforced = false`:

1. publicar o frontend autenticado na janela final;
2. entrar como Patrick;
3. entrar como colaborador comum;
4. validar leitura e escrita operacional;
5. validar que o colaborador comum nao avalia entregavel;
6. validar que trocar nome ou metadado nao concede `admin`;
7. validar saida, senha e link magico.

## Ativacao

Com a sessao administrativa de Patrick:

```sql
select public.set_auth_enforced(true);
```

Depois da ativacao:

1. confirmar que requisicoes anonimas falham;
2. repetir os testes de usuario comum;
3. repetir os testes administrativos;
4. conferir `activity_logs.actor_user_id`;
5. executar os smoke tests de todas as rotas.

## Retorno de emergencia

Se o frontend autenticado falhar durante a janela e Patrick ainda puder acessar
o banco, desativar temporariamente o corte:

```sql
select public.set_auth_enforced(false);
```

Se nao houver uma sessao administrativa funcional, executar a atualizacao da
configuracao pelo console SQL com credencial de servico. O frontend pode retornar
ao commit anterior. Migrations aditivas permanecem instaladas e nao devem ser
apagadas em uma emergencia.

## Regra de seguranca

O valor `auth_enforced = true` somente pode ser aplicado depois da publicacao do
frontend autenticado e dos testes de login. A publicacao so e considerada
concluida depois desse corte e dos smoke tests.
