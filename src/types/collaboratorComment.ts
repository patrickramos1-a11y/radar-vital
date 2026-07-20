export type CollaboratorCommentContext = 'observacao' | 'conduta' | 'entrega' | 'reconhecimento' | 'ponto_conversa';

export const COLLAB_COMMENT_CONTEXT_LABELS: Record<CollaboratorCommentContext, string> = {
  observacao: 'Observação',
  conduta: 'Conduta',
  entrega: 'Entrega',
  reconhecimento: 'Reconhecimento',
  ponto_conversa: 'Ponto p/ conversar',
};

export const COLLAB_COMMENT_CONTEXT_COLORS: Record<CollaboratorCommentContext, string> = {
  observacao: '#6B7280',
  conduta: '#DC2626',
  entrega: '#6B9B37',
  reconhecimento: '#F59E0B',
  ponto_conversa: '#3B82F6',
};

export interface CollaboratorComment {
  id: string;
  collaborator_name: string;
  author_name: string;
  comment_text: string;
  context: CollaboratorCommentContext;
  is_read: boolean;
  read_at: string | null;
  read_by: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaboratorCommentFormData {
  collaborator_name: string;
  comment_text: string;
  context: CollaboratorCommentContext;
}
