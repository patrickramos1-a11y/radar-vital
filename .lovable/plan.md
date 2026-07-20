## Objetivo
Remover a regra que impede o Patrick de marcar comentários como lidos antes dos demais colaboradores. Após a mudança, o Patrick se comporta exatamente como qualquer outro usuário nos sistemas de leitura de comentários.

## Onde a regra existe hoje
Duas ocorrências, ambas com a mesma lógica ("patrick lock"):

1. `src/components/comments/CommentsModal.tsx`
   - Função `isPatrickBlocked(comment)` (linhas ~32-36).
   - Uso em `patrickLocked` (linhas ~767-792): desabilita o botão de marcar como lido e mostra o tooltip "Aguardando equipe ler primeiro".

2. `src/pages/CommentsPanel.tsx`
   - Bloco `patrickLocked` (linhas ~1053-1071): mesma lógica, mesmo tooltip, mesmo `disabled`.

Não há regra equivalente em outras abas/hooks. As anotações sobre colaboradores (`collaborator_comments`) e o auto-arquivamento (`autoArchiveIfFullyRead`) não usam esse gate — o auto-arquivamento continua acontecendo quando todos leem, o que é apenas efeito colateral desejável e não bloqueia ninguém.

## Alterações

### 1. `src/components/comments/CommentsModal.tsx`
- Remover a função `isPatrickBlocked`.
- Remover as constantes `isPatrick` e `patrickLocked`.
- No botão de marcar como lido: remover `disabled={patrickLocked}`, o ramo `patrickLocked` do `title` e as classes condicionais `opacity-50 cursor-not-allowed`. O `onClick` passa a chamar `onToggleRead(currentReadStatusName)` sempre.

### 2. `src/pages/CommentsPanel.tsx`
- Remover as constantes `isPatrick` e `patrickLocked`.
- No botão de marcar como lido: mesma limpeza — sem `disabled`, sem classe de bloqueio, tooltip volta a alternar apenas entre "Marcar como lido" / "Desmarcar como lido", e o `onClick` sempre chama `onToggleRead(currentUserName)`.

## Preservado
- Papel de admin do Patrick (arquivar/encerrar/editar/excluir) continua intacto.
- Auto-arquivamento quando todos leem continua funcionando via `autoArchiveIfFullyRead`.
- Comentários de Ciência Obrigatória continuam com sua própria regra (leitores obrigatórios), sem qualquer tratamento especial para Patrick.
- Nenhuma mudança de banco de dados.

## Verificação
- Typecheck automático do build.
- Conferir visualmente na Central de Entregas → Comentários e no painel `/comentarios` que o botão de "marcar como lido" fica habilitado para o Patrick mesmo quando ninguém mais leu.