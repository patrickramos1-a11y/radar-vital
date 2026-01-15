import { logActivity, ActionType } from '@/hooks/useActivityLogs';

// Helper functions for common logging scenarios with human-readable descriptions

export const ActivityLogger = {
  // Priority
  togglePriority: (userName: string, clientName: string, clientId: string, newValue: boolean) => {
    const action = newValue ? 'marcou' : 'removeu';
    const description = `${userName} ${action} ${clientName} como prioridade`;
    logActivity({
      userName,
      actionType: 'TOGGLE_PRIORITY',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: (!newValue).toString(),
      newValue: newValue.toString(),
    });
  },

  // Highlight
  toggleHighlight: (userName: string, clientName: string, clientId: string, newValue: boolean) => {
    const action = newValue ? 'destacou' : 'removeu o destaque de';
    const description = `${userName} ${action} ${clientName}`;
    logActivity({
      userName,
      actionType: 'TOGGLE_HIGHLIGHT',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: (!newValue).toString(),
      newValue: newValue.toString(),
    });
  },

  // Collaborator
  toggleCollaborator: (userName: string, clientName: string, clientId: string, collaborator: string, newValue: boolean) => {
    const collaboratorName = collaborator.charAt(0).toUpperCase() + collaborator.slice(1);
    const action = newValue ? 'adicionou' : 'removeu';
    const description = `${userName} ${action} ${collaboratorName} como responsável por ${clientName}`;
    logActivity({
      userName,
      actionType: 'TOGGLE_COLLABORATOR',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: `${collaborator}: ${!newValue}`,
      newValue: `${collaborator}: ${newValue}`,
    });
  },

  // Client type (AC/AV)
  toggleClientType: (userName: string, clientName: string, clientId: string, oldType: string, newType: string) => {
    const description = `${userName} alterou o tipo de ${clientName} de ${oldType} para ${newType}`;
    logActivity({
      userName,
      actionType: 'TOGGLE_CLIENT_TYPE',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: oldType,
      newValue: newType,
    });
  },

  // Client active status
  toggleActive: (userName: string, clientName: string, clientId: string, newValue: boolean) => {
    const action = newValue ? 'ativou' : 'desativou';
    const description = `${userName} ${action} o cliente ${clientName}`;
    logActivity({
      userName,
      actionType: 'TOGGLE_ACTIVE',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: (!newValue).toString(),
      newValue: newValue.toString(),
    });
  },

  // Selection (checked)
  toggleChecked: (userName: string, clientName: string, clientId: string, newValue: boolean) => {
    const action = newValue ? 'selecionou' : 'desmarcou';
    const description = `${userName} ${action} ${clientName}`;
    logActivity({
      userName,
      actionType: 'TOGGLE_CHECKED',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: (!newValue).toString(),
      newValue: newValue.toString(),
    });
  },

  // Comments
  createComment: (userName: string, clientName: string, clientId: string, commentPreview: string) => {
    const preview = commentPreview.length > 50 ? commentPreview.slice(0, 50) + '...' : commentPreview;
    const description = `${userName} adicionou um comentário em ${clientName}: "${preview}"`;
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

  deleteComment: (userName: string, clientName: string, clientId: string) => {
    const description = `${userName} excluiu um comentário de ${clientName}`;
    logActivity({
      userName,
      actionType: 'DELETE_COMMENT',
      entityType: 'comment',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
    });
  },

  pinComment: (userName: string, clientName: string, clientId: string, isPinned: boolean) => {
    const action = isPinned ? 'fixou' : 'desfixou';
    const description = `${userName} ${action} um comentário em ${clientName}`;
    logActivity({
      userName,
      actionType: 'PIN_COMMENT',
      entityType: 'comment',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
    });
  },

  // Tasks / Jackbox
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

  completeTask: (userName: string, clientName: string, clientId: string, taskTitle: string, completed: boolean) => {
    const action = completed ? 'concluiu' : 'reabriu';
    const description = `${userName} ${action} a tarefa "${taskTitle}" em ${clientName}`;
    logActivity({
      userName,
      actionType: 'COMPLETE_TASK',
      entityType: 'task',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: (!completed).toString(),
      newValue: completed.toString(),
    });
  },

  deleteTask: (userName: string, clientName: string, clientId: string, taskTitle: string) => {
    const description = `${userName} excluiu a tarefa "${taskTitle}" de ${clientName}`;
    logActivity({
      userName,
      actionType: 'DELETE_TASK',
      entityType: 'task',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
    });
  },

  // Imports
  importDemands: (userName: string, count: number, mode: 'quick' | 'complete') => {
    const modeLabel = mode === 'quick' ? 'modo rápido' : 'modo completo';
    const description = `${userName} importou ${count} demanda${count !== 1 ? 's' : ''} via ${modeLabel}`;
    logActivity({
      userName,
      actionType: 'IMPORT_DEMANDS',
      entityType: 'import',
      description,
      newValue: `${count} demandas`,
    });
  },

  importLicenses: (userName: string, count: number, mode: 'quick' | 'complete') => {
    const modeLabel = mode === 'quick' ? 'modo rápido' : 'modo completo';
    const description = `${userName} importou ${count} licença${count !== 1 ? 's' : ''} via ${modeLabel}`;
    logActivity({
      userName,
      actionType: 'IMPORT_LICENSES',
      entityType: 'import',
      description,
      newValue: `${count} licenças`,
    });
  },

  importProcesses: (userName: string, count: number, mode: 'quick' | 'complete') => {
    const modeLabel = mode === 'quick' ? 'modo rápido' : 'modo completo';
    const description = `${userName} importou ${count} processo${count !== 1 ? 's' : ''} via ${modeLabel}`;
    logActivity({
      userName,
      actionType: 'IMPORT_PROCESSES',
      entityType: 'import',
      description,
      newValue: `${count} processos`,
    });
  },

  // Demand status
  updateDemandStatus: (userName: string, clientName: string, demandDesc: string, oldStatus: string, newStatus: string) => {
    const description = `${userName} alterou o status de "${demandDesc.slice(0, 40)}..." de ${oldStatus} para ${newStatus}`;
    logActivity({
      userName,
      actionType: 'UPDATE_DEMAND_STATUS',
      entityType: 'demand',
      entityName: demandDesc.slice(0, 50),
      clientName,
      description,
      oldValue: oldStatus,
      newValue: newStatus,
    });
  },

  // Move client (reorder)
  moveClient: (userName: string, clientName: string, clientId: string, oldPosition: number, newPosition: number) => {
    const description = `${userName} moveu ${clientName} da posição ${oldPosition} para ${newPosition}`;
    logActivity({
      userName,
      actionType: 'MOVE_CLIENT',
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      clientName,
      description,
      oldValue: oldPosition.toString(),
      newValue: newPosition.toString(),
    });
  },
};
