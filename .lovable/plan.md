

# Correção: Adicionar Painel retorna erro 401

## Problema Identificado

Ao tentar adicionar um novo painel pelo gerenciador, a requisição POST retorna **erro 401 (não autorizado)** com a mensagem: `"new row violates row-level security policy for table panel_links"`.

**Causa raiz:** As políticas de RLS (Row-Level Security) para INSERT, UPDATE e DELETE na tabela `panel_links` estão configuradas como **RESTRICTIVE** (não permissivas). No PostgreSQL, mesmo que a expressão seja `true`, políticas restritivas sozinhas não concedem acesso — é necessário que pelo menos uma política **PERMISSIVE** também exista e seja aprovada. Como não há políticas permissivas para INSERT/UPDATE/DELETE, todas as operações de escrita são bloqueadas.

## Solução

Recriar as políticas de INSERT, UPDATE e DELETE como **PERMISSIVE** para que qualquer usuário (inclusive anônimo) possa gerenciar os painéis.

## Detalhes Técnicos

Uma migração SQL será executada para:

1. Remover as políticas restritivas atuais de INSERT, UPDATE e DELETE
2. Criar novas políticas **permissivas** para essas operações
3. A política de SELECT permanece como está (já funciona corretamente)

```text
Políticas atuais (RESTRICTIVE - bloqueiam):
  - "Authenticated users can insert panel links" -> RESTRICTIVE
  - "Authenticated users can update panel links" -> RESTRICTIVE  
  - "Authenticated users can delete panel links" -> RESTRICTIVE

Novas políticas (PERMISSIVE - permitirão acesso):
  - "Public can insert panel links" -> PERMISSIVE, WITH CHECK (true)
  - "Public can update panel links" -> PERMISSIVE, USING (true)
  - "Public can delete panel links" -> PERMISSIVE, USING (true)
```

Nenhuma alteração de código será necessária -- apenas a correção das políticas no banco de dados.

