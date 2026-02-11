
# Ranking Analitico em Cards Visuais

## Resumo

Transformar a barra de ranking atual (texto inline em uma linha) em **cards visuais** individuais, com icones grandes, cores distintas e layout de dashboard, facilitando a leitura rapida.

## Design Visual

Tres cards lado a lado, cada um com:

- Icone grande e colorido no topo
- Titulo do indicador (ex: "Mais Pendencias")
- Nome do colaborador em destaque com a cor dele
- Valor numerico grande (quantidade ou dias)
- Detalhe contextual (empresa, etc.)

Adicionalmente, incluir um **quarto card** mostrando a distribuicao geral por colaborador com mini barras horizontais proporcionais.

```text
+---------------------+  +---------------------+  +---------------------+  +---------------------+
|  /!\ ALERTA         |  |  TROPHY             |  |  CLOCK              |  |  DISTRIBUICAO       |
|                     |  |                     |  |                     |  |                     |
|  Mais Pendencias    |  |  Mais Concluidas    |  |  Mais Antiga        |  |  Celine  ████░ 12   |
|  GABI               |  |  CELINE             |  |  VANESSA            |  |  Gabi    ██████ 21  |
|  21 tarefas         |  |  11 tarefas         |  |  30 dias            |  |  Darley  ██░░░  5   |
|                     |  |                     |  |  PHS DA MATA        |  |  Vanessa ███░░  8   |
+---------------------+  +---------------------+  +---------------------+  +---------------------+
```

## Detalhes Tecnicos

### Arquivo modificado: `src/components/tasks/TaskAnalytics.tsx`

Refatoracao completa do componente:

1. **Layout**: Trocar de `flex items-center` (linha unica) para um `grid grid-cols-2 lg:grid-cols-4` com cards
2. **Cards individuais**: Cada indicador sera um card com bordas arredondadas, fundo sutil colorido, icone grande e tipografia hierarquica
3. **Card de distribuicao**: Quarto card com mini barras horizontais mostrando o volume de tarefas pendentes por colaborador, usando as cores ja definidas em `COLLABORATOR_COLORS`
4. **Responsividade**: 2 colunas em mobile, 4 colunas em desktop
5. **Props**: Manter a mesma interface `TaskAnalyticsProps` -- nenhuma alteracao no componente pai

### Estilo dos cards:

- Fundo: `bg-amber-500/10`, `bg-emerald-500/10`, `bg-red-500/10`, `bg-blue-500/10`
- Bordas: `border border-{color}/20 rounded-xl`
- Icone: `w-8 h-8` com cor forte
- Nome do colaborador: fonte bold, cor do colaborador
- Valor: `text-2xl font-bold`

Nenhuma alteracao de banco de dados ou em outros arquivos.
