export interface Task {
  id: string;
  client_id: string;
  title: string;
  completed: boolean;
  assigned_to: string | null;
  created_at: string;
  completed_at: string | null;
}

export type TaskFormData = Pick<Task, 'title' | 'assigned_to'>;
