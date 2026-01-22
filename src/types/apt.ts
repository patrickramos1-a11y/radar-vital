// APT (Acompanhamento de Performance de Tarefas) types

export type FeitoResponsavelStatus = 'pendente' | 'executado' | 'nao_realizado';
export type AprovadoGestorStatus = 'pendente' | 'aprovado' | 'nao_aprovado';

export interface AptDemand {
  id: string;
  numero: number;
  setor: string;
  responsavel: string;
  descricao: string;
  feito_responsavel: FeitoResponsavelStatus;
  aprovado_gestor: AprovadoGestorStatus;
  repeticoes: number;
  semana_limite: number;
  mes: number;
  ano: number;
  is_highlighted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AptFilters {
  responsavel: string | null;
  setor: string | null;
  mes: number | null;
  ano: number | null;
  semana_limite: number | null;
  status_responsavel: FeitoResponsavelStatus | null;
  status_gestor: AprovadoGestorStatus | null;
  busca: string;
  apenas_ativos: boolean;
}

export const SETOR_COLORS: Record<string, string> = {
  'ALIMENTAÇÃO': 'hsl(60, 80%, 75%)',
  'AUDITAR': 'hsl(120, 60%, 70%)',
  'SERVIÇO': 'hsl(30, 80%, 70%)',
  'FEEDBACK': 'hsl(200, 70%, 70%)',
  'FINANCEIRO': 'hsl(280, 60%, 75%)',
  'COMERCIAL': 'hsl(340, 70%, 75%)',
  'OPERACIONAL': 'hsl(180, 60%, 70%)',
  'RH': 'hsl(45, 80%, 70%)',
};

export const RESPONSAVEL_COLORS: Record<string, string> = {
  'CELINE': 'hsl(270, 60%, 80%)',
  'GABI': 'hsl(140, 60%, 80%)',
  'DARLEY': 'hsl(30, 70%, 80%)',
  'VANESSA': 'hsl(200, 60%, 80%)',
  'PATRICK': 'hsl(240, 60%, 80%)',
};

export const SEMANA_LABELS: Record<number, string> = {
  1: '1ª SEMANA',
  2: '2ª SEMANA',
  3: '3ª SEMANA',
  4: '4ª SEMANA',
  5: '5ª SEMANA',
};

export const getDefaultFilters = (): AptFilters => ({
  responsavel: null,
  setor: null,
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  semana_limite: null,
  status_responsavel: null,
  status_gestor: null,
  busca: '',
  apenas_ativos: true,
});
