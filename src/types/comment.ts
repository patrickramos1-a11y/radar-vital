export type ReadStatusName = 'celine' | 'gabi' | 'darley' | 'vanessa' | 'patrick';

export const READ_STATUS_NAMES: ReadStatusName[] = ['patrick', 'celine', 'gabi', 'darley', 'vanessa'];

export interface ClientComment {
  id: string;
  clientId: string;
  authorUserId?: string;
  authorName: string;
  commentText: string;
  createdAt: string;
  isPinned: boolean;
  readStatus: Record<ReadStatusName, boolean>;
}

export interface CommentFormData {
  commentText: string;
  authorName?: string;
}
