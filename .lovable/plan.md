
# Chat de Conversa no Backlog

## Resumo

Adicionar uma aba "Conversa" no detalhe do item de backlog, funcionando como um chat onde os usuarios podem trocar mensagens sobre o item. Cada mensagem mostra nome do perfil, data/hora, e suporta edicao (com marcacao "editada") e exclusao silenciosa.

---

## 1. Tabela no Banco de Dados

Nova tabela `backlog_messages`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador |
| backlog_item_id | uuid (FK -> backlog_items) | Item vinculado |
| author_name | text | Nome do perfil que enviou |
| message | text | Conteudo da mensagem |
| is_edited | boolean (default false) | Marca se foi editada |
| created_at | timestamptz | Data/hora de envio |
| updated_at | timestamptz | Ultima edicao |

RLS permissiva (mesmo padrao das outras tabelas de backlog). Cascade delete quando o item de backlog for removido.

---

## 2. Novo Componente: BacklogChat

Componente `src/components/backlog/BacklogChat.tsx` com:

- **Area de mensagens** com scroll, ordenadas da mais antiga para a mais recente (estilo chat)
- **Cada mensagem** mostra:
  - Iniciais do autor em avatar colorido
  - Nome do autor
  - Data e horario formatados (ex: "10/02/2026 14:32")
  - Texto da mensagem
  - Tag "(editada)" ao lado do horario, se aplicavel
  - Botoes de editar/excluir visíveis apenas para o autor da mensagem
- **Campo de input** fixo na parte inferior com botao de enviar
- **Edicao inline**: ao clicar em editar, o texto da mensagem vira um campo editavel com botoes Salvar/Cancelar
- **Exclusao silenciosa**: ao excluir, a mensagem simplesmente desaparece sem notificacao para outros

---

## 3. Hook: useBacklogMessages

Novo hook `src/hooks/useBacklogMessages.ts` com:

- `messages` -- lista de mensagens do item (query por backlog_item_id)
- `sendMessage(text)` -- insere nova mensagem com o nome do usuario atual
- `editMessage(id, newText)` -- atualiza texto e marca `is_edited = true`
- `deleteMessage(id)` -- remove silenciosamente

---

## 4. Integracao na Pagina BacklogDetail

- Adicionar uma **quarta aba** "Conversa" ao TabsList existente (ao lado de Anexos, Implementacoes, Historico)
- O icone sera `MessageSquare` do lucide-react
- Mostra contagem de mensagens no badge da aba

---

## Detalhes Tecnicos

### Migracao SQL

Criar tabela `backlog_messages` com:
- Foreign key para `backlog_items(id)` com ON DELETE CASCADE
- RLS habilitado com politicas permissivas para select, insert, update, delete
- Indices em `backlog_item_id` e `created_at`

### Arquivos

1. **Migracao SQL** -- criar tabela `backlog_messages`
2. **Novo:** `src/hooks/useBacklogMessages.ts` -- CRUD de mensagens
3. **Novo:** `src/components/backlog/BacklogChat.tsx` -- componente visual do chat
4. **Editado:** `src/pages/BacklogDetail.tsx` -- adicionar aba "Conversa" ao TabsList
5. **Editado:** `src/types/backlog.ts` -- adicionar interface `BacklogMessage`

### Identificacao do autor

Usa `getCurrentUserName()` do AuthContext (mesmo padrao usado no historico do backlog). Botoes de editar/excluir so aparecem quando `message.author_name === currentUserName`.

### Visual do chat

- Mensagens do usuario atual alinhadas a direita com fundo azul
- Mensagens de outros alinhadas a esquerda com fundo cinza
- Avatar com iniciais coloridas
- Scroll automatico para a mensagem mais recente ao abrir ou enviar
