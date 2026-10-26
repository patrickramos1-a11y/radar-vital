import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { capabilityLevelInsignia, capabilityLevelNames } from "./capabilityJourney";
import type { Collaborator } from "./data";
import { fetchRequests, fetchTeamCertifications } from "./journeyRemote";
import type { PreviewCapability } from "./model";
import { approvedLevels } from "./responsibilityEligibility";

type Props = {
  capabilities: PreviewCapability[];
  collaborators: Collaborator[];
  minimumLevels: Record<string, string>;
  onOpen: (code: string) => void;
  onRequest: (code: string) => void;
  onReview: (code: string) => void;
  onUnlink: (code: string) => void;
};

function requiredLevel(value: string | undefined) {
  return ([1, 2, 3] as const).find((level) => capabilityLevelNames[level] === value);
}

export function ResponsibilityCapabilityCoverage({ capabilities, collaborators, minimumLevels, onOpen, onRequest, onReview, onUnlink }: Props) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const requests = useQuery({
    queryKey: ["master-plan-requests", currentUser?.id, isAdmin],
    queryFn: () => fetchRequests(currentUser!.id, isAdmin),
    enabled: !!currentUser,
    retry: false,
  });
  const teamCertifications = useQuery({ queryKey: ["master-plan-team-certifications"], queryFn: fetchTeamCertifications, enabled: !!currentUser, retry: false });
  const levelsByPerson = new Map(collaborators.map((person) => [
    person.id,
    approvedLevels(requests.data ?? [], person.id, teamCertifications.data ?? []),
  ]));

  return <div className="divide-y border bg-white">
    {capabilities.map((capability) => {
      const holders = collaborators.flatMap((person) => {
        const level = levelsByPerson.get(person.id)?.get(capability.id);
        return level ? [{ id: person.id, level, name: person.name }] : [];
      });
      const ownLevel = currentUser ? levelsByPerson.get(currentUser.id)?.get(capability.id) : undefined;
      const minimumLevel = requiredLevel(minimumLevels[capability.id]);
      const requirementMet = !!minimumLevel && (ownLevel ?? 0) >= minimumLevel;

      return <article key={capability.id} className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <button type="button" onClick={() => onOpen(capability.id)} className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden border bg-zinc-50 p-1 hover:bg-violet-50" aria-label={`Abrir figurinha ${capability.id}: ${capability.title}`}><img src={`/capability-stickers/posters/${capability.id}.png`} alt={`Figurinha ${capability.id}: ${capability.title}`} className="h-full w-full object-contain" loading="lazy" decoding="async" /></button>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => onOpen(capability.id)} className="inline-flex items-center gap-2 text-left text-sm font-semibold text-teal-800 hover:underline">{capability.title}<ArrowRight className="h-4 w-4 shrink-0" /></button>
            <p className="mt-1 text-xs text-zinc-600">Nível necessário: <strong>{minimumLevels[capability.id] ?? "A definir"}</strong></p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-zinc-600">Seu nível:</span>{ownLevel ? <><img src={capabilityLevelInsignia[ownLevel]} alt={`Selo ${capabilityLevelNames[ownLevel]}`} className="h-8 w-8 object-contain" loading="lazy" decoding="async" /><strong className={requirementMet ? "text-emerald-800" : "text-amber-800"}>{capabilityLevelNames[ownLevel]}</strong></> : <strong className="text-amber-800">Nenhum aprovado</strong>}{requirementMet && <span className="inline-flex items-center gap-1 font-semibold text-emerald-800"><ShieldCheck className="h-3.5 w-3.5" /> Capacitação concluída no nível exigido</span>}</div>
          </div>
          {isAdmin && <button type="button" title={`Desvincular ${capability.title}`} aria-label={`Desvincular ${capability.title}`} onClick={() => onUnlink(capability.id)} className="ml-auto text-xs text-zinc-500 underline hover:text-rose-700">Desvincular</button>}
        </div>
        <div className="mt-3 border-l-2 border-teal-200 pl-3 text-xs">
          {!currentUser ? <p className="text-zinc-600">Selecione um perfil para consultar a capacitação.</p>
            : requests.isLoading || teamCertifications.isLoading ? <p className="text-zinc-600">Consultando níveis registrados...</p>
              : requests.error || teamCertifications.error ? <p className="text-amber-800">Níveis certificados indisponíveis. A biblioteca e a prévia visual podem ser consultadas, mas não há confirmação oficial nesta tela.</p>
                : isAdmin ? <><p className="flex items-center gap-1 font-semibold text-zinc-700"><Users className="h-3.5 w-3.5" /> Colaboradores certificados: {holders.length}</p>{holders.length > 0 && <ul className="mt-2 space-y-1">{holders.map((holder) => <li key={holder.id}>{holder.name} · <strong>{capabilityLevelNames[holder.level]}</strong></li>)}</ul>}</>
                  : <p className="flex items-center gap-1 text-zinc-700"><ShieldCheck className="h-3.5 w-3.5" /> {requirementMet ? "Certificação confirmada para esta responsabilidade." : "A certificação precisa alcançar o nível exigido para liberar esta responsabilidade."}</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!requirementMet && <Button size="sm" variant="outline" onClick={() => onRequest(capability.id)}><GraduationCap className="mr-1 h-4 w-4" /> Solicitar capacitação</Button>}
          {isAdmin && <Button size="sm" variant="outline" onClick={() => onReview(capability.id)}>Avaliar pedidos</Button>}
        </div>
      </article>;
    })}
    {capabilities.length === 0 && <p className="p-4 text-sm text-zinc-600">Nenhuma capacidade vinculada.</p>}
  </div>;
}
