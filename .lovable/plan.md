

# Plano: Backlog de Produto - Sistema Radar-Vital

## Resumo Executivo

Implementar um sistema completo de Backlog de Produto para o Radar-Vital, permitindo registro estruturado de melhorias, rastreabilidade de implementacoes e historico de evolucao do sistema. Esta funcionalidade e independente das demandas de clientes e foca exclusivamente no desenvolvimento do proprio produto.

## Arquitetura Geral

```text
+------------------+     +---------------------+     +-------------------+
|   BacklogPage    |     |  useBacklogItems    |     |   Supabase DB     |
|                  |     |                     |     |                   |
| - Lista/Grid     |<--->| - CRUD operations   |<--->| backlog_items     |
| - Filtros/KPIs   |     | - Activity logging  |     | backlog_history   |
| - Detalhes       |     | - File uploads      |     | backlog_impl      |
+------------------+     +---------------------+     | backlog_attach    |
        |                                           +-------------------+
        v                                                   |
+------------------+     +---------------------+             v
| BacklogForm      |     | BacklogDetail       |     +-------------------+
|                  |     |                     |     |  Lovable Storage  |
| - Rich Text      |     | - Historico auto    |     |                   |
| - Multi-select   |     | - Implementacoes    |     | backlog-files     |
| - Anexos         |     | - Anexos viewer     |     +-------------------+
+------------------+     +---------------------+
```

---

## Parte 1: Estrutura de Banco de Dados

### Tabela Principal: `backlog_items`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| titulo | text | Titulo curto e objetivo (obrigatorio) |
| categoria | text | Enum com categorias predefinidas |
| modulos_impactados | text[] | Array de modulos (multi-select) |
| descricao_detalhada | text | Rich text/Markdown |
| status_backlog | text | Status do pipeline |
| prioridade | text | Alta/Media/Baixa |
| impacto_esperado | text | Baixo/Medio/Alto |
| estimativa_esforco | text | Pequeno/Medio/Grande |
| dependente_de_creditos | boolean | Flag para filtro de creditos |
| responsavel_produto | text | Usuario responsavel |
| responsavel_tecnico | text | Usuario tecnico (opcional) |
| data_criacao | timestamptz | Automatico |
| data_inicio_implementacao | date | Quando iniciou |
| data_conclusao | date | Quando concluiu |
| data_lancamento | date | Quando foi lancado |
| created_at | timestamptz | Timestamp de criacao |
| updated_at | timestamptz | Timestamp de atualizacao |

### Categorias (Enum/Check)

- Nova Funcionalidade
- Melhoria de Funcionalidade Existente
- Correcao / Bug
- Ajuste Tecnico / Performance
- UX / UI / Visual
- Relatorios / Indicadores
- Seguranca / Permissoes
- Infraestrutura / Creditos / Limitacoes da Plataforma

### Modulos Impactados (Multi-select)

- Dashboard Geral
- Painel de Demandas
- Jackbox
- Processos
- Licencas
- Filtros e Ordenacoes
- Mobile
- Notificacoes
- Relatorios
- Importacao de Dados
- Configuracoes
- Performance Geral

### Status do Pipeline

- Ideia / Proposta
- Em Analise
- Refinado (Pronto para Implementacao)
- Aguardando Creditos
- Em Implementacao
- Em Testes
- Implementado
- Lancado
- Arquivado

---

### Tabela: `backlog_attachments`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| backlog_item_id | uuid | FK para backlog_items |
| file_name | text | Nome original do arquivo |
| file_url | text | URL no storage |
| file_type | text | MIME type |
| file_size | integer | Tamanho em bytes |
| uploaded_by | text | Nome do usuario |
| created_at | timestamptz | Data de upload |

---

### Tabela: `backlog_history`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| backlog_item_id | uuid | FK para backlog_items |
| event_type | text | Tipo do evento (criacao, status, etc) |
| description | text | Descricao legivel |
| user_name | text | Quem executou |
| old_value | text | Valor anterior (opcional) |
| new_value | text | Novo valor (opcional) |
| created_at | timestamptz | Quando ocorreu |

### Eventos Automaticos

- CREATED: Criacao do item
- STATUS_CHANGED: Mudanca de status
- ATTACHMENT_ADDED: Anexo adicionado
- ATTACHMENT_REMOVED: Anexo removido
- PRIORITY_CHANGED: Prioridade alterada
- DATE_CHANGED: Datas alteradas
- MARKED_IMPLEMENTED: Marcado como implementado
- MARKED_LAUNCHED: Marcado como lancado
- IMPLEMENTATION_ADDED: Registro de implementacao adicionado
- FIELD_UPDATED: Campo generico atualizado

---

### Tabela: `backlog_implementations`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| backlog_item_id | uuid | FK para backlog_items |
| descricao | text | Descricao do ajuste |
| responsavel | text | Quem executou |
| status | text | Executado/Nao Executado |
| data_execucao | date | Quando foi feito |
| created_at | timestamptz | Timestamp |

