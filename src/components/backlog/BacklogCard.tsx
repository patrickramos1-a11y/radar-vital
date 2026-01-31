import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowRight } from 'lucide-react';
import type { BacklogItem } from '@/types/backlog';
import { 
  BACKLOG_STATUS_LABELS, 
  BACKLOG_STATUS_COLORS, 
  BACKLOG_CATEGORY_LABELS,
  BACKLOG_PRIORITY_LABELS,
  BACKLOG_PRIORITY_COLORS,
  BACKLOG_MODULE_LABELS
} from '@/types/backlog';

interface BacklogCardProps {
  item: BacklogItem;
}

export function BacklogCard({ item }: BacklogCardProps) {
  return (
    <Link
      to={`/backlog/${item.id}`}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {item.titulo}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {BACKLOG_CATEGORY_LABELS[item.categoria]}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      {/* Description preview */}
      {item.descricao_detalhada && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {item.descricao_detalhada}
        </p>
      )}

      {/* Modules */}
      {item.modulos_impactados.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.modulos_impactados.slice(0, 3).map((mod) => (
            <Badge key={mod} variant="outline" className="text-[10px] px-1.5 py-0">
              {BACKLOG_MODULE_LABELS[mod]}
            </Badge>
          ))}
          {item.modulos_impactados.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{item.modulos_impactados.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <Badge className={`${BACKLOG_STATUS_COLORS[item.status_backlog]} text-white text-[10px] px-2`}>
            {BACKLOG_STATUS_LABELS[item.status_backlog]}
          </Badge>

          {/* Priority Badge */}
          <Badge className={`${BACKLOG_PRIORITY_COLORS[item.prioridade]} text-white text-[10px] px-2`}>
            {BACKLOG_PRIORITY_LABELS[item.prioridade]}
          </Badge>
        </div>

        {/* Credits indicator */}
        {item.dependente_de_creditos && (
          <div className="flex items-center gap-1 text-amber-500">
            <Coins className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Créditos</span>
          </div>
        )}
      </div>
    </Link>
  );
}
