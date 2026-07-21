import { logActivity } from '@/hooks/useActivityLogs';

export const ActivityLogger = {
  createComment: (userName: string, clientName: string, clientId: string, commentPreview: string) => {
    const preview = commentPreview.length > 50 ? `${commentPreview.slice(0, 50)}...` : commentPreview;
    const description = `${userName} adicionou um comentario em ${clientName}: "${preview}"`;

    logActivity({
      userName,
      actionType: 'CREATE_COMMENT',
      entityType: 'comment',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
    });
  },

  createTask: (userName: string, clientName: string, clientId: string, taskTitle: string) => {
    const description = `${userName} criou uma tarefa em ${clientName}: "${taskTitle}"`;

    logActivity({
      userName,
      actionType: 'CREATE_TASK',
      entityType: 'task',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
    });
  },
};
