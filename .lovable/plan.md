
# Plano: Botao de Travamento de Espaco (Fit-All Fixo) no Painel de Clientes

## Resumo

Adicionar um botao de alternancia (toggle) ao lado do seletor de tamanho de grid que permite ao usuario ativar/desativar o modo de "Travamento de Espaco". Quando ativado, todos os cards de clientes serao automaticamente redimensionados para caber em uma area fixa da tela, sem scroll, independentemente da quantidade de clientes.

## Comportamento Esperado

| Estado do Botao | Comportamento |
|-----------------|---------------|
| **Desativado** | Comportamento atual mantido - se o usuario selecionou um grid manual, usa esse tamanho; caso contrario, usa o modo responsivo padrao com scroll vertical |
| **Ativado** | Modo Travamento de Espaco - area do grid tem dimensoes fixas em pixels, todos os cards sao redimensionados automaticamente para caber sem scroll |

## Arquitetura da Solucao

```text
+-------------------+     +------------------+     +-------------------+
|   FilterBar.tsx   |     |   Index.tsx      |     |  ClientGrid.tsx   |
|                   |     |                  |     |                   |
| [Toggle Button]   |---->| fitAllLocked     |---->| Calcula layout    |
| [GridSizePicker]  |     | state            |     | baseado no modo   |
+-------------------+     +------------------+     +-------------------+
                                                          |
                                                          v
                                                   +-------------------+
                                                   |  ClientCard.tsx   |
                                                   |                   |
                                                   | fitAll prop       |
                                                   | (reduz minimos)   |
                                                   +-------------------+
```

## Detalhes Tecnicos

### 1. Novo Tipo e Estado

**Arquivo: `src/components/dashboard/FilterBar.tsx`**

- Adicionar novo tipo de export: `FitAllLocked: boolean`
- Adicionar prop `fitAllLocked` e `onFitAllLockedChange` ao `FilterBarProps`

**Arquivo: `src/pages/Index.tsx`**

- Adicionar estado: `const [fitAllLocked, setFitAllLocked] = useState(false)`
- Passar props para `FilterBar` e `ClientGrid`

### 2. Botao Toggle na FilterBar

**Arquivo: `src/components/dashboard/FilterBar.tsx`**

Adicionar botao de toggle ao lado do `GridSizePicker`:

```text
+-----------------------------------------------+
| [GridSizePicker] [Lock Icon Toggle]           |
|                  ON: verde, icone de cadeado  |
|                  OFF: cinza, icone aberto     |
+-----------------------------------------------+
```

Componentes visuais:
- Icone: `Lock` (ativado) / `LockOpen` (desativado) do Lucide
- Cor: Verde quando ativo, cinza quando inativo
- Tooltip explicativo do modo

### 3. Logica de Layout no ClientGrid

**Arquivo: `src/components/dashboard/ClientGrid.tsx`**

Quando `fitAllLocked` estiver ativo:

1. **Calcular dimensoes fixas do container**: Usar `containerSize` ja existente (largura/altura da viewport menos headers)

2. **Calcular colunas e linhas otimas**:
   - Dimensoes minimas do card: 80px largura x 70px altura (reduzido para permitir mais cards)
   - Gap entre cards: 8px
   - Calcular quantas colunas cabem: `Math.floor((width + gap) / (minWidth + gap))`
   - Calcular quantas linhas sao necessarias: `Math.ceil(clientCount / cols)`
   - Se linhas calculadas excederem o maximo que cabe na altura, aumentar colunas

3. **Aplicar CSS de grid fixo**:
   ```css
   gridTemplateColumns: repeat(cols, 1fr);
   gridTemplateRows: repeat(rows, 1fr);
   overflow: hidden;
   height: 100%;
   ```

4. **Prioridade de modos**:
   - `fitAllLocked` = true: Sempre usa calculo de travamento
   - `gridSize` definido pelo usuario: Usa grid manual
   - Nenhum dos dois: Usa modo responsivo padrao

### 4. Ajustes nos Cards

**Arquivo: `src/components/dashboard/ClientCard.tsx`**

O componente ja possui a prop `fitAll` que:
- Remove minHeights fixos
- Reduz padding interno
- Limita linhas de texto (WebkitLineClamp)

No modo `fitAllLocked`, esta prop sera sempre `true`, permitindo que os cards diminuam o quanto necessario para caber na tela.

### 5. Responsividade

A solucao sera responsiva:
- Em telas menores (tablets), o calculo ajusta automaticamente o numero de colunas
- Em dispositivos moveis, o comportamento atual do `MobileCompactGrid` e mantido (nao afetado)
- O resize da janela recalcula automaticamente o layout

## Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/components/dashboard/FilterBar.tsx` | Adicionar props, botao toggle, imports |
| `src/pages/Index.tsx` | Adicionar estado `fitAllLocked`, passar props |
| `src/components/dashboard/ClientGrid.tsx` | Adicionar logica de layout travado |

## Interface do Usuario

### Botao Toggle (Desativado)
```text
+-------------+  +----+
| 12x2  Grid  |  | 🔓 |  <- Cadeado aberto, cinza
+-------------+  +----+
```

### Botao Toggle (Ativado)
```text
+-------------+  +----+
| 12x2  Grid  |  | 🔒 |  <- Cadeado fechado, verde
+-------------+  +----+
```

### Tooltip
- Desativado: "Ativar Travamento de Espaco - todos os cards cabem na tela sem scroll"
- Ativado: "Desativar Travamento de Espaco - retornar ao modo anterior"

## Transicao Entre Modos

Quando o usuario desativa o `fitAllLocked`:
- Se havia um `gridSize` selecionado antes, volta para esse grid manual
- Se nao havia, volta para o modo responsivo padrao com scroll

A transicao sera suave com `transition-all duration-300` ja existente no grid.

## Consideracoes de Performance

- O calculo de layout usa `useMemo` para evitar recalculos desnecessarios
- O resize da janela usa `debounce` implicito via React state
- Nenhuma chamada adicional ao banco de dados
