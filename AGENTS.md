# Radar Vital - Guia de Execucao

Este arquivo orienta qualquer agente ou desenvolvedor que trabalhar neste
repositorio. A fonte de verdade funcional para as proximas implementacoes esta
em [`docs/roadmap/README.md`](docs/roadmap/README.md).

## Leitura obrigatoria

Antes de alterar codigo relacionado ao roadmap:

1. Ler `docs/roadmap/README.md`.
2. Ler `docs/roadmap/DECISIONS.md`.
3. Conferir a fase atual em `docs/roadmap/STATUS.md`.
4. Consultar `docs/roadmap/DATA_MODEL.md` antes de criar migrations.
5. Seguir a fase correspondente em `docs/roadmap/IMPLEMENTATION_PLAN.md`.

## Regras de trabalho

- Executar uma fase por vez, respeitando suas dependencias.
- As fases sao etapas internas de construcao, nao publicacoes independentes.
- Desenvolver todo o roadmap em uma branch de integracao separada de `main`.
- Usar Supabase local ou um projeto de teste durante as Fases 0 a 6.
- Nao aplicar migrations no Supabase de producao antes do portao final.
- Nao mesclar em `main` nem publicar no Lovable antes da Fase 7.
- Criar commits de controle ao concluir cada fase na branch de integracao.
- Nao alterar uma decisao marcada como fechada sem registrar a mudanca em
  `docs/roadmap/DECISIONS.md`.
- Atualizar `docs/roadmap/STATUS.md` ao iniciar e concluir uma entrega.
- Preservar o comportamento atual que nao fizer parte da fase em execucao.
- Preferir migrations aditivas e reversiveis.
- Novos relacionamentos financeiros, auditorias e desafios devem usar UUID de
  colaborador, e nao apenas o nome.
- Auditorias, desafios, premios, penalidades e liquidacoes precisam gerar log.
- Operacoes financeiras devem ser atomicas e idempotentes.
- Universo Ramos nao entra por padrao nos totais e paineis de clientes AC/AV.
- A Visao Unificada agrega registros na interface, mas nao mistura todos os
  dominios em uma unica tabela.
- A aplicacao publicada deve continuar funcionando durante todo o
  desenvolvimento.
- O lancamento final deve aplicar primeiro as migrations aditivas e compativeis,
  depois integrar o codigo em `main` e somente entao publicar no Lovable.
- O lancamento atual preserva o acesso sem login da versao publicada. Nao
  publicar `AuthGate`, tela de login, convite por e-mail, Edge Function de
  convite ou migrations dependentes de `auth.users` sem nova decisao formal.

## Verificacao minima

Antes de considerar uma fase concluida:

```sh
npm run build
npm run lint
```

O repositorio possui divida de lint anterior ao roadmap. Novos arquivos nao
devem aumentar essa divida, e os arquivos alterados devem ser melhorados quando
isso estiver dentro do escopo.

Fluxos criticos devem receber testes automatizados antes da publicacao.

## Politica de lancamento

O roadmap usa desenvolvimento faseado e uma unica publicacao final:

1. construir e validar cada fase no ambiente isolado;
2. integrar todas as fases na mesma branch;
3. executar a bateria completa de testes;
4. fazer backup e `dry-run` das migrations de producao;
5. aplicar as migrations no Supabase de producao;
6. mesclar a branch de integracao em `main`;
7. validar a sincronizacao com o Lovable;
8. publicar uma unica atualizacao;
9. executar smoke tests na versao publicada.
