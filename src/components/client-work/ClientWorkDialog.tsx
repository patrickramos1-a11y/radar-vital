import {
  TaskModal,
  type TaskModalProps,
} from "@/components/checklist/TaskModal";

export type ClientWorkDialogProps = TaskModalProps;

export function ClientWorkDialog(props: ClientWorkDialogProps) {
  return <TaskModal {...props} />;
}
