export type ReadStatusName = 'celine' | 'gabi' | 'darley' | 'vanessa' | 'patrick';

export const READ_STATUS_NAMES: ReadStatusName[] = ['patrick', 'celine', 'gabi', 'darley', 'vanessa'];

export type CommentType = 'informativo' | 'relevante' | 'ciencia';

export const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  informativo: 'Informativo',
  relevante: 'Relevante',
  ciencia: 'Ciência Obrigatória',
};

export interface ClientComment {
  id: string;
  clientId: string;
  authorUserId?: string;
  authorName: string;
  commentText: string;
  createdAt: string;
  isPinned: boolean;
  readStatus: Record<ReadStatusName, boolean>;
  commentType: CommentType;
  requiredReaders: string[];
  readTimestamps: Record<string, string>;
  isClosed: boolean;
  closedBy?: string;
  closedAt?: string;
  isEdited: boolean;
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string;
  replyToId?: string;
}

export interface CommentFormData {
  commentText: string;
  authorName?: string;
  commentType: CommentType;
  requiredReaders: string[];
  replyToId?: string;
}
