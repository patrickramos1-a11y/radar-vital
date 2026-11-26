# Plano: Radar Vital no design da Ramos

Pedido do Patrick em 26/11/2026 (`/aplicar-design RADAR VITAL`): aplicar o kit da
Ramos (biblioteca `aplicar-design/ramos/`) em fases. Cada fase é feita numa
branch, mostrada no navegador lateral (computador e celular, dia e noite) e só
vai para o site com o ok dele.

## Regras que valem em todas as fases

- **Só o visual muda.** Textos, rotas, dados, filtros e funcionamento ficam.
- **Sistema de trabalho, não vitrine:** base branca, leitura densa sem vidro.
  O vidro fica no topo, nos botões, nas abas, nos avisos e nas janelas
  (no máximo 6 a 8 superfícies por tela). Sem fotos de obra e sem fundo animado.
- **Marca da Ramos:** verde `#0DD375` e cinza `#5B5B5B`; letras Barlow Condensed
  (títulos e números), Manrope (interface e texto) e IBM Plex Mono (datas e
  códigos). Logo só pelos arquivos de `marca/vetor/`, nunca digitada.
- **Dia e noite:** automático pelo horário (dia das 6h às 18h) com o seletor
  Auto/Dia/Noite no topo; a escolha fica guardada no aparelho.
- **Um botão aceso por tela**, só na ação principal (ex.: "Novo processo").
- Contraste AA, foco visível, alvos de toque de 44px, "reduzir movimento"
  respeitado, sem rolagem para o lado em 375px.

## Decisões do Patrick (26/11/2026)

- **Fora deste processo:** o Plano Mestre inteiro (fica no visual anterior, sempre
  claro). Do Universo Ramos entra só o painel (Visão geral, `/universo-ramos`);
  as outras visões dele já são páginas do Plano Mestre.
- **Tom água:** o destaque do Radar Vital é o azul-rio da biblioteca (`.tom-agua`,
  `#3A9AD9` vivo, `#1A6090` texto), também no contorno de luz, no selo de vidro e
  no detalhe dos ícones. A logo continua verde.
- **Usar mais o repositório:** vidro, efeitos (reflexo, contorno de luz no foco,
  holofote), transições entre páginas e selos, e não só as cores.

## O que existe hoje

| Item | Hoje |
|---|---|
| Letras | Inter (texto) e Space Grotesk (títulos) |
| Verde | `#529F25` (verde-oliva), diferente do verde oficial |
| Tema | Só claro |
| Topo | Barra branca com módulos e visões; sem logo |
| Ícones | 152 ícones do pacote Lucide em 113 arquivos (5 já têm desenho Ramos, 58 têm equivalente e 89 ainda não têm desenho) |
| Telas | 16 páginas: Painel AC, Processos, Gestão de processos, Quadro de clientes, Central (Entregáveis, Comentários, Desafios, Histórico, Performance), Universo Ramos, Plano Mestre, Auditorias, Tesouro, Relatórios PDF, Configurações, TV |

## Fases

### Fase 1 — Base visual (vale para o sistema todo)
- Cores da Ramos nos tokens do sistema (verde viva, escura, profunda e clara;
  neutros da base branca), no claro e no escuro.
- Letras do manual (Manrope, Barlow Condensed, IBM Plex Mono).
- Dia e noite com o seletor no topo.
- Logo da Ramos no topo (horizontal; negativa à noite).
- Topo e visões em vidro (barra translúcida), item atual com fio verde.
- Camada de noite para as cores fixas que as telas usam hoje (`bg-white`,
  cinzas), para nada ficar branco no escuro.

### Fase 2 — Ícones Ramos
- Desenhar os 89 que faltam no padrão Ramos, na biblioteca `aplicar-design`
  (traço fino + um detalhe verde), publicar a biblioteca e reinstalar.
- Trocar os ícones dos 113 arquivos por um componente único
  (`<IconeRamos nome="…">` e `<SeloRamos nome="…">`) e tirar o pacote Lucide.
- Selo de vidro onde o ícone identifica algo (menu lateral, cabeçalho de seção,
  indicadores); ícone simples em botões, campos e tabelas.

