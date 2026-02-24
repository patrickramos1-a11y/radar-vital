// =============================================
// TIPOS DO BACKLOG DE PRODUTO - RADAR-VITAL
// =============================================

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

export type BacklogEventType = 
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REMOVED'
  | 'PRIORITY_CHANGED'
  | 'DATE_CHANGED'
  | 'MARKED_IMPLEMENTED'
  | 'MARKED_LAUNCHED'
  | 'IMPLEMENTATION_ADDED'
  | 'IMPLEMENTATION_REMOVED'
  | 'FIELD_UPDATED';

export interface BacklogItem {
  id: string;
  titulo: string;
  categoria: BacklogCategory;
  modulos_impactados: BacklogModule[];
  descricao_detalhada: string | null;
  status_backlog: BacklogStatus;
  prioridade: BacklogPriority;
  impacto_esperado: BacklogImpact;
  estimativa_esforco: BacklogEffort;
  dependente_de_creditos: boolean;
  responsavel_produto: string;
  responsavel_tecnico: string | null;
  data_criacao: string;
  data_inicio_implementacao: string | null;
  data_conclusao: string | null;
  data_lancamento: string | null;
  created_at: string;
  updated_at: string;
}

export interface BacklogAttachment {
  id: string;
  backlog_item_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface BacklogHistory {
  id: string;
  backlog_item_id: string;
  event_type: BacklogEventType;
  description: string;
  user_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface BacklogImplementation {
  id: string;
  backlog_item_id: string;
  descricao: string;
  responsavel: string;
  status: 'EXECUTADO' | 'NAO_EXECUTADO';
  data_execucao: string | null;
  created_at: string;
}

// Labels para exibição
export const BACKLOG_CATEGORY_LABELS: Record<BacklogCategory, string> = {
  NOVA_FUNCIONALIDADE: 'Nova Funcionalidade',
  MELHORIA_EXISTENTE: 'Melhoria de Funcionalidade',
  CORRECAO_BUG: 'Correção / Bug',
  AJUSTE_TECNICO: 'Ajuste Técnico / Performance',
  UX_UI_VISUAL: 'UX / UI / Visual',
  RELATORIOS: 'Relatórios / Indicadores',
  SEGURANCA: 'Segurança / Permissões',
  INFRAESTRUTURA: 'Infraestrutura / Créditos'
};

export const BACKLOG_MODULE_LABELS: Record<BacklogModule, string> = {
  DASHBOARD: 'Dashboard Geral',
  DEMANDAS: 'Painel de Demandas',
  JACKBOX: 'Tarefas',
  PROCESSOS: 'Processos',
  LICENCAS: 'Licenças',
  FILTROS: 'Filtros e Ordenações',
  MOBILE: 'Mobile',
  NOTIFICACOES: 'Notificações',
  RELATORIOS: 'Relatórios',
  IMPORTACAO: 'Importação de Dados',
  CONFIGURACOES: 'Configurações',
  PERFORMANCE: 'Performance Geral'
};

export const BACKLOG_STATUS_LABELS: Record<BacklogStatus, string> = {
  IDEIA: 'Ideia / Proposta',
  EM_ANALISE: 'Em Análise',
  REFINADO: 'Refinado (Pronto)',
  AGUARDANDO_CREDITOS: 'Aguardando Créditos',
  EM_IMPLEMENTACAO: 'Em Implementação',
  EM_TESTES: 'Em Testes',
  IMPLEMENTADO: 'Implementado',
  LANCADO: 'Lançado',
  ARQUIVADO: 'Arquivado'
};

export const BACKLOG_STATUS_COLORS: Record<BacklogStatus, string> = {
  IDEIA: 'bg-slate-500',
  EM_ANALISE: 'bg-blue-500',
  REFINADO: 'bg-cyan-500',
  AGUARDANDO_CREDITOS: 'bg-amber-500',
  EM_IMPLEMENTACAO: 'bg-purple-500',
  EM_TESTES: 'bg-orange-500',
  IMPLEMENTADO: 'bg-green-500',
  LANCADO: 'bg-emerald-600',
  ARQUIVADO: 'bg-gray-400'
};

export const BACKLOG_PRIORITY_LABELS: Record<BacklogPriority, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa'
};

export const BACKLOG_PRIORITY_COLORS: Record<BacklogPriority, string> = {
  ALTA: 'bg-red-500',
  MEDIA: 'bg-yellow-500',
  BAIXA: 'bg-green-500'
};

export const BACKLOG_IMPACT_LABELS: Record<BacklogImpact, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto'
};

export const BACKLOG_EFFORT_LABELS: Record<BacklogEffort, string> = {
  PEQUENO: 'Pequeno',
  MEDIO: 'Médio',
  GRANDE: 'Grande'
};

export const BACKLOG_EVENT_LABELS: Record<BacklogEventType, string> = {
  CREATED: 'Criado',
  STATUS_CHANGED: 'Status alterado',
  ATTACHMENT_ADDED: 'Anexo adicionado',
  ATTACHMENT_REMOVED: 'Anexo removido',
  PRIORITY_CHANGED: 'Prioridade alterada',
  DATE_CHANGED: 'Data alterada',
  MARKED_IMPLEMENTED: 'Marcado como implementado',
  MARKED_LAUNCHED: 'Marcado como lançado',
  IMPLEMENTATION_ADDED: 'Implementação adicionada',
  IMPLEMENTATION_REMOVED: 'Implementação removida',
  FIELD_UPDATED: 'Campo atualizado'
};

// Interface para criação de item
export interface BacklogItemCreate {
  titulo: string;
  categoria: BacklogCategory;
  modulos_impactados: BacklogModule[];
  descricao_detalhada?: string;
  status_backlog?: BacklogStatus;
  prioridade?: BacklogPriority;
  impacto_esperado?: BacklogImpact;
  estimativa_esforco?: BacklogEffort;
  dependente_de_creditos?: boolean;
  responsavel_produto: string;
  responsavel_tecnico?: string;
}

// Interface para atualização de item
export interface BacklogItemUpdate extends Partial<BacklogItemCreate> {
  data_inicio_implementacao?: string | null;
  data_conclusao?: string | null;
  data_lancamento?: string | null;
}

// Interface para filtros
export interface BacklogFilters {
  search: string;
  status: BacklogStatus | 'TODOS';
  categoria: BacklogCategory | 'TODOS';
  modulo: BacklogModule | 'TODOS';
  prioridade: BacklogPriority | 'TODOS';
  dependenteDeCreditos: boolean | null;
}

// Interface para KPIs
export interface BacklogKPIs {
  total: number;
  aguardandoCreditos: number;
  emImplementacao: number;
  implementados: number;
  lancados: number;
}
