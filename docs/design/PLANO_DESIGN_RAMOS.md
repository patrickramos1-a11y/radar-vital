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
| 3. Telas de trabalho | A fazer |
| 4. Demais telas | A fazer |
| 5. Conferência e publicação | A fazer |