---

## Parte 2: Storage para Anexos

Criar bucket `backlog-files` no Lovable Storage para armazenar:
- Imagens (prints, mockups)
- PDFs
- Planilhas
- Outros arquivos

Politica: Publico para leitura, autenticado para escrita.

---

## Parte 3: Tipos TypeScript

### Arquivo: `src/types/backlog.ts`

```typescript
export type BacklogCategory = 
  | 'NOVA_FUNCIONALIDADE'
  | 'MELHORIA_EXISTENTE'
  | 'CORRECAO_BUG'
  | 'AJUSTE_TECNICO'
  | 'UX_UI_VISUAL'
  | 'RELATORIOS'
  | 'SEGURANCA'
  | 'INFRAESTRUTURA';

export type BacklogModule = 
  | 'DASHBOARD'
  | 'DEMANDAS'
  | 'JACKBOX'
  | 'PROCESSOS'
  | 'LICENCAS'
  | 'FILTROS'
  | 'MOBILE'
  | 'NOTIFICACOES'
  | 'RELATORIOS'
  | 'IMPORTACAO'
  | 'CONFIGURACOES'
  | 'PERFORMANCE';

export type BacklogStatus = 
  | 'IDEIA'
  | 'EM_ANALISE'
  | 'REFINADO'
  | 'AGUARDANDO_CREDITOS'
  | 'EM_IMPLEMENTACAO'
  | 'EM_TESTES'
  | 'IMPLEMENTADO'
  | 'LANCADO'
  | 'ARQUIVADO';

export type BacklogPriority = 'ALTA' | 'MEDIA' | 'BAIXA';
export type BacklogImpact = 'BAIXO' | 'MEDIO' | 'ALTO';
export type BacklogEffort = 'PEQUENO' | 'MEDIO' | 'GRANDE';

export interface BacklogItem {
  id: string;
  titulo: string;
  categoria: BacklogCategory;
  modulosImpactados: BacklogModule[];
  descricaoDetalhada: string | null;
  statusBacklog: BacklogStatus;
  prioridade: BacklogPriority;
  impactoEsperado: BacklogImpact;
  estimativaEsforco: BacklogEffort;
  dependenteDeCreditos: boolean;
  responsavelProduto: string;
  responsavelTecnico: string | null;
  dataCriacao: string;
  dataInicioImplementacao: string | null;
  dataConclusao: string | null;
  dataLancamento: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BacklogAttachment {
  id: string;
  backlogItemId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface BacklogHistory {
  id: string;
  backlogItemId: string;
  eventType: string;
  description: string;
  userName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface BacklogImplementation {
  id: string;
  backlogItemId: string;
  descricao: string;
  responsavel: string;
  status: 'EXECUTADO' | 'NAO_EXECUTADO';
  dataExecucao: string | null;
  createdAt: string;
}
```

---

## Parte 4: Hook Principal

### Arquivo: `src/hooks/useBacklog.ts`

Funcionalidades:
- `fetchBacklogItems()` - Listar todos os itens
- `addBacklogItem(data)` - Criar novo item
- `updateBacklogItem(id, data)` - Atualizar item (com log automatico)
- `deleteBacklogItem(id)` - Excluir item
- `changeStatus(id, newStatus)` - Mudar status (com log)
- `uploadAttachment(itemId, file)` - Upload de anexo
- `deleteAttachment(attachmentId)` - Remover anexo
- `addImplementation(itemId, data)` - Adicionar registro de implementacao
- `updateImplementation(id, data)` - Atualizar implementacao
- `deleteImplementation(id)` - Remover implementacao
- `getHistory(itemId)` - Buscar historico do item
- Filtros e ordenacao

---

## Parte 5: Componentes de Interface

### Estrutura de Arquivos

```text
src/
  pages/
    Backlog.tsx              # Pagina principal
    BacklogDetail.tsx        # Detalhes de um item
  components/
    backlog/
      BacklogHeader.tsx      # Header com KPIs
      BacklogFilters.tsx     # Filtros e ordenacao
      BacklogCard.tsx        # Card de item na lista
      BacklogForm.tsx        # Formulario criar/editar
      BacklogHistory.tsx     # Timeline de historico
      BacklogAttachments.tsx # Gerenciador de anexos
      BacklogImplementations.tsx # Registros de implementacao
      BacklogTimeline.tsx    # Visao linha do tempo
```

### Pagina Principal: `Backlog.tsx`

Layout:
1. **Header com KPIs**
   - Total de itens
   - Aguardando creditos
   - Em implementacao
   - Implementados
   - Lancados

2. **Barra de Filtros**
   - Busca por texto
   - Filtro por status (tabs ou pills)
   - Filtro por categoria
   - Filtro por modulo
   - Filtro por prioridade
   - Toggle "Dependente de creditos"

