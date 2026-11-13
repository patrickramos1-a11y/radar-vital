# Radar Vital — Auditoria de Refinamento Visual

Data: 2026-11-12 · Base auditada: `origin/main` (`307323e`) · Telas vistas em 1440×900 e 375×812 com dados reais.

A plataforma está completa em funções; o problema agora é **densidade mal distribuída**.
Na Central, o primeiro item de trabalho só aparece depois de 5 blocos de cabeçalho no
desktop e de quase 2 telas no celular. Nada aqui cria funcionalidade nova: a proposta
reorganiza, unifica e corta o que se repete.

---

## 1. Diagnóstico transversal

| # | Problema | Onde aparece | Evidência |
| --- | --- | --- | --- |
| D1 | Navegação repetida 3 vezes | Central (desktop e mobile) | Barra de módulos → subabas da Central → `TabsList` interna com as mesmas 7 abas (`CentralEntregas.tsx:335`) |
| D2 | Cabeçalho empilhado antes do conteúdo | Central | Título + 6 KPIs globais + abas + seletor de equipe (cartões de 116 px) + painel do colaborador com 8 KPIs + faixa amarela da aba |
| D3 | Mesmos números exibidos 2–3 vezes, às vezes divergentes | Central / Performance | "Tarefas abertas 168" no painel e de novo em Performance; "Atrasados 2" no painel × "Atrasadas 1" em Performance (um soma prioridades, o outro não); "Tarefas abertas 168" × "80 tarefa(s)" na aba Tarefas |
| D4 | Cor de marca dividida | Botões e cartões | Primária é verde (`--primary: 95 55% 41%`), mas "Nova prioridade", "Nova tarefa", o FAB e a borda dos cartões de prioridade são roxos/índigo (123 usos de `indigo/violet/purple`) |
| D5 | Tipografia microscópica | Todo o app | 182× `text-[10px]`, 72× `text-[9px]`, 21× `text-[8px]`, 9× `text-[7px]`, 1× `text-[6px]` |
| D6 | Formas e controles sem padrão | Central | Raios misturados (`rounded`, `-md`, `-lg`, `-xl`, `-2xl`, quadrado); `<select>` nativo ao lado de `Select` do shadcn; checkbox nativo ao lado de `Checkbox`; 3 estilos diferentes de seletor de período |
| D7 | Rolagem dentro de rolagem | Aba Tarefas, Histórico | Tabela com `max-h-[640px] overflow-auto` dentro da página que já rola; o cabeçalho fixo da tabela é transparente e sobrepõe as linhas |

---

## 2. Central de Entregas — estrutura

**Hoje (desktop, 900 px de altura):** a lista de prioridades começa em ~y=480. Metade da
tela é cabeçalho.

**Proposta — "uma faixa de contexto, depois o trabalho":**

1. **Remover a `TabsList` interna.** A subnavegação do topo (`AppNavigation`) já troca a aba
   via `?tab=`. No mobile, manter só ela (rolável).
2. **Fundir título + escopo + colaborador numa única barra** (altura ~56 px):
   `Central de Entregas · [AC/AV | Universo | Tudo] · [avatar ▾ Patrick]`.
   O seletor de equipe vira um **dropdown/linha de avatares de 32 px** em vez de cartões de
   116 px. "Equipe" continua como primeira opção.
3. **Uma única faixa de KPIs**, contextual:
   - Colaborador selecionado → 5 números: Prioridades · Tarefas abertas · Atrasos · Comentários pendentes · Pontos.
   - Equipe → os totais globais.
   - Os 6 cartões globais (`GlobalSummary`) e os 8 do `CollaboratorPanel` deixam de coexistir.
     "Melhor do mês" e "Mais estrelas" saem do topo e vão para Performance.
   - Clicar num KPI aplica o filtro correspondente (ex.: Atrasos → filtra atrasados) — usa filtros que já existem.
4. **Remover a faixa amarela "Prioridades — Foco atual…"** da aba; o título já está na aba ativa.
5. Mesma régua para todas as abas: barra de contexto → barra de filtros → conteúdo.

Resultado esperado: primeiro item visível em ~y=200 no desktop.

---

## 3. Prioridades e Tarefas

**Prioridades (`PrioritiesTab.tsx`, 949 linhas)**

- Cartões agrupados por cliente estão bons na ideia; refinar:
  - Borda superior roxa → borda esquerda na cor da **urgência** (vermelho/laranja/cinza), que é a informação que importa.
  - Logo do cliente ocupa uma coluna de ~60 px com número e "+" soltos; trocar por cabeçalho de grupo de 1 linha (logo 20 px + nome + contagem + "+").
  - 5 ícones de ação sempre visíveis por linha (agenda, link, estrela, check, …) → manter só **check** e **⋯**; os demais aparecem no hover (desktop) ou no menu (mobile).
  - Selos "Extremamente urgente" em caixa com borda e ícone ocupam muito; usar ponto colorido + texto curto ("Urgente+").
