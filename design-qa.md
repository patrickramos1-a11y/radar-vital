# Design QA

## Escopo

- Referências: anotações visuais do painel de capacitação e do acervo de capacidades.
- Build avaliado: prévia Vercel do commit `684eb46`.
- Viewports: desktop (1255 x 808) e mobile (390 x 844).

## Verificações

- [x] As três insígnias de nível permanecem em uma única linha por colaborador.
- [x] Níveis conquistados ficam coloridos; níveis ainda não alcançados ficam apagados.
- [x] Os controles de nível não possuem caixas de fundo ou bordas visíveis.
- [x] A solicitação de capacitação aparece somente como ícone de graduação, com nome acessível e tooltip.
- [x] O acervo possui filtros separados por natureza, núcleo e situação.
- [x] O filtro por núcleo altera a coleção preservando capacidades transversais compartilhadas.
- [x] Os itens do acervo não possuem painel branco ou moldura ao redor do conteúdo.
- [x] As figurinhas são maiores e continuam centralizadas sem corte.
- [x] A composição vertical está mais baixa e compacta, sem colisões entre título, figurinha e insígnias.
- [x] Desktop e mobile mantêm leitura, foco e interação coerentes.

## Pendências

Nenhuma ocorrência P0, P1 ou P2. As capacidades propostas que ainda não possuem figurinha usam a capa horizontal existente; isso preserva o acervo disponível sem fabricar uma identidade visual inexistente.

**final result: passed**
