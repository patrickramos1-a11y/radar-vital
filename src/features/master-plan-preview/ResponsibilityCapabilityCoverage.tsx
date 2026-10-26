import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { capabilityLevelNames } from "./capabilityJourney";
import type { Collaborator } from "./data";
import { fetchRequests } from "./journeyRemote";
import type { PreviewCapability } from "./model";

type Props = {
  capabilities: PreviewCapability[];
  collaborators: Collaborator[];
  minimumLevels: Record<string, string>;
  onOpen: (code: string) => void;
  onRequest: (code: string) => void;
  onReview: (code: string) => void;
  onUnlink: (code: string) => void;
};

export function ResponsibilityCapabilityCoverage({ capabilities, collaborators, minimumLevels, onOpen, onRequest, onReview, onUnlink }: Props) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const requests = useQuery({
    queryKey: ["master-plan-requests", currentUser?.id, isAdmin],
    queryFn: () => fetchRequests(currentUser!.id, isAdmin),
    enabled: !!currentUser,
    retry: false,
  });
  const certified = requests.data?.filter((request) => request.status === "approved") ?? [];

  return <div className="divide-y border bg-white">
    {capabilities.map((capability) => {
      const byPerson = new Map<string, number>();
      for (const request of certified.filter((entry) => entry.capability_code === capability.id)) {
        byPerson.set(request.collaborator_id, Math.max(byPerson.get(request.collaborator_id) ?? 0, request.target_level));
      }
      const holders = [...byPerson].map(([id, level]) => ({ id, level, name: collaborators.find((person) => person.id === id)?.name ?? "Colaborador não localizado" }));
      const ownLevel = currentUser ? byPerson.get(currentUser.id) : undefined;
      return <article key={capability.id} className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => onOpen(capability.id)} className="inline-flex items-center gap-2 text-left text-sm font-semibold text-teal-800 hover:underline">{capability.title}<ArrowRight className="h-4 w-4 shrink-0" /></button>
            <p className="mt-1 text-xs text-zinc-600">Nível necessário: <strong>{minimumLevels[capability.id] ?? "A definir"}</strong></p>
          </div>
          {isAdmin && <button type="button" title={`Desvincular ${capability.title}`} aria-label={`Desvincular ${capability.title}`} onClick={() => onUnlink(capability.id)} className="text-xs text-zinc-500 underline hover:text-rose-700">Desvincular</button>}
        </div>
        <div className="mt-3 border-l-2 border-teal-200 pl-3 text-xs">
          {!currentUser ? <p className="text-zinc-600">Selecione um perfil para consultar a capacitação.</p>
            : requests.isLoading ? <p className="text-zinc-600">Consultando níveis registrados...</p>
              : requests.error ? <p className="text-amber-800">Níveis certificados indisponíveis. A biblioteca e a prévia visual podem ser consultadas, mas não há confirmação oficial nesta tela.</p>
                : isAdmin ? <><p className="flex items-center gap-1 font-semibold text-zinc-700"><Users className="h-3.5 w-3.5" /> Colaboradores certificados: {holders.length}</p>
                  {holders.length > 0 && <ul className="mt-2 space-y-1">{holders.map((holder) => <li key={holder.id}>{holder.name} · <strong>{capabilityLevelNames[holder.level]}</strong></li>)}</ul>}</>
                  : <p className="flex items-center gap-1 text-zinc-700"><ShieldCheck className="h-3.5 w-3.5" /> Seu nível: <strong>{ownLevel ? capabilityLevelNames[ownLevel] : "Nenhum aprovado"}</strong></p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onRequest(capability.id)}><GraduationCap className="mr-1 h-4 w-4" /> Solicitar capacitação</Button>
          {isAdmin && <Button size="sm" variant="outline" onClick={() => onReview(capability.id)}>Avaliar pedidos</Button>}
        </div>
      </article>;
    })}
    {capabilities.length === 0 && <p className="p-4 text-sm text-zinc-600">Nenhuma capacidade vinculada.</p>}
  </div>;
}
