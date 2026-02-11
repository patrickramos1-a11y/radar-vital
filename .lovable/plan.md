

# Substituir sistema "Lido" por vistos estilo WhatsApp

## Resumo

Remover a linha legada "Lido: P C G D V" (onde qualquer pessoa marca qualquer pessoa) e substituir por um sistema inspirado no WhatsApp:

- Um botao **V** (check) colorido com a cor do usuario logado, que so ele pode clicar para marcar como lido
- Um botao **i** (info) que abre um popover mostrando a lista completa de quem leu e quem falta, com cores individuais de cada colaborador e timestamps
- Apenas o administrador (Patrick) pode, pela lista de info, marcar leitura de outros usuarios

---

## Mudancas Tecnicas

### Arquivo: `src/components/comments/CommentsModal.tsx`

**Remover** (linhas 475-497): A secao legada inteira "Lido: P C G D V" com os botoes toggle por colaborador.

**Substituir por** novo componente `ReadStatusBar`:

```text
Layout:
[V colorido do usuario] ────────────────────── [i]

- V (CheckCheck icon): botao com a cor do colaborador logado
  - Se o usuario ja marcou como lido: check preenchido com sua cor
  - Se ainda nao marcou: check cinza/outline, clicavel
  - Ao clicar: chama toggleReadStatus para o colaborador correspondente ao usuario logado
  - So aparece se o usuario logado tem um ReadStatusName correspondente

- i (Info icon): abre Popover com lista completa:
  - Titulo "Lida por" (como no WhatsApp)
  - Cada colaborador com:
    - Bolinha colorida (cor do banco de dados via collaborator.color)
    - Nome
    - Se leu: timestamp formatado + check verde
    - Se nao leu: texto "Pendente"
  - Admin (Patrick): ao lado de cada pendente, botao para marcar como lido
```

**Mapeamento usuario -> ReadStatusName**: Usar o nome do usuario logado (via `currentUser.name`) e mapear para o `ReadStatusName` correspondente (celine, gabi, darley, vanessa, patrick). Isso ja existe parcialmente no codigo.

### Logica de permissao no ReadStatusBar

| Acao | Usuario comum | Admin (Patrick) |
|------|--------------|-----------------|
| Marcar proprio "lido" | Sim (clica no V) | Sim |
| Marcar outro como "lido" | Nao | Sim (via popover info) |
| Ver lista de lidos | Sim (via i) | Sim (via i) |

### Cores dos colaboradores

Usar `collaborator.color` do banco de dados (tabela `collaborators`) em vez das cores hardcoded do `COLLABORATOR_COLORS`. O AuthContext ja fornece os colaboradores com suas cores.

---

## Arquivos impactados

1. **`src/components/comments/CommentsModal.tsx`** -- remover secao legada, adicionar `ReadStatusBar` com popover de info

Nenhuma mudanca no banco de dados ou hooks (os metodos `toggleReadStatus` ja existem).