- O alternador **Lista / Painel / Tarefas / Tudo** dentro da aba Prioridades duplica a aba Tarefas. Manter Lista/Painel; "Tarefas" e "Tudo" saem daqui (a aba Tarefas já existe).

**Tarefas (`TasksTab.tsx`)**

- Tirar a rolagem interna (`max-h-[640px]`); a página rola, o cabeçalho da tabela fica fixo com fundo sólido.
- Colunas: Tarefa · Cliente · Responsável · Prazo · Dias · Ações. "Prioridade vinc." com botão "Promover" em toda linha vira ação no menu ⋯.
- Status "Pendente" em todas as linhas é ruído: mostrar só quando diferente do padrão.
- Contagem clara no topo: "80 de 168 tarefas (filtro: Patrick)".

**Cores das ações principais:** "Nova prioridade", "Nova tarefa" e FAB passam a verde primário.

---

## 4. Filtros — padrão único

Hoje cada aba tem seu arranjo: Prioridades (ordenar + busca + select cliente + 2 checkboxes + botão), Tarefas (2 selects + busca + checkbox), Histórico (chips 7d/30d/90d/Tudo), Performance (segmentado "Todo período/Este mês/Este ano").

**Componente `FilterBar` único para a Central:**

| Posição | Controle | Comportamento |
| --- | --- | --- |
| Esquerda | Busca | Sempre presente, mesmo placeholder "Buscar…" |
| Centro | Chips de filtro (Cliente, Responsável, Status, Período) | Popover com busca (Combobox), chip mostra o valor ativo: "Cliente: Fasann ×" |
| Direita | Ordenar · Visualização · Ação primária | Ícones; ação primária verde |

- Período com **um só vocabulário** em Histórico e Performance: `Este mês · 30 dias · 90 dias · Este ano · Tudo`.
- "Concluídas" e "Planejadas" viram opções do chip Status, não checkboxes soltos.
- Botão "Limpar filtros" aparece só com filtro ativo.
- Mobile: busca + botão "Filtros (2)" que abre bottom sheet com os mesmos chips.

---

## 5. Histórico e Performance

**Problema:** Performance hoje é 20 cartões de KPI em 5 seções + um gráfico de linha de 6 pontos esticado em 1.500 px de largura × 256 px de altura. Vários números repetem o painel do topo, muitos ficam em 0, e o gráfico **não responde** ao seletor de período. Na visão "Equipe", a aba mostra os dados do primeiro colaborador (`responsibleList[0]`), o que confunde. Histórico são 4 acordeões fechados sem contexto temporal.

**Proposta Performance (mesmos dados, outra forma):**

1. **Visão individual**
   - Linha de 4 números-síntese com comparação ao período anterior: Pontos · Entregáveis concluídos · Tarefas concluídas · Tempo médio (dias). Ex.: "57 tarefas ▲ 12 vs mês anterior".
   - **Um gráfico compacto** (altura ~160 px, largura máx. ~720 px): barras mensais de concluídas com linha de criadas — 6 meses, obedecendo o período.
   - Os demais indicadores (estrelas, joinhas, auditorias, desafios, comentários lidos) numa **tabela de 2 colunas** compacta, sem ícones e sem cartões.
2. **Visão equipe** (padrão quando "Equipe" está selecionado)
   - **Tabela comparativa**: linha = colaborador, colunas = Pontos, Entregáveis, Tarefas ✓, Atrasos, Tempo médio. Clique no cabeçalho ordena (substitui o `<select>` com 20 métricas).
   - Mini-barra dentro da célula da coluna ordenada (barra horizontal proporcional), em vez de barras de largura total.
   - "Melhor do mês" e "Mais estrelas" (hoje no topo) entram aqui como destaque da primeira linha.

**Proposta Histórico:**

- Trocar os 4 acordeões por **uma linha do tempo única** agrupada por dia ("Hoje", "Ontem", "12 nov"), cada item com ícone do tipo (tarefa, prioridade, entregável, comentário), cliente e responsável.
- Chips de tipo no topo (Tudo · Tarefas · Prioridades · Entregáveis · Comentários) com contagem.
- Mesmo seletor de período do padrão de filtros.
- Opcional, sem custo de dados: um "sparkline" de atividade por dia no topo (barras de 30 dias, 40 px de altura).

---

## 6. Página inicial (Painel AC)

O Painel nasceu compacto e deve continuar assim. Os ajustes são de leitura, não de layout:

- **Cartões de cliente no desktop:** o fundo inteiro na cor saturada do colaborador (roxo, rosa, verde-limão) compete com os logos e cansa. Usar fundo branco com **faixa/borda esquerda na cor do responsável** — exatamente como a versão mobile já faz (que está melhor).
- Linha superior do cartão: nome cortado ("P…", "N…") ao lado de 4–5 ícones de 10 px. Mostrar só contagens com valor > 0 e deixar o nome sob o logo.
- **Barra de contadores** (≈15 pílulas: total, AC, AV, de boa, alerta, 5 colaboradores, prioridades, BO, responsáveis, comentários, tarefas): agrupar em 3 blocos com separador — Clientes · Equipe · Pendências — e mesmo estilo de pílula (hoje há 3 estilos).
- **Linha "PAINÉIS"** (links externos: APT, Boletim Ambiental, Ficha de Serviços, Lovable…) ocupa 2 linhas no topo; mover para um botão "Painéis ▾" na barra de ferramentas.
- Barra de ferramentas (ordenar, 6 ícones, busca, município, auditoria, filtros AC/AV, colaboradores): aplicar o mesmo `FilterBar` da seção 4.

