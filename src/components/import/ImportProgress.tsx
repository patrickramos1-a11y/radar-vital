import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportProgressProps {
  current: number;
  total: number;
}

export function ImportProgress({ current, total }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h3 className="text-lg font-semibold mb-2">Importando demandas...</h3>
      <p className="text-muted-foreground mb-4">
        {current} de {total} ({percentage}%)
      </p>
      <Progress value={percentage} className="w-64" />
      <p className="text-sm text-muted-foreground mt-4">
        Por favor, aguarde. Não feche esta janela.
      </p>
    </div>
  );
}
