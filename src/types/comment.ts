export interface ClientComment {
  id: string;
  clientId: string;
  authorUserId?: string;
  authorName: string;
  commentText: string;
  createdAt: string;
  isPinned: boolean;
}

export interface CommentFormData {
  commentText: string;
  authorName?: string;
}
