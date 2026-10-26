import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import type { PreviewCapability, PreviewResponsibility } from "./model";
import { fetchRequests, fetchTeamCertifications } from "./journeyRemote";
import { approvedLevels, responsibilityRequirements, unmetRequirements, type ResponsibilityRequirement } from "./responsibilityEligibility";

type SourceRequirements = Record<string, ResponsibilityRequirement[]>;

function useEligibility(requirements: ResponsibilityRequirement[]) {
  const { currentUser } = useAuth();
  const requests = useQuery({
    queryKey: ["master-plan-requests", currentUser?.id, false],
    queryFn: () => fetchRequests(currentUser!.id, false),
    enabled: !!currentUser,
    retry: false,
  });
  const teamCertifications = useQuery({ queryKey: ["master-plan-team-certifications"], queryFn: fetchTeamCertifications, enabled: !!currentUser, retry: false });
  const levels = currentUser ? approvedLevels(requests.data ?? [], currentUser.id, teamCertifications.data ?? []) : new Map<string, number>();
  return { currentUser, requests, teamCertifications, unmet: unmetRequirements(requirements, levels) };
}

type ClaimProps = { requirements: ResponsibilityRequirement[]; capabilityNames: Map<string, string>; onRequest: () => void; requestedBy: string[] };

export function ResponsibilityClaimControl({ requirements, capabilityNames, onRequest, requestedBy }: ClaimProps) {
  const { currentUser, requests, teamCertifications, unmet } = useEligibility(requirements);
  if (!currentUser) return <p className="text-xs text-muted-foreground">Selecione um perfil para confirmar as capacitações exigidas.</p>;
  if (requests.isLoading || teamCertifications.isLoading) return <p className="text-xs text-muted-foreground">Conferindo capacitações aprovadas...</p>;
  if (requests.error || teamCertifications.error) return <p className="text-xs text-amber-800">Não foi possível confirmar as capacitações. A solicitação permanece bloqueada até a consulta voltar a funcionar.</p>;
  if (requestedBy.includes(currentUser.id)) return <p className="text-xs text-sky-800">Pedido de responsabilidade já registrado para este perfil.</p>;
  if (unmet.length) return <><p className="text-xs text-muted-foreground">Disponível depois de concluir: {unmet.map((item) => `${capabilityNames.get(item.capabilityCode) ?? item.capabilityCode} (${item.minimumLevel})`).join(", ")}.</p><Button size="sm" variant="outline" disabled>Solicitar responsabilidade</Button></>;
  return <><p className="flex items-center gap-1 text-xs text-emerald-800"><ShieldCheck className="h-3.5 w-3.5" /> Todas as capacitações mínimas foram concluídas.</p><Button size="sm" variant="outline" onClick={onRequest}>Solicitar responsabilidade</Button></>;
}

type AvailabilityProps = {
  responsibilities: PreviewResponsibility[];
  capabilities: PreviewCapability[];
  sourceRequirements: SourceRequirements;
  grantedResponsibilityIds?: ReadonlySet<string>;
  onOpen: (id: string) => void;
  onRequest: (id: string) => void;
};

export function ResponsibilityAvailability({ responsibilities, capabilities, sourceRequirements, grantedResponsibilityIds = new Set(), onOpen, onRequest }: AvailabilityProps) {
  const names = new Map(capabilities.map((item) => [item.id, item.title]));
  const { currentUser, requests, teamCertifications } = useEligibility([]);
  const levels = currentUser ? approvedLevels(requests.data ?? [], currentUser.id, teamCertifications.data ?? []) : new Map<string, number>();
  if (!currentUser) return <div className="border bg-white p-4 text-sm text-muted-foreground">Selecione um perfil no Radar Vital para ver quais responsabilidades já pode solicitar.</div>;
  if (requests.isLoading || teamCertifications.isLoading) return <div className="border bg-white p-4 text-sm text-muted-foreground">Conferindo capacitações aprovadas...</div>;
  if (requests.error || teamCertifications.error) return <div className="border bg-amber-50 p-4 text-sm text-amber-950">Não foi possível consultar as capacitações aprovadas. Nenhuma responsabilidade é liberada sem essa confirmação.</div>;
  const eligible = responsibilities.filter((item) => !unmetRequirements(responsibilityRequirements(item, sourceRequirements[item.id]), levels).length);
  const available = eligible.filter((item) => !grantedResponsibilityIds.has(item.id));
  const pending = responsibilities.filter((item) => !eligible.includes(item) && !grantedResponsibilityIds.has(item.id));
  const render = (item: PreviewResponsibility, ready: boolean) => {
    const requirements = responsibilityRequirements(item, sourceRequirements[item.id]);
    const missing = unmetRequirements(requirements, levels);
    return <article key={item.id} className="border-l-4 border-orange-500 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><button type="button" onClick={() => onOpen(item.id)} className="text-left text-sm font-semibold hover:text-orange-700">{item.title}</button><p className="mt-1 text-xs text-muted-foreground">{requirements.length ? requirements.map((entry) => `${names.get(entry.capabilityCode) ?? entry.capabilityCode} · nível ${entry.minimumLevel}`).join("; ") : "Sem pré-requisito de capacitação cadastrado."}</p></div>{ready && <span className="shrink-0 text-xs font-semibold text-emerald-700">Disponível</span>}</div>{ready ? <Button size="sm" variant="outline" className="mt-3" onClick={() => onRequest(item.id)}>Solicitar responsabilidade <ArrowRight className="ml-1 h-4 w-4" /></Button> : <p className="mt-3 flex items-start gap-1 text-xs text-muted-foreground"><GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Falta concluir: {missing.map((entry) => names.get(entry.capabilityCode) ?? entry.capabilityCode).join(", ")}.</p>}</article>;
  };
  return <><div className="mb-4 border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"><strong>{available.length}</strong> responsabilidade(s) disponível(is) para {currentUser.name}. A liberação considera somente certificações aprovadas.</div><section><h3 className="mb-3 text-sm font-semibold">Disponíveis para solicitar</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{available.map((item) => render(item, true))}</div>{!available.length && <p className="border bg-white p-4 text-sm text-muted-foreground">Conclua as capacitações mínimas para liberar responsabilidades.</p>}</section><section className="mt-7"><h3 className="mb-3 text-sm font-semibold">Em desenvolvimento ({pending.length})</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pending.map((item) => render(item, false))}</div></section></>;
}
