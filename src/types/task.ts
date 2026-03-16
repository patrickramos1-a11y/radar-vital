export interface Task {
  id: string;
  client_id: string;
  title: string;
  completed: boolean;
  assigned_to: string[];
  created_at: string;
  completed_at: string | null;
}

export type TaskFormData = {
  title: string;
  assigned_to: string[];
};
