import { CheckSquare } from 'lucide-react';

interface ChecklistButtonProps {
  activeCount: number;
  onClick: (e: React.MouseEvent) => void;
}

export function ChecklistButton({ activeCount, onClick }: ChecklistButtonProps) {
  const hasActiveTasks = activeCount > 0;

  return (
    <button
      onClick={onClick}
      className={`p-0.5 rounded transition-colors ${
        hasActiveTasks
          ? 'text-amber-500 hover:bg-amber-500/10'
          : 'text-muted-foreground/40 hover:text-muted-foreground'
      }`}
      title={hasActiveTasks ? `${activeCount} tarefa(s) ativa(s)` : 'Sem tarefas'}
    >
      <div className="relative">
        <CheckSquare className="w-3.5 h-3.5" />
        {hasActiveTasks && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[12px] h-[12px] px-0.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </div>
    </button>
  );
}
