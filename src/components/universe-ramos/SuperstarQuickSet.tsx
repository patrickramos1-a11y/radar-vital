import { useRef, useState } from "react";
import { Check, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Challenge } from "@/types/challenge";

interface Props {
  challenge: Challenge;
  onSave: (amount: number) => Promise<boolean>;
  className?: string;
}

// Inline (no modal) Super Star quick setter used in the challenge library cards.
export function SuperstarQuickSet({ challenge, onSave, className }: Props) {
  const hasReward = challenge.rewardSuperstars > 0;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(Math.max(1, challenge.rewardSuperstars || 1)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const amount = Number(value);
  const openEditor = () => {
    setValue(String(Math.max(1, challenge.rewardSuperstars || 1)));
    setError(null);
    setOpen(true);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
  };

  const step = (delta: number) => {
    setError(null);
    setValue((current) => String(Math.max(1, (Number(current) || 1) + delta)));
  };

  const confirm = async () => {
    if (!Number.isInteger(amount) || amount < 1) {
      setError("Informe um número inteiro maior ou igual a 1.");
      return;
    }
    setSaving(true);
    setError(null);
    const done = await onSave(amount);
    setSaving(false);
    if (done) setOpen(false);
    else setError("Não foi possível salvar. Tente novamente.");
  };

  if (!open) {
    return (
      <Button
        size="sm"
        className={`bg-amber-400 text-amber-950 hover:bg-amber-500 ${className ?? ""}`}
        title={hasReward ? "Ajustar a quantidade de Super Estrelas" : "Definir Super Estrelas e ativar o desafio"}
        aria-label={hasReward ? "Ajustar Super Estrelas" : "Definir Super Estrelas"}
        onClick={openEditor}
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        {hasReward ? "Ajustar Super Estrelas" : "Definir Super Estrelas"}
      </Button>
    );
  }

  return (
    <div className={`w-full space-y-2 border border-amber-300 bg-amber-50 p-2 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
        <span className="sr-only">Quantidade de Super Estrelas</span>
        <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0 bg-background" title="Diminuir uma Super Estrela" aria-label="Diminuir uma Super Estrela" disabled={saving || amount <= 1} onClick={() => step(-1)}>
          <Minus className="h-4 w-4" aria-hidden />
        </Button>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={1}
          step={1}
          aria-label="Quantidade de Super Estrelas"
          className="h-9 min-w-0 flex-1 border bg-background text-center text-base font-semibold"
          value={value}
          disabled={saving}
          onFocus={() => window.setTimeout(() => inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
          onChange={(event) => { setValue(event.target.value); setError(null); }}
        />
        <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0 bg-background" title="Aumentar uma Super Estrela" aria-label="Aumentar uma Super Estrela" disabled={saving} onClick={() => step(1)}>
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
        <Button type="button" size="icon" className="h-9 w-9 shrink-0 bg-amber-400 text-amber-950 hover:bg-amber-500" title="Confirmar Super Estrelas" aria-label="Confirmar Super Estrelas" disabled={saving} onClick={() => void confirm()}>
          <Check className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-amber-900">{saving ? "Salvando..." : challenge.status === "draft" ? "Ao confirmar, o desafio fica ATIVO no mural." : "Ajuste a quantidade deste desafio ativo."}</p>
        <button type="button" className="text-[11px] underline" disabled={saving} onClick={() => { setOpen(false); setError(null); }}>Cancelar</button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
