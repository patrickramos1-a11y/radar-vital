import { CollaboratorName } from './client';

export type TVRecorte = 'destaque' | 'responsaveis' | 'comentarios' | 'checklist' | null;
export type TVDensidade = 'compacta' | 'normal' | 'gigante';
export type TVTipoCliente = 'TODOS' | 'AC' | 'AV';
export type TVOrdenacao = 'ordem' | 'nome' | null;

const TV_RECORTES: ReadonlySet<string> = new Set(['destaque', 'responsaveis', 'comentarios', 'checklist']);
const TV_ORDENACOES: ReadonlySet<string> = new Set(['ordem', 'nome']);

/**
 * Cenas salvas antes da remoção da marca de cliente prioritário podem trazer
 * `'prioridade'` (ou outro valor desconhecido): nesses casos a cena fica sem recorte.
 */
export function normalizeTVRecorte(value: unknown): TVRecorte {
  return typeof value === 'string' && TV_RECORTES.has(value) ? (value as TVRecorte) : null;
}

/** Valores desconhecidos (ex.: o antigo `'prioridade'`) voltam para a ordem padrão. */
export function normalizeTVOrdenacao(value: unknown): TVOrdenacao {
  return typeof value === 'string' && TV_ORDENACOES.has(value) ? (value as TVOrdenacao) : 'ordem';
}

export interface TVSceneFilters {
  tipoCliente: TVTipoCliente;
  responsavel: CollaboratorName | null;
  recorte: TVRecorte;
  ordenarPor: TVOrdenacao;
  densidade: TVDensidade;
}

export interface TVScene {
  id: string;
  titulo: string;
  duracaoSegundos: number;
  filtros: TVSceneFilters;
}

export const DEFAULT_TV_SCENES: TVScene[] = [
  {
    id: 'geral',
    titulo: 'Geral',
    duracaoSegundos: 120,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: null,
      recorte: null,
      ordenarPor: 'ordem',
      densidade: 'normal',
    },
  },
  {
    id: 'destaque-geral',
    titulo: 'Pode dar BO (Geral)',
    duracaoSegundos: 120,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: null,
      recorte: 'destaque',
      ordenarPor: null,
      densidade: 'normal',
    },
  },
  {
    id: 'responsaveis-geral',
    titulo: 'Responsáveis (Geral)',
    duracaoSegundos: 120,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: null,
      recorte: 'responsaveis',
      ordenarPor: null,
      densidade: 'normal',
    },
  },
  {
    id: 'comentarios-geral',
    titulo: 'Comentários (Geral)',
    duracaoSegundos: 120,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: null,
      recorte: 'comentarios',
      ordenarPor: null,
      densidade: 'normal',
    },
  },
  {
    id: 'celine-todos',
    titulo: 'Celine (Todos)',
    duracaoSegundos: 150,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: 'celine',
      recorte: null,
      ordenarPor: 'ordem',
      densidade: 'normal',
    },
  },
  {
    id: 'gabi-todos',
    titulo: 'Gabi (Todos)',
    duracaoSegundos: 150,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: 'gabi',
      recorte: null,
      ordenarPor: 'ordem',
      densidade: 'normal',
    },
  },
  {
    id: 'darley-todos',
    titulo: 'Darley (Todos)',
    duracaoSegundos: 150,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: 'darley',
      recorte: null,
      ordenarPor: 'ordem',
      densidade: 'normal',
    },
  },
  {
    id: 'vanessa-todos',
    titulo: 'Vanessa (Todos)',
    duracaoSegundos: 150,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: 'vanessa',
      recorte: null,
      ordenarPor: 'ordem',
      densidade: 'normal',
    },
  },
];
