# Prompt para aplicar a migration Acompanhamentos recorrentes

Os SQL estão na pasta `docs/lovable/acompanhamentos-recorrentes/`:

- `1_aplicar_acompanhamentos_recorrentes.sql`: a migration (cópia exata de
  `supabase/migrations/20261126120000_acompanhamentos_recorrentes.sql`).
- `2_conferir_acompanhamentos_recorrentes.sql`: duas consultas só de leitura.

Anexe os dois arquivos no Lovable e cole o texto abaixo, a partir de "Anexei".

---

Anexei dois arquivos SQL. Sua tarefa é só aplicar no banco. Não escreva nem altere código do app, não mude o SQL e não crie outro SQL além do que for preciso para aplicar este.

1. Aplique o arquivo `1_aplicar_acompanhamentos_recorrentes.sql` inteiro no banco de produção, como uma única migration (uma única transação). Se der qualquer erro, não aplique nada e me mostre a mensagem de erro completa. Não tente corrigir o SQL.
2. Depois rode as duas consultas do arquivo `2_conferir_acompanhamentos_recorrentes.sql` e me mostre o resultado de cada uma, ao lado do que o comentário dela diz que é esperado.

---

## Para quem for aplicar

- A migration só acrescenta colunas opcionais à tabela `tasks`; não muda nenhum dado e pode rodar mais de uma vez.
- Esperado na conferência: (1) sete linhas; (2) quatro linhas.
- Teste local: rodada duas vezes em Postgres local (PGlite), aceitando valores válidos e recusando os inválidos.