---

## 7. Versão mobile

- **Central:** hoje são 3 barras de navegação + escopo + seletor de equipe em grade 3×3 com fotos de 64 px (≈1,5 tela) antes do primeiro item. Proposta:
  1. Cabeçalho fixo de 1 linha: título curto + avatar do colaborador (toque abre a troca).
  2. Subabas roláveis (só uma linha).
  3. KPIs em **carrossel horizontal de chips** (1 linha), não grade 3×2.
  4. Conteúdo.
- **Tarefas no mobile:** a tabela desktop é espremida (título quebra palavra a palavra, rolagem lateral). Trocar por **lista de cartões**: título (2 linhas), cliente, prazo/dias, check à direita; swipe ou ⋯ para demais ações.
- **Prioridades no mobile:** a linha "30 prioridades em 26 clientes" quebra em 4 linhas ao lado do alternador; mover contagem para acima e reduzir o alternador a ícones.
- O FAB roxo cobre a coluna de ações dos cartões; dar `padding-bottom` à lista e passar o FAB para verde.
- Alvos de toque mínimos de 40 px (hoje há ícones de 16 px como único alvo).

---

## 8. Sistema visual

| Tema | Regra proposta |
| --- | --- |
| Cor primária | Verde `--primary` para toda ação principal; roxo/índigo eliminado da Central. Cor do colaborador só em avatar, borda e destaque de nome |
| Cores de estado | Vermelho = atraso/urgente; âmbar = atenção; verde = concluído; cinza = neutro. Nada mais |
| Tipografia | Escala fixa: 11 · 12 · 14 · 16 · 20 · 24 px. Nada abaixo de 11 px (exceto selos numéricos de 10 px) |
| Raio | `rounded-lg` para cartões e campos; `rounded-full` só para avatares e chips. Fim do quadrado sem raio |
| Controles | Sempre os componentes shadcn (`Select`/`Combobox`, `Checkbox`, `ToggleGroup`), nunca nativos |
| Componentes comuns | `KpiStrip`, `FilterBar`, `PeriodSelect`, `SectionHeader`, `EmptyState` — um de cada, usados em todas as abas |
| Sombras e gradientes | Remover gradientes de fundo nos painéis (`linear-gradient(135deg, cor0d…)`); sombra só em hover e em elementos flutuantes |

---

## 9. Plano de execução

Ordem pensada para cada onda ser publicável sozinha e não quebrar nada.

| Onda | Entrega | Arquivos principais | Esforço |
| --- | --- | --- | --- |
| 1 | Fundação: tokens de cor/tipo/raio, componentes `KpiStrip`, `FilterBar`, `PeriodSelect`; roxo → verde | `index.css`, `tailwind.config.ts`, `components/ui/*`, novos em `components/common/` | M |
| 2 | Cabeçalho da Central: remover `TabsList` interna, barra de contexto única, seletor de colaborador compacto, KPI único | `CentralEntregas.tsx`, `TeamSelector.tsx`, `GlobalSummary.tsx`, `CollaboratorPanel.tsx` | M |
| 3 | Prioridades e Tarefas: cartões e tabela refinados, ações no ⋯, sem rolagem interna, filtros novos | `PrioritiesTab.tsx`, `TasksTab.tsx` | G |
| 4 | Performance e Histórico redesenhados | `PerformanceTab.tsx`, `HistoryTab.tsx` | M |
| 5 | Mobile da Central: cabeçalho 1 linha, KPIs em carrossel, tarefas em cartões, sheet de filtros | `CentralEntregas.tsx`, `TasksTab.tsx`, `components/mobile/*` | M |
| 6 | Painel AC: cartões com borda colorida, contadores agrupados, menu "Painéis" | `Index.tsx`, `ClientCard.tsx`, `FilterBar.tsx`, `DashboardHeader.tsx` | M |
| 7 | Varredura: tipografia mínima, raios, demais abas (Comentários, Entregáveis, Desafios) no novo padrão | vários | P |

Correções de consistência de números (D3) entram na onda 2: um único cálculo de
"atrasos" e "tarefas abertas" compartilhado entre painel, KPIs e Performance.

### Decisões para validar antes de começar

- Remover "Melhor do mês / Mais estrelas" do topo da Central e levar para Performance?
- No Painel AC desktop, trocar o fundo colorido do cartão por borda colorida (como no mobile)?
- Em Prioridades, tirar as visões "Tarefas" e "Tudo" do alternador (ficam só na aba Tarefas)?
