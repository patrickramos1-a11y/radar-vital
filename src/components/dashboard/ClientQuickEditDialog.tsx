import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Client, UniversoRamosCategory, generateInitials } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";

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
  collaborators = [],
  linkedCollaboratorIds = [],
}: {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: Client, data: Partial<Client>) => Promise<void>;
  collaborators?: Collaborator[];
  linkedCollaboratorIds?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [category, setCategory] = useState<UniversoRamosCategory | "">("");
  const [collaboratorId, setCollaboratorId] = useState("");
  const [saving, setSaving] = useState(false);

  const availableCollaborators = useMemo(
    () => collaborators.filter((person) => person.isActive && (
      person.id === collaboratorId || !linkedCollaboratorIds.includes(person.id)
    )),
    [collaboratorId, collaborators, linkedCollaboratorIds],
  );
  const selectedCollaborator = collaborators.find((person) => person.id === collaboratorId) ?? null;
  const isCollaboratorCard = client?.clientType === "UNIVERSO_RAMOS" && category === "COLABORADOR";

  useEffect(() => {
    if (!client) return;
    setName(client.name);
    setInitials(client.initials);
    setLogoUrl(client.logoUrl);
    setCategory(client.universeCategory ?? "");
    setCollaboratorId(client.universeCollaboratorId ?? "");
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
    if (isCollaboratorCard && !selectedCollaborator) {
      toast.error("Selecione o perfil do colaborador para vincular este card.");
      return;
    }
    setSaving(true);
    try {
      await onSave(client, {
        name: selectedCollaborator?.name ?? name.trim(),
        initials: selectedCollaborator?.initials ?? (initials.trim() || generateInitials(name.trim())),
        logoUrl: selectedCollaborator?.photoUrl ?? logoUrl,
        universeCategory: client.clientType === "UNIVERSO_RAMOS"
          ? category || null
          : null,
        universeCollaboratorId: isCollaboratorCard ? collaboratorId : null,
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
          {isCollaboratorCard && (
            <p className="border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-900">Este card representa um colaborador. Nome, foto e perfil devem ser mantidos no cadastro de colaboradores para refletirem em todo o sistema.</p>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70" autoFocus disabled={isCollaboratorCard} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Sigla</label>
              <input value={initials} onChange={(event) => setInitials(event.target.value.toUpperCase().slice(0, 2))} className="w-full border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70" maxLength={2} disabled={isCollaboratorCard} />
            </div>
            {client?.clientType === "UNIVERSO_RAMOS" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</label>
                <select value={category} onChange={(event) => { setCategory(event.target.value as UniversoRamosCategory); if (event.target.value !== "COLABORADOR") setCollaboratorId(""); }} className="w-full border bg-background px-3 py-2 text-sm">
                  <option value="">Sem categoria</option>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            )}
          </div>
          {isCollaboratorCard && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Perfil do colaborador</label>
              <select value={collaboratorId} onChange={(event) => {
                const nextId = event.target.value;
                const person = collaborators.find((item) => item.id === nextId);
                setCollaboratorId(nextId);
                if (person) {
                  setName(person.name);
                  setInitials(person.initials);
                  setLogoUrl(person.photoUrl ?? undefined);
                }
              }} className="w-full border bg-background px-3 py-2 text-sm">
                <option value="">Selecione um perfil disponível</option>
                {availableCollaborators.map((person) => <option key={person.id} value={person.id}>{person.name}{person.photoUrl ? "" : " (sem foto)"}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">A lista mostra somente perfis ativos que ainda não estão ligados a outro card, além do perfil já vinculado a este card.</p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Logo ou imagem</label>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center border bg-muted/30">
                {logoUrl ? <img src={logoUrl} alt="Prévia" className="h-full w-full object-contain" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
              </div>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleFile} className="hidden" />
              {!isCollaboratorCard && <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Enviar imagem</Button>}
              {!isCollaboratorCard && logoUrl && <Button type="button" variant="ghost" size="icon" onClick={() => setLogoUrl(undefined)} title="Remover imagem"><X className="h-4 w-4" /></Button>}
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
