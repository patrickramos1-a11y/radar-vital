

## Refatoramento Visual — Paleta SisRamos (Verde) + Fundo Branco + Visual Futurista

### Objetivo
Aplicar a identidade visual SisRamos (verde claro #6B9B37 + verde escuro #2D4A1C) com fundo branco, sem dark mode. Manter o visual moderno/futurista com glassmorphism e microinterações, apenas trocando a paleta de indigo/violet para verde.

### Paleta extraída do logo
- Verde claro (primary): ~`95 55% 41%` (HSL de #6B9B37)
- Verde escuro (accent): ~`105 45% 20%` (HSL de #2D4A1C)
- Fundo: branco puro / cinza muito claro
- Foreground: cinza escuro neutro

### Arquivos a modificar

**1. `src/index.css`** — Trocar todas as variáveis CSS:
- `--primary`: verde claro SisRamos (`95 55% 41%`)
- `--accent`: verde escuro SisRamos (`105 45% 20%`)
- `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--card-highlight`: seguir o verde
- Manter `--background` branco/cinza claro, `--card` branco puro
- Glassmorphism e utility classes: manter, apenas ajustar referências de cor

**2. `src/components/layout/AppSidebar.tsx`**:
- Trocar gradiente do logo de `from-primary to-accent` (já dinâmico via CSS vars, só precisa usar a logo real)
- Copiar o logo `LOGO-FUNDO-BRA.png` para `src/assets/` e usar no header da sidebar em vez do "AC"
- Atualizar o mobile logo no `AppLayout.tsx` também

**3. `src/components/layout/AppLayout.tsx`**:
- Substituir o ícone "AC" mobile pela logo SisRamos

**4. `tailwind.config.ts`** — Sem alterações estruturais necessárias (cores vêm das CSS vars)

### O que NÃO muda
- Nenhuma lógica de backend, hooks, queries
- Nenhuma funcionalidade, rotas, ou estrutura
- Glassmorphism, animações, microinterações permanecem
- Apenas paleta de cores e logo

