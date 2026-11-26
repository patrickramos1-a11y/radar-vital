# Radar Vital — design da Ramos

Aplicado em 26/11/2026 com o comando `/aplicar-design` (biblioteca
`patrickramos1-a11y/aplicar-design`, pasta `ramos/`). Plano e andamento em
[docs/design/PLANO_DESIGN_RAMOS.md](docs/design/PLANO_DESIGN_RAMOS.md).

## Decisões do Patrick

- **Branco é o padrão.** A tela abre sempre clara. Noite e Auto (dia das 6h às 18h)
  ficam no menu do perfil, em "Tema da tela"; o seletor não ocupa o topo.
- **Tom água.** O destaque do sistema é o azul-rio da biblioteca. A logo, o
  "concluído" e os estados de sucesso continuam verdes (marca).
- **Fora do design novo:** o Plano Mestre inteiro (visual anterior, sempre claro).
  Do Universo Ramos entra só o painel (`/universo-ramos`).
- **Só o visual mudou.** Textos, rotas, dados e funcionamento são os mesmos.

## Cores

| Uso | Dia | Noite |
|---|---|---|
| Fundo | branco `#FFFFFF`, pérola `#FAFAFC`, papel `#F5F5F7` | verde-noite `#030A07`, superfícies `#0A1A13` e `#10261C` |
| Texto | tinta `#1D1D1F`, cinza Ramos `#5B5B5B` | `#F2F7F4`, `#A7B8AF` |
| Destaque (tom água) | vivo `#3A9AD9` com texto marinho `#10203A`; texto/link `#1A6090` | vivo `#3A9AD9`; texto `#8CCAF2` |
| Marca | verde `#0DD375` (logo, sucesso) | o mesmo |
| Acento dos ícones | `#2A86C8` | `#6FB6E6` |

Os tokens estão em `src/index.css` (`:root` e `[data-tema="escuro"]`) e o tom
água em `src/styles/ramos-agua.css` (`html.tom-agua`).

## Letras

Manrope (interface e texto), Barlow Condensed (títulos e números, `.numero-r`),
IBM Plex Mono (dados técnicos). Sem sombra, contorno ou gradiente na letra.

## O que entrou da biblioteca

| Camada | Arquivos no projeto | Onde aparece |
|---|---|---|
| Marca em vetor | `public/ramos/marca/` | logo no topo (negativa à noite), símbolo no celular e no menu lateral |
| Dia e noite | `src/lib/tema.ts`, script no `index.html`, `TemaSeletor.tsx` | menu do perfil |
| Vidro | `src/styles/ramos/vidro.css` | topo, selos de cabeçalho |
| Sistema (vidro compacto) | `src/styles/ramos-telas.css` = `ramos/sistema.css` da biblioteca | botões (`.botao-r`, um `--aceso` por tela), busca, filtros, abas em pílula, janelas, gaveta, menus, avisos, números |
| Efeitos | `src/styles/ramos/efeitos.css`, `public/ramos/efeitos.js` | reflexo nos botões principais, contorno de luz na busca (só no foco), holofote nos grupos de cliente |
| Tipografia | `src/styles/ramos/tipografia.css` | títulos e números |
| Ícones Ramos | `public/ramos/icones-ramos.svg`, `src/components/icones/` | todos os ícones (exceto o Plano Mestre) |
| Transições | `viewTransition` nos links do topo | troca de página |
| Noite das cores fixas | `src/styles/ramos-noite.css` | telas que ainda usam `bg-white` e cinzas |

## Ícones

Um padrão só, `public/ramos/icones-ramos.svg` (prefixo `r-`). O módulo
`src/components/icones/index.ts` mantém os nomes antigos (`Workflow`, `Siren`…)
desenhando o ícone Ramos equivalente; para um novo, use `<IconeRamos nome="…" />`.
Selo de vidro (`.selo-ramos`) nos cabeçalhos de página; ícone simples no resto.
O pacote `lucide-react` fica só por causa do Plano Mestre.

## Peso

CSS novo ≈ 23 KB compactados; `efeitos.js` 2 KB; ícones 30 KB (um arquivo,
em cache); logo horizontal ≈ 35 KB compactados (só a do tema em uso aparece).

## Ficou de fora, de propósito

Fundo animado, fotos de obra e faixas escuras de vitrine (é um sistema de
trabalho, de leitura densa); o vidro forte fica no topo, botões e janelas.
