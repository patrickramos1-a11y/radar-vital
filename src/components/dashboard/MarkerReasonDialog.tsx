import { useEffect, useState } from "react";
import { Bomb, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MarkerKind = "priority" | "bo";

const PRESET_REASONS: Record<MarkerKind, string[]> = {
  priority: [
    "Comentário importante",
    "Tarefa criada",
    "Risco de prazo",
    "Cliente cobrou retorno",
    "Pendência crítica",
    "Demanda parada",
    "Reunião/decisão necessária",
  ],
  bo: [
    "Cliente insatisfeito",
    "Risco de conflito",
    "Cobrança recorrente",
    "Prazo sensível",
    "Falha de comunicação",
    "Assunto travado",
    "Exige alinhamento urgente",
  ],
};

interface MarkerReasonDialogProps {
  open: boolean;
  kind: MarkerKind;
  defaultValue?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function MarkerReasonDialog({
  open,
  kind,
  defaultValue,
  onOpenChange,
  onConfirm,
}: MarkerReasonDialogProps) {
  const [reason, setReason] = useState(defaultValue || "");
  const isPriority = kind === "priority";
  const title = isPriority ? "Motivo da prioridade" : "Motivo do Pode dar BO";
  const Icon = isPriority ? Star : Bomb;
  const accent = isPriority ? "text-amber-500" : "text-red-500";

  useEffect(() => {
    if (open) setReason(defaultValue || "");
  }, [defaultValue, open]);

  const handleConfirm = () => {
    onConfirm(reason.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[420px] gap-3 rounded-xl p-4 sm:p-4">
        <DialogHeader className="space-y-1 pr-7 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className={cn("h-4 w-4", accent)} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha uma frase pronta ou escreva um motivo curto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            maxLength={120}
            autoFocus
            placeholder="Escreva o motivo..."
            className="min-h-[64px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />

          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_REASONS[kind].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className={cn(
                  "min-h-8 rounded-lg border px-2 py-1 text-left text-[11px] font-medium leading-tight transition-colors",
                  reason === preset
                    ? isPriority
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-red-400 bg-red-50 text-red-700"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:space-x-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "h-9 rounded-lg text-sm font-semibold text-white transition-colors",
              isPriority ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600"
            )}
          >
            Confirmar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
