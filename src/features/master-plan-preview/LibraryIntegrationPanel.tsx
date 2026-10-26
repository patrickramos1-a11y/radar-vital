import { useState } from "react";
import { ArrowRight, BookOpen, Building2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sectorUnits, type MasterPlanContext } from "./data";
import {
  isResponsibilityCandidate, newSectorNames, sourceResponsibilities, suggestedSectorId,
} from "./libraryIntegration";
import type { MasterPlanDraft } from "./storage";

type Props = {
  context: MasterPlanContext;
  workspace: MasterPlanDraft;
  focusSectorId?: string;
  busy: boolean;
  createSectors: () => Promise<void>;
  integrate: (selections: Record<string, string>) => Promise<void>;
};

export function LibraryIntegrationPanel({ context, workspace, focusSectorId, busy, createSectors, integrate }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const sectors = sectorUnits(context);
  const focusSector = sectors.find((sector) => sector.id === focusSectorId);
  const missingSectors = newSectorNames.filter((name) => !sectors.some((sector) => sector.name === name));
  const stored = new Map(workspace.responsibilities.map((item) => [item.id, item.sectorId]));
  const selections = Object.fromEntries(sourceResponsibilities
    .filter((item) => isResponsibilityCandidate(item.sourceSector))
    .map((item) => [item.sourceId, overrides[item.sourceId] ?? stored.get(item.sourceId) ?? suggestedSectorId(item.sourceSector, sectors)]));
  const groups = [...new Set(sourceResponsibilities.map((item) => item.sourceSector))];
  const eligible = sourceResponsibilities.filter((item) => isResponsibilityCandidate(item.sourceSector));
  const selectedCount = eligible.filter((item) => selections[item.sourceId]).length;
  const savedCount = eligible.filter((item) => stored.has(item.sourceId)).length;
  const pendingCount = eligible.length - savedCount;
  const hasChanges = eligible.some((item) => selections[item.sourceId] && selections[item.sourceId] !== stored.get(item.sourceId));
  const focusedItems = focusSector ? eligible.filter((item) => !stored.has(item.sourceId) || stored.get(item.sourceId) === focusSector.id) : eligible;
  const [expanded, setExpanded] = useState(Boolean(focusSector) || savedCount === 0);

  return <details className="mb-6 border-l-4 border-teal-600 bg-white" open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-4 marker:hidden">
      <span className="grid h-9 w-9 place-items-center bg-teal-50 text-teal-700"><Link2 className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><strong className="block text-sm">{focusSector ? `Vincular responsabilidades a ${focusSector.name}` : "Vincular a biblioteca aos setores"}</strong><small className="text-xs text-muted-foreground">{savedCount} de {eligible.length} responsabilidades aplicáveis já vinculadas · {pendingCount} aguardam setor</small></span>
      <ArrowRight className="h-4 w-4 shrink-0 text-teal-700" />
    </summary>
    <div className="border-t px-4 pb-5 pt-4">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Os vínculos salvos aparecem na ficha de cada setor. As responsabilidades de Gestão Interna pertencem a Gestão e Planejamento, conforme definido pela Ramos. Categorias amplas sem perfil e a regra transversal não são importadas como responsabilidades individuais.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-y py-3">
        <span className="inline-flex items-center gap-1.5 text-xs"><Building2 className="h-4 w-4 text-teal-700" /> {sectors.length} setores</span>
        <span className="inline-flex items-center gap-1.5 text-xs"><BookOpen className="h-4 w-4 text-violet-700" /> 28 capacidades</span>
        {missingSectors.length > 0 ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void createSectors()} className="ml-auto">Criar {missingSectors.length} setor(es) <ArrowRight className="ml-1 h-4 w-4" /></Button> : <span className="ml-auto text-xs font-medium text-teal-700">Três novos setores cadastrados</span>}
      </div>
      <div className="mt-4 max-h-[540px] space-y-5 overflow-y-auto pr-1">
        {focusSector && focusedItems.length === 0 && <p className="border-l-2 border-amber-500 bg-amber-50 px-3 py-3 text-sm text-amber-900">A planilha não traz uma responsabilidade detalhada para este setor. Cadastre uma responsabilidade própria na ficha do setor; as categorias amplas da fonte ainda precisam ser desdobradas.</p>}
        {groups.map((group) => {
          const items = sourceResponsibilities.filter((item) => item.sourceSector === group
            && (!focusSector || (!stored.has(item.sourceId) && isResponsibilityCandidate(item.sourceSector)) || stored.get(item.sourceId) === focusSector.id));
          if (!items.length) return null;
          const reviewOnly = !isResponsibilityCandidate(group);
          return <section key={group} aria-label={group}>
            <div className="mb-1 flex items-center justify-between border-b pb-2"><h3 className="text-xs font-semibold text-foreground">{group}</h3><span className="text-[11px] text-muted-foreground">{items.length} item(ns)</span></div>
            {reviewOnly ? <p className="px-2 py-2 text-xs text-amber-800">{group.startsWith("Transversal") ? "Regra entre setores: precisa de desenho próprio antes de vincular." : "Categorias amplas sem perfil de capacidades: desdobrar antes de cadastrar responsabilidades."}</p>
              : <div className="divide-y">{items.map((item) => <div key={item.sourceId} className="grid gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,250px)] sm:items-center">
                <div className="min-w-0"><strong className="block break-words text-xs font-medium">{item.title}</strong><span className="text-[11px] text-muted-foreground">{item.requiredCapabilities.length} capacidade(s) exigida(s){stored.has(item.sourceId) ? " · vínculo salvo" : ""}</span></div>
                <select aria-label={`Setor de ${item.title}`} value={selections[item.sourceId] ?? ""} onChange={(event) => setOverrides((current) => ({ ...current, [item.sourceId]: event.target.value }))} className="h-9 min-w-0 border bg-white px-2 text-xs">
                  <option value="" disabled={stored.has(item.sourceId)}>Decidir depois</option>{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
                </select>
              </div>)}</div>}
          </section>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-muted-foreground">{selectedCount} vínculo(s) selecionado(s); os não escolhidos ficam pendentes. Titulares e certificações não são atribuídos.</p><Button type="button" size="sm" disabled={busy || !hasChanges} onClick={() => void integrate(selections)}>Salvar vínculos selecionados</Button></div>
    </div>
  </details>;
}
