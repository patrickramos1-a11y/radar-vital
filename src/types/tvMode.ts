import { CollaboratorName } from './client';

export type TVRecorte = 'prioridade' | 'destaque' | 'responsaveis' | 'comentarios' | 'checklist' | null;
export type TVDensidade = 'compacta' | 'normal' | 'gigante';
export type TVTipoCliente = 'TODOS' | 'AC' | 'AV';
export type TVOrdenacao = 'ordem' | 'prioridade' | 'nome' | null;

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
    id: 'prioridade-geral',
    titulo: 'Prioridade (Geral)',
    duracaoSegundos: 120,
    filtros: {
      tipoCliente: 'TODOS',
      responsavel: null,
      recorte: 'prioridade',
      ordenarPor: 'prioridade',
      densidade: 'normal',
    },
  },
  {
    id: 'destaque-geral',
    titulo: 'Destaque (Geral)',
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
      ordenarPor: 'prioridade',
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
      ordenarPor: 'prioridade',
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
      ordenarPor: 'prioridade',
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
      ordenarPor: 'prioridade',
      densidade: 'normal',
    },
  },
];
