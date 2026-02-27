

## Aplicar melhorias de "Marcar como lido" e "Responder" no modal de comentarios do cliente

As mudancas feitas na aba global de comentarios (CommentsPanel) precisam ser replicadas no modal de comentarios que abre ao clicar em um cliente (CommentsModal).

### Mudancas no arquivo `src/components/comments/CommentsModal.tsx`

**1. Aumentar o botao de "Marcar como lido" no ReadStatusBar (linha ~738)**
- Trocar `px-1.5 py-0.5 text-[9px]` por `px-2.5 py-1 text-xs`
- Trocar icones `w-3 h-3` por `w-4 h-4`
- Adicionar `shadow-sm` quando lido e `border border-border` quando nao lido
- Aumentar a contagem de `text-[9px]` para `text-[10px] font-medium`

**2. Mover botao "Responder" do hover para o rodape do balao**
- Remover o botao de Reply do bloco de hover actions (linha ~518)
- Adicionar botao de Reply no footer do balao (linha ~689), ao lado do ReadStatusBar, igual ao CommentsPanel
- Agrupar Reply + ReadStatusBar em um `flex items-center gap-1.5`

Essas mudancas vao deixar o modal consistente com o painel global.

