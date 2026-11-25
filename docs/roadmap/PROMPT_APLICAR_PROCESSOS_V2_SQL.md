# Prompt para aplicar a migration Processos v2

Os SQL estão em arquivos na pasta `docs/lovable/processos-v2/`:

- `1_aplicar_processos_v2.sql`: a migration (cópia exata de
  `supabase/migrations/20261125180000_processos_v2.sql`).
- `2_conferir_processos_v2.sql`: quatro consultas só de leitura para conferir.

Anexe os dois arquivos no Lovable e cole o texto abaixo, a partir de "Anexei".

---

Anexei dois arquivos SQL. Sua tarefa é só aplicar no banco. Não escreva nem altere código do app, não mude o SQL e não crie outro SQL além do que for preciso para aplicar este.

1. Aplique o arquivo `1_aplicar_processos_v2.sql` inteiro no banco de produção, como uma única migration (uma única transação). Se der qualquer erro, não aplique nada e me mostre a mensagem de erro completa. Não tente corrigir o SQL.
2. Depois rode as quatro consultas do arquivo `2_conferir_processos_v2.sql` e me mostre o resultado de cada uma, ao lado do que o comentário dela diz que é esperado.

---

## Para quem for aplicar

- A migration é aditiva e pode rodar mais de uma vez sem duplicar nada.
- Esperado na conferência: (1) zero; (2) cerca de 16, se rodar logo depois de aplicar; (3) nenhuma linha com peso vazio; (4) quatro linhas.
- Números lidos em produção em 25/11/2026: 206 prioridades abertas (190 com tarefa raiz, 15 sem cliente e sem tarefa, 1 com cliente e sem tarefa) e 18 prioridades abertas cuja tarefa raiz já estava concluída. Essas 18 continuam concluídas, como a tela de Processos já as mostra.
- No dia de publicar o código novo, rode de novo `SELECT public.convert_open_priorities_to_processes('Publicação Processos v2');` para pegar prioridades criadas nesse meio tempo. Ela não duplica nada.
- Logo depois da migration, o app publicado continua funcionando. Mudam três coisas: concluir qualquer tarefa principal já gera entregável; tarefa parada não vira mais prioridade sozinha; as 15 prioridades sem cliente aparecem em RAMOS ENGENHARIA.
- Teste local da migration: `supabase/tests/processos_v2/` (PGlite).
