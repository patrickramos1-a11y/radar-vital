import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Client, UniversoRamosCategory, generateInitials } from "@/types/client";

const categories: { value: UniversoRamosCategory; label: string }[] = [
  { value: "EMPRESA", label: "Empresa" },
  { value: "SETOR", label: "Setor" },
  { value: "COLABORADOR", label: "Colaborador" },
  { value: "PROJETO", label: "Projeto / Painel" },
];

export function ClientQuickEditDialog({
  client,
  open,
  onOpenChange,
  onSave,
}: {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: Client, data: Partial<Client>) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [category, setCategory] = useState<UniversoRamosCategory | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    setName(client.name);
    setInitials(client.initials);
    setLogoUrl(client.logoUrl);
    setCategory(client.universeCategory ?? "");
  }, [client]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!client || !name.trim()) return;
    setSaving(true);
    try {
      await onSave(client, {
        name: name.trim(),
        initials: initials.trim() || generateInitials(name.trim()),
        logoUrl,
        universeCategory: client.clientType === "UNIVERSO_RAMOS" ? category || null : null,
      });
      toast.success("Cadastro atualizado");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Editar cadastro</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full border bg-background px-3 py-2 text-sm" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Sigla</label>
              <input value={initials} onChange={(event) => setInitials(event.target.value.toUpperCase().slice(0, 2))} className="w-full border bg-background px-3 py-2 text-sm" maxLength={2} />
            </div>
            {client?.clientType === "UNIVERSO_RAMOS" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</label>
                <select value={category} onChange={(event) => setCategory(event.target.value as UniversoRamosCategory)} className="w-full border bg-background px-3 py-2 text-sm">
                  <option value="">Sem categoria</option>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Logo ou imagem</label>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center border bg-muted/30">
                {logoUrl ? <img src={logoUrl} alt="Prévia" className="h-full w-full object-contain" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
              </div>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleFile} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Enviar imagem</Button>
              {logoUrl && <Button type="button" variant="ghost" size="icon" onClick={() => setLogoUrl(undefined)} title="Remover imagem"><X className="h-4 w-4" /></Button>}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !name.trim()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