3. **Lista/Grid de Itens**
   - Cards compactos com indicadores visuais
   - Status com cores
   - Badges para prioridade e creditos
   - Preview da descricao

4. **Botao Criar Novo**

---

### Pagina de Detalhes: `BacklogDetail.tsx`

Secoes:
1. **Cabecalho**
   - Titulo editavel
   - Status selector
   - Botoes de acao

2. **Informacoes Principais**
   - Categoria
   - Modulos impactados (chips)
   - Prioridade, Impacto, Esforco
   - Responsaveis

3. **Descricao Detalhada**
   - Editor rich text/markdown
   - Placeholder com estrutura sugerida

4. **Datas**
   - Data criacao (readonly)
   - Data inicio implementacao
   - Data conclusao
   - Data lancamento

5. **Anexos**
   - Upload drag-and-drop
   - Lista de arquivos com preview
   - Botao deletar

6. **Registros de Implementacao**
   - Lista de ajustes tecnicos
   - Formulario inline para adicionar
   - Status executado/nao executado

7. **Historico (Timeline)**
   - Lista cronologica de eventos
   - Readonly, automatico
   - Icones por tipo de evento

---

## Parte 6: Navegacao

### Atualizar: `AppSidebar.tsx`

Adicionar item de menu:

```typescript
{
  title: "Backlog",
  icon: ListChecks, // ou Kanban
  href: "/backlog"
}
```

Posicionar no grupo "Sistema" ou criar novo grupo "Desenvolvimento".

---

### Atualizar: `App.tsx`

Adicionar rotas:

```typescript
<Route path="/backlog" element={<Backlog />} />
<Route path="/backlog/:id" element={<BacklogDetail />} />
```

---

## Parte 7: Visao Timeline/Historico do Produto

Componente especial para visualizar:
- Linha do tempo com implementacoes
- Lancamentos por periodo
- Melhorias agrupadas por mes/trimestre

Filtros:
- Por periodo
- Por modulo
- Apenas lancados

---

## Parte 8: Regras de Negocio

1. **Historico automatico**: Qualquer mudanca em campos criticos gera log
2. **Status manual**: Transicoes de status sao manuais, nunca automaticas
3. **Implementado != Lancado**: Sao estados distintos
4. **Arquivar != Excluir**: Arquivado ainda e visivel com filtro
5. **Anexos permanentes**: Ficam vinculados mesmo apos conclusao
6. **Backlog != Clientes**: Nao existe relacao com tabela clients

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/types/backlog.ts` | Tipos TypeScript |
| `src/hooks/useBacklog.ts` | Hook principal CRUD |
| `src/hooks/useBacklogHistory.ts` | Hook para historico |
| `src/pages/Backlog.tsx` | Pagina principal |
| `src/pages/BacklogDetail.tsx` | Pagina de detalhes |
| `src/components/backlog/BacklogHeader.tsx` | Header com KPIs |
| `src/components/backlog/BacklogFilters.tsx` | Filtros |
| `src/components/backlog/BacklogCard.tsx` | Card de item |
| `src/components/backlog/BacklogForm.tsx` | Formulario |
| `src/components/backlog/BacklogHistory.tsx` | Timeline |
| `src/components/backlog/BacklogAttachments.tsx` | Anexos |
| `src/components/backlog/BacklogImplementations.tsx` | Implementacoes |
| `src/components/backlog/BacklogTimeline.tsx` | Visao historica |

## Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/App.tsx` | Adicionar rotas |
| `src/components/layout/AppSidebar.tsx` | Adicionar menu |

---

## Ordem de Implementacao

1. **Fase 1 - Database**
   - Criar tabelas via migration
   - Configurar RLS policies
   - Criar storage bucket

2. **Fase 2 - Tipos e Hook**
   - Criar tipos TypeScript
   - Implementar hook useBacklog
   - Implementar hook useBacklogHistory

3. **Fase 3 - Pagina Principal**
   - BacklogHeader
   - BacklogFilters
   - BacklogCard
   - Pagina Backlog.tsx

4. **Fase 4 - Detalhes**
   - BacklogForm
   - BacklogDetail.tsx
   - Editor de descricao

5. **Fase 5 - Anexos e Historico**
   - BacklogAttachments
   - BacklogHistory
   - Integracao com storage

6. **Fase 6 - Implementacoes**
   - BacklogImplementations
   - Logica de registros

7. **Fase 7 - Timeline e Finalizacao**
   - BacklogTimeline
   - Ajustes visuais
   - Navegacao

---

## Consideracoes de Seguranca

- RLS policies: Todos usuarios autenticados podem ler/escrever
- Historico: Nunca pode ser editado ou excluido
- Arquivos: Armazenados em storage dedicado, nao no banco
- Validacao: Todos os campos obrigatorios validados no frontend e backend

