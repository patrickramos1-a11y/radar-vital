import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClients } from "@/contexts/ClientContext";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { Client, generateInitials, DEFAULT_COLLABORATORS, DEFAULT_COLLABORATOR_DEMAND_COUNTS, DEFAULT_LICENSE_BREAKDOWN, DEFAULT_PROCESS_BREAKDOWN } from "@/types/client";
import { Landmark, Briefcase, Star, Upload, X, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClientDialog({ open, onOpenChange }: NewClientDialogProps) {
  const { addClient, clients } = useClients();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [clientType, setClientType] = useState<"AC" | "AV">("AC");
  const [isPriority, setIsPriority] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; municipios?: string }>({});

  const reset = () => {
    setName("");
    setInitials("");
    setLogoUrl("");
    setClientType("AC");
    setIsPriority(false);
    setIsActive(true);
    setMunicipios([]);
    setErrors({});
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (municipios.length === 0) errs.municipios = "Selecione ao menos um município";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await addClient({
        name: name.trim(),
        initials: initials.trim() || generateInitials(name.trim()),
        logoUrl: logoUrl || undefined,
        isPriority,
        isActive,
        isChecked: false,
        isHighlighted: false,
        clientType,
        order: clients.length + 1,
        processes: 0,
        processBreakdown: DEFAULT_PROCESS_BREAKDOWN,
        licenses: 0,
        licenseBreakdown: DEFAULT_LICENSE_BREAKDOWN,
        demands: { completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 },
        demandsByCollaborator: DEFAULT_COLLABORATOR_DEMAND_COUNTS,
        collaborators: DEFAULT_COLLABORATORS,
        municipios,
      });
      toast.success("Cliente cadastrado com sucesso!");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Type AC/AV */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Tipo de Cliente *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClientType("AC")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  clientType === "AC" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border bg-card text-muted-foreground hover:border-emerald-500/50"
                }`}
              >
                <Landmark className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-bold text-sm">AC</div>
                  <div className="text-[10px] uppercase tracking-wider">Acompanhamento</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setClientType("AV")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  clientType === "AV" ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-border bg-card text-muted-foreground hover:border-amber-500/50"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-bold text-sm">AV</div>
                  <div className="text-[10px] uppercase tracking-wider">Avulso</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name + Sigla */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome da Empresa *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border text-sm ${errors.name ? "border-destructive" : "border-border"} bg-background`}
                placeholder="Ex: RAMOS ENGENHARIA"
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sigla</label>
              <input
                type="text"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
                placeholder="Auto"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              />
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo</label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative">
                  <img src={logoUrl} alt="" className="w-14 h-14 object-contain rounded-lg border border-border" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Upload className="w-5 h-5" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"
              >
                {logoUrl ? "Trocar logo" : "Enviar logo"}
              </button>
            </div>
          </div>

          {/* Municípios */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Municípios *</label>
            <MunicipiosSelect value={municipios} onChange={setMunicipios} />
            {errors.municipios && <p className="text-xs text-destructive mt-1">{errors.municipios}</p>}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} className="w-4 h-4" />
              <Star className={`w-4 h-4 ${isPriority ? "text-yellow-500 fill-current" : "text-muted-foreground"}`} />
              Prioritário
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
              Ativo no Painel
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => { reset(); onOpenChange(false); }}
              className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Cadastrar Cliente
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MunicipiosSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { municipalities, isLoading } = useMunicipalities();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return municipalities;
    const q = search.toLowerCase();
    return municipalities.filter(m => m.name.toLowerCase().includes(q) || m.state.toLowerCase().includes(q));
  }, [municipalities, search]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof municipalities> = {};
    for (const m of filtered) {
      if (!map[m.state]) map[m.state] = [];
      map[m.state].push(m);
    }
    return map;
  }, [filtered]);

  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter(v => v !== name));
    else onChange([...value, name]);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          className="flex items-center gap-2 cursor-pointer min-h-[40px] px-3 py-2 rounded-md border border-border bg-background"
          onClick={() => setOpen(!open)}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={isLoading ? "Carregando..." : "Buscar município..."}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          <span className="text-xs text-muted-foreground shrink-0">{value.length} selecionado{value.length !== 1 ? "s" : ""}</span>
        </div>
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[220px] overflow-y-auto">
            {Object.keys(grouped).length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Nenhum município encontrado</div>
            ) : (
              Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([state, munis]) => (
                <div key={state}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">{state}</div>
                  {munis.map((m) => {
                    const selected = value.includes(m.name);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.name)}
                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${selected ? "bg-primary/5 text-primary font-medium" : "text-foreground"}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary" : "border-border"}`}>
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(m => (
            <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md border border-primary/20">
              {m}
              <button type="button" onClick={() => toggle(m)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
