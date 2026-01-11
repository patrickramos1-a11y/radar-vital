import { CollaboratorName } from './client';

export interface Task {
  id: string;
  client_id: string;
  title: string;
  completed: boolean;
  assigned_to: CollaboratorName | null;
  created_at: string;
  completed_at: string | null;
}

export type TaskFormData = Pick<Task, 'title' | 'assigned_to'>;
