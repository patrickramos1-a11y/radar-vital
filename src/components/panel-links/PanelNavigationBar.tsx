import { useState } from "react";
import { ExternalLink, Settings2, Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, X } from "lucide-react";
import { usePanelLinks } from "@/hooks/usePanelLinks";
import { PanelLink, PanelLinkFormData, PANEL_TYPES } from "@/types/panelLink";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const TYPE_COLORS: Record<string, string> = {
  Operacional: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  Estratégico: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  Diagnóstico: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Relatório: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

export function PanelNavigationBar() {
  const { activeLinks, panelLinks, isLoading, addLink, updateLink, deleteLink } = usePanelLinks();
  const [managerOpen, setManagerOpen] = useState(false);

  if (isLoading) return null;

  // Only show bar if there are active links with URLs
  const linksWithUrl = activeLinks.filter((l) => l.url?.trim());
  const linksWithoutUrl = activeLinks.filter((l) => !l.url?.trim());
  const hasAnyLinks = panelLinks.length > 0;

  return (
    <>
      <div className="flex items-center gap-1.5 px-4 py-1 bg-card/50 border-b border-border">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
          Painéis:
        </span>

        <div className="flex items-center gap-1 flex-wrap flex-1">
          {linksWithUrl.map((link) => (
            <PanelLinkChip key={link.id} link={link} />
          ))}
          {linksWithoutUrl.map((link) => (
            <PanelLinkChipDisabled key={link.id} link={link} />
          ))}
          {linksWithUrl.length === 0 && linksWithoutUrl.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic">
              Nenhum painel configurado
            </span>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setManagerOpen(true)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Gerenciar painéis vinculados
          </TooltipContent>
        </Tooltip>
      </div>

      <PanelLinksManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        panelLinks={panelLinks}
        onAdd={(data) => addLink.mutate(data)}
        onUpdate={(id, data) => updateLink.mutate({ id, data })}
        onDelete={(id) => deleteLink.mutate(id)}
      />
    </>
  );
}

function PanelLinkChip({ link }: { link: PanelLink }) {
  const typeColor = TYPE_COLORS[link.panel_type] || TYPE_COLORS.Operacional;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-all hover:scale-105 hover:shadow-sm cursor-pointer ${typeColor}`}
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[120px]">{link.name}</span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs max-w-[250px]">
        <p className="font-medium">{link.name}</p>
        {link.description && <p className="text-muted-foreground">{link.description}</p>}
        <p className="text-[10px] mt-1 opacity-60">{link.panel_type}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function PanelLinkChipDisabled({ link }: { link: PanelLink }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border text-[11px] font-medium text-muted-foreground opacity-50 cursor-default">
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[120px]">{link.name}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{link.name}</p>
        <p className="text-amber-500 text-[10px]">Link não configurado</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Manager Dialog ──────────────────────────────────────────

interface PanelLinksManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelLinks: PanelLink[];
  onAdd: (data: PanelLinkFormData) => void;
  onUpdate: (id: string, data: Partial<PanelLinkFormData>) => void;
  onDelete: (id: string) => void;
}

function PanelLinksManager({ open, onOpenChange, panelLinks, onAdd, onUpdate, onDelete }: PanelLinksManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formType, setFormType] = useState("Operacional");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormUrl("");
    setFormType("Operacional");
    setFormOrder(0);
    setFormActive(true);
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (link: PanelLink) => {
    setEditingId(link.id);
    setIsAdding(false);
    setFormName(link.name);
    setFormDesc(link.description || "");
    setFormUrl(link.url);
    setFormType(link.panel_type);
    setFormOrder(link.display_order);
    setFormActive(link.is_active);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
    setFormOrder(panelLinks.length + 1);
    setFormActive(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    const data: PanelLinkFormData = {
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      url: formUrl.trim(),
      panel_type: formType,
      display_order: formOrder,
      is_active: formActive,
    };

    if (editingId) {
      onUpdate(editingId, data);
    } else {
      onAdd(data);
    }
    resetForm();
  };

  const sorted = [...panelLinks].sort((a, b) => a.display_order - b.display_order);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Gerenciar Painéis Vinculados
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-2">
            {sorted.map((link) => (
              <div key={link.id}>
                {editingId === link.id ? (
                  <PanelLinkForm
                    name={formName}
                    desc={formDesc}
                    url={formUrl}
                    type={formType}
                    order={formOrder}
                    active={formActive}
                    onNameChange={setFormName}
                    onDescChange={setFormDesc}
                    onUrlChange={setFormUrl}
                    onTypeChange={setFormType}
                    onOrderChange={setFormOrder}
                    onActiveChange={setFormActive}
                    onSave={handleSave}
                    onCancel={resetForm}
                  />
                ) : (
                  <PanelLinkRow
                    link={link}
                    onEdit={() => startEdit(link)}
                    onDelete={() => onDelete(link.id)}
                    onToggleActive={() =>
                      onUpdate(link.id, { is_active: !link.is_active })
                    }
                  />
                )}
              </div>
            ))}

            {isAdding && (
              <PanelLinkForm
                name={formName}
                desc={formDesc}
                url={formUrl}
                type={formType}
                order={formOrder}
                active={formActive}
                onNameChange={setFormName}
                onDescChange={setFormDesc}
                onUrlChange={setFormUrl}
                onTypeChange={setFormType}
                onOrderChange={setFormOrder}
                onActiveChange={setFormActive}
                onSave={handleSave}
                onCancel={resetForm}
              />
            )}
          </div>
        </ScrollArea>

        {!isAdding && !editingId && (
          <Button onClick={startAdd} variant="outline" className="w-full mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Painel
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PanelLinkRow({
  link,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  link: PanelLink;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const typeColor = TYPE_COLORS[link.panel_type] || TYPE_COLORS.Operacional;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${!link.is_active ? 'opacity-50 bg-muted/30' : 'bg-card'}`}>
      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
        {link.display_order}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{link.name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor}`}>
            {link.panel_type}
          </Badge>
        </div>
        {link.url ? (
          <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
        ) : (
          <p className="text-[10px] text-amber-500 italic">Sem link configurado</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggleActive} className="p-1 rounded hover:bg-muted transition-colors">
              {link.is_active ? (
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {link.is_active ? "Desativar" : "Ativar"}
          </TooltipContent>
        </Tooltip>
        <button onClick={onEdit} className="p-1 rounded hover:bg-muted transition-colors">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  );
}

function PanelLinkForm({
  name, desc, url, type, order, active,
  onNameChange, onDescChange, onUrlChange, onTypeChange, onOrderChange, onActiveChange,
  onSave, onCancel,
}: {
  name: string; desc: string; url: string; type: string; order: number; active: boolean;
  onNameChange: (v: string) => void; onDescChange: (v: string) => void;
  onUrlChange: (v: string) => void; onTypeChange: (v: string) => void;
  onOrderChange: (v: number) => void; onActiveChange: (v: boolean) => void;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nome do Painel *</Label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Painel PT"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PANEL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">URL / Link</Label>
        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://exemplo.com/painel"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">Descrição (opcional)</Label>
        <Input
          value={desc}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Breve descrição do painel"
          className="h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Ordem:</Label>
          <Input
            type="number"
            value={order}
            onChange={(e) => onOrderChange(parseInt(e.target.value) || 0)}
            className="h-8 w-16 text-sm text-center"
            min={1}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={onActiveChange} />
          <Label className="text-xs">{active ? "Ativo" : "Inativo"}</Label>
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={onSave} disabled={!name.trim()}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
