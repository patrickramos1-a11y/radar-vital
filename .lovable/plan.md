

## Refatoramento Visual Completo da Plataforma

### Escopo
Redesign visual completo sem alterar nenhuma funcionalidade backend. Foco em: tema mais moderno e sofisticado, microinterações, tipografia refinada, espaçamentos consistentes, e melhor hierarquia visual.

### Mudanças Planejadas

#### 1. Novo Tema de Cores (src/index.css)
- Trocar o tema esverdeado atual por um tema escuro/neutro profissional com acentos em azul-indigo
- Adicionar variáveis CSS para glassmorphism (`backdrop-blur`, gradientes sutis)
- Melhorar sombras com camadas mais suaves
- Adicionar transições globais mais fluidas
- Novo esquema: background slate escuro, cards com glassmorphism, primary em indigo/violet

#### 2. Layout Principal (AppLayout.tsx)
- Header mais limpo com backdrop-blur e borda sutil
- Logo refinado com gradiente
- Separadores visuais mais elegantes

#### 3. Sidebar (AppSidebar.tsx)
- Background com glassmorphism
- Ícones de navegação com hover mais suave
- Item ativo com barra lateral colorida (accent bar)
- Footer com versão mais discreta

#### 4. Stats Bar do Painel AC (Index.tsx)
- StatCardMini com glassmorphism e hover glow
- StatBadge e AlertFilterButton com design pill mais arredondado
- Colaborador cards com avatar mais polido
- Animações de hover mais suaves (scale + shadow)

#### 5. Client Cards (ClientCard.tsx)
- Cards com glassmorphism (bg translúcido + border sutil)
- Hover com elevação suave (translateY + shadow)
- Header com gradiente sutil
- Badges de colaborador com ring/glow
- Transição de seleção mais fluida

#### 6. Filter Bar (FilterBar.tsx)
- Design mais compacto e limpo
- Botões de filtro com estilo pill arredondado
- Search input com ícone integrado e bordas suaves
- Separadores visuais mais discretos

#### 7. Painéis Visuais - Headers (VisualPanelHeader.tsx, PanelHeader.tsx)
- KPI cards com gradiente de fundo sutil
- Títulos com peso tipográfico mais forte
- Subtítulo com opacidade elegante

#### 8. Modais (TaskModal, CommentsModal)
- DialogContent com backdrop-blur
- Bordas mais suaves e cantos mais arredondados
- Inputs e selects com foco visual mais claro

#### 9. Panel Navigation Bar (PanelNavigationBar.tsx)
- Chips de painéis com design mais moderno (pill shape)
- Cores por tipo mais vibrantes

#### 10. Mobile (componentes mobile)
- Cards com cantos mais arredondados
- Touch targets maiores (min 44px)
- Espaçamentos mais generosos

### Arquivos Modificados
1. `src/index.css` — Novo tema de cores, glassmorphism, transições globais
2. `tailwind.config.ts` — Novas animações (fade-up, slide-in), cores estendidas
3. `src/components/layout/AppLayout.tsx` — Header com backdrop-blur
4. `src/components/layout/AppSidebar.tsx` — Sidebar com glassmorphism e active bar
5. `src/components/dashboard/ClientCard.tsx` — Cards com hover elevation e glassmorphism
6. `src/components/dashboard/ClientGrid.tsx` — Gap e padding ajustados
7. `src/pages/Index.tsx` — Stats bar redesenhada (StatCardMini, StatBadge, AlertFilterButton)
8. `src/components/visual-panels/VisualPanelHeader.tsx` — KPI cards refinados
9. `src/components/visual-panels/VisualGrid.tsx` — Gap/padding melhorados
10. `src/components/panel-links/PanelNavigationBar.tsx` — Chips mais modernos
11. `src/components/layout/UserSelector.tsx` — Avatar e dropdown mais polidos
12. `src/components/notifications/NotificationsPanel.tsx` — Visual refinado

### Princípios de Design
- **Glassmorphism**: Cards e headers com `backdrop-blur-xl` e backgrounds translúcidos
- **Elevation**: Hover states com `translateY(-2px)` + shadow progression
- **Color Harmony**: Paleta coesa com acentos indigo/violet
- **Spacing**: Sistema de 4px consistente
- **Typography**: Pesos mais definidos, tamanhos hierárquicos
- **Transitions**: `duration-200 ease-out` para tudo
- **Borders**: 1px com opacidade baixa para profundidade sutil

### O que NÃO muda
- Nenhuma lógica de backend, hooks, queries, mutations
- Nenhuma funcionalidade existente (filtros, sorting, CRUD)
- Nenhum tipo TypeScript de dados
- Nenhuma rota ou estrutura de navegação
- Nenhuma integração com banco de dados