### Fase 3 — Peças das telas de trabalho
Processos, Gestão de processos, Painel AC e Central:
- botões (ação principal acesa, demais com contorno), abas e filtros em vidro,
  busca com contorno verde, chips, avisos e janelas (Novo processo, Novo
  acompanhamento) em vidro;
- cartões de cliente e de processo na base branca, com sombras leves;
- números e indicadores em Barlow Condensed.

**Como ficou (26/11):** as peças do vidro da biblioteca entraram em tamanho de
sistema (compactas, sem maiúsculas, tom água) no arquivo
`src/styles/ramos-telas.css` (12 KB). Elas só valem com
`<html data-design="ramos">`; o `AppLayout` troca para `legado` no Plano Mestre.

| Peça da biblioteca | No Radar Vital | Onde entra |
|---|---|---|
| `.botao-neon--aceso` | `.botao-r--aceso`: azul aceso com fio de luz no alto | botão principal (variante padrão do `Button`); um por tela: Novo processo, Registrar entrega, Novo cliente, Nova anotação, Novo acompanhamento |
| `.botao-neon` apagado | `.botao-r`: vidro com contorno que acende no foco | botões `outline` e `secondary`; filtro com valor fica azul |
| `.busca-neon` | `.busca-r` (pílula) + contorno de luz da fase 2 | busca de Processos, Gestão e Painel AC |
| `.abas-vidro` | `.grupo-r`: pílula com o item atual aceso | abas (`TabsList`), `SegmentedControl`, ordenar, visões, seções da Gestão, abas dos Entregáveis, Comentários, acompanhamento |
| `.chip-vidro` | `.chip-r` e `.filtro-r` | pessoas da Central; selects e caixas de marcar dos filtros |
| `.modal-vidro` | `.janela-r` + `.veu-r` | todas as janelas (`Dialog`, `AlertDialog`), com fio de luz no alto |
| `.aviso-vidro` | `.aviso-r`, `.vidro-menu-r`, `.gaveta-r` | avisos rápidos, menus, listas de seleção, balões e painel lateral |
| `.barra-vidro` | `.barra-filtros-r` | barra de filtros da tela de Processos |
| `.widget-vidro__valor` | `.numero-r` (Barlow Condensed) | números da Central, da Gestão e do Painel AC |
| cartão base branca | `.client-card-compact`, `.faixa-numeros-r` | cartões de cliente e de processo; faixa de números |

Também: a camada de noite ganhou as faixas tingidas com transparência (semana
dos Entregáveis, acompanhamento). Os botões principais deixaram de usar a cor do
colaborador e o filtro AC/AV deixou a cor do tipo: a escolha acende em azul.

### Fase 4 — Demais telas
Universo Ramos, Plano Mestre, Auditorias, Tesouro, Relatórios PDF,
Configurações e Modo TV, com as mesmas peças.

### Fase 5 — Conferência final e publicação
- Noite revisada tela por tela; celular (375px); "reduzir movimento".
- Testes, build, peso que entrou e registro no `DESIGN.md` da plataforma.
- Publicação (PR → main → Vercel) com o ok do Patrick.

## Andamento

| Fase | Situação |
|---|---|
| 1. Base visual | Feita (prévia aprovada na direção em 26/11) |
| 2. Ícones | Feita: 60 desenhos novos na biblioteca, 96 arquivos trocados para os ícones Ramos (Plano Mestre mantém os antigos); tom água; vidro, efeitos e transições ligados |
| 3. Telas de trabalho | Feita em 26/11 (prévia para o Patrick ver): Processos, Gestão de processos, Painel AC e Central; dia, noite e celular conferidos. Como as peças base mudaram, as telas da fase 4 já pegam botões, campos, abas e janelas novos. Pendente para a fase 5: levar as peças compactas (`.botao-r`, `.grupo-r`…) para a biblioteca `aplicar-design` |
| 4. Demais telas | Feita em 26/11 (prévia para o Patrick ver): Indicadores, Comentários, Relatórios PDF, Configurações, Tesouro, Auditorias, Quadro de clientes, painel do Universo Ramos e Modo TV com números em Barlow (`.numero-r`), escolhas em pílula (`.grupo-r`), busca (`.busca-r`) e botões de administração no padrão; dia, noite e celular conferidos. Plano Mestre fora, como pedido |
| 5. Conferência e publicação | A fazer |
