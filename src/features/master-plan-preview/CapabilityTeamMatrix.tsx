import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleX, FilterX, GraduationCap, Save, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { capabilityVisual } from "./capabilityVisuals";
import { fetchRequests, fetchTeamCertifications, fetchTeamTrainingRequests, type Library, type TeamCertificationUpdate } from "./journeyRemote";
import { approvedLevels } from "./responsibilityEligibility";

type PlanLevel = 0 | CapabilityLevel;
type Props = {
  library: Library;
  people: Array<{ id: string; name: string }>;
  plans: Record<string, Record<string, PlanLevel>>;
  onApplyUpdates: (updates: TeamCertificationUpdate[]) => Promise<void>;
  onRequestTraining: (collaboratorId: string, capabilityCode: string, level: CapabilityLevel) => Promise<void>;
  onDeactivatePerson?: (collaboratorId: string) => Promise<void>;
};

const assignmentKey = (capabilityCode: string, collaboratorId: string) => `${capabilityCode}:${collaboratorId}`;

function TeamLevelControls({ capabilityTitle, personName, approved, selected, trainingLevel, isTrainingRequested, requesting, onSelect, onRequest, onDiscard }: {
  capabilityTitle: string;
  personName: string;
  approved: number;
  selected: PlanLevel;
  trainingLevel: CapabilityLevel | null;
  isTrainingRequested: boolean;
  requesting: boolean;
  onSelect: (level: CapabilityLevel) => void;
  onRequest: () => void;
  onDiscard: () => void;
}) {
  const effectiveLevel = Math.max(approved, selected);
  const hasDraftUpdate = selected > approved;
  const requestLabel = isTrainingRequested && trainingLevel
    ? `Capacitação para ${capabilityLevelNames[trainingLevel]} solicitada`
    : requesting
      ? "Solicitando capacitação"
      : trainingLevel
        ? `Solicitar ${capabilityLevelNames[trainingLevel]}`
        : "Jornada de certificação concluída";

  return <div className="cap-team-level-control" role="group" aria-label={`Capacidade de ${capabilityTitle} para ${personName}`}>
    <p className={approved > 0 ? "text-xs text-emerald-700" : "text-xs text-zinc-500"}>Capacidade atual: <strong>{approved > 0 ? capabilityLevelNames[approved as CapabilityLevel] : "Nenhuma"}</strong></p>
    <div className="cap-team-level-line">
      {([1, 2, 3] as CapabilityLevel[]).map((level) => {
        const reached = level <= effectiveLevel;
        const certified = level <= approved;
        if (certified) return <span key={level} className="cap-team-level-icon is-reached" title={`${capabilityLevelNames[level]} já conquistado`}><img src={capabilityLevelInsignia[level]} alt={level === approved ? `Nível atual: ${capabilityLevelNames[level]}` : ""} loading="lazy" decoding="async" /></span>;
        return <button
          key={level}
          type="button"
          aria-label={`Conceder ${capabilityLevelNames[level]}`}
          title={certified ? `${capabilityLevelNames[level]} já conquistado` : `Conceder ${capabilityLevelNames[level]}`}
          aria-pressed={selected === level && hasDraftUpdate}
          onClick={() => onSelect(level)}
          className={`cap-team-level-icon ${reached ? "is-reached" : "is-muted"} ${selected === level && hasDraftUpdate ? "is-selected" : ""}`}
        >
          <img src={capabilityLevelInsignia[level]} alt="" loading="lazy" decoding="async" />
        </button>;
      })}
      {approved < 3 && trainingLevel && <button type="button" aria-label={requestLabel} title={requestLabel} disabled={requesting || isTrainingRequested} onClick={onRequest} className={`cap-team-training-icon ${isTrainingRequested ? "is-requested" : ""}`}><GraduationCap aria-hidden="true" /></button>}
      {hasDraftUpdate && <button type="button" onClick={onDiscard} aria-label={`Descartar mudança de ${capabilityTitle} para ${personName}`} title="Descartar mudança" className="cap-team-discard-icon"><CircleX aria-hidden="true" /></button>}
    </div>
    {approved === 3 && <p className="mt-1 text-[10px] font-semibold text-emerald-800">Jornada concluída</p>}
  </div>;
}

export function CapabilityTeamMatrix({ library, people, plans, onApplyUpdates, onRequestTraining, onDeactivatePerson }: Props) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["master-plan-requests", currentUser?.id, true], queryFn: () => fetchRequests(currentUser!.id, true), enabled: !!currentUser, retry: false });
  const teamCertifications = useQuery({ queryKey: ["master-plan-team-certifications"], queryFn: fetchTeamCertifications, enabled: !!currentUser, retry: false });
  const teamTrainingRequests = useQuery({ queryKey: ["master-plan-team-training-requests"], queryFn: fetchTeamTrainingRequests, enabled: !!currentUser, retry: false });
  const [query, setQuery] = useState("");
  const [nature, setNature] = useState("Todas");
  const [filter, setFilter] = useState<"todas" | "planejadas" | "sem-certificacao">("todas");
  const [draft, setDraft] = useState<Record<string, PlanLevel>>({});
  const [applying, setApplying] = useState(false);
  const [requestingKey, setRequestingKey] = useState("");
  const [deactivatingId, setDeactivatingId] = useState("");
  const approvedByPerson = useMemo(() => new Map(people.map((person) => [person.id, approvedLevels(requests.data ?? [], person.id, teamCertifications.data ?? [])])), [people, requests.data, teamCertifications.data]);
  const selectedLevel = (capabilityCode: string, collaboratorId: string): PlanLevel => {
    const key = assignmentKey(capabilityCode, collaboratorId);
    if (key in draft) return draft[key];
    const certified = approvedByPerson.get(collaboratorId)?.get(capabilityCode) ?? 0;
    // Legacy local plans must never hide or lower an official certification.
    return certified > 0 ? certified as PlanLevel : plans[capabilityCode]?.[collaboratorId] ?? 0;
  };
  const pendingUpdates = useMemo<TeamCertificationUpdate[]>(() => library.capabilities.flatMap((capability) => people.flatMap((person) => {
    const current = selectedLevel(capability.code, person.id);
    const certified = approvedByPerson.get(person.id)?.get(capability.code) ?? 0;
    return current > 0 && current !== certified ? [{ collaboratorId: person.id, capabilityCode: capability.code, level: current as CapabilityLevel }] : [];
  })), [approvedByPerson, draft, library.capabilities, people, plans]);
  const list = useMemo(() => library.capabilities.filter((capability) => {
    const matchesText = `${capability.code} ${capability.title}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    const matchesNature = nature === "Todas" || capability.nature === nature;
    const hasPlan = people.some((person) => selectedLevel(capability.code, person.id) > 0);
    const hasCertification = people.some((person) => (approvedByPerson.get(person.id)?.get(capability.code) ?? 0) > 0);
    return matchesText && matchesNature && (filter === "todas" || (filter === "planejadas" ? hasPlan : !hasCertification));
  }), [approvedByPerson, draft, filter, library.capabilities, nature, people, plans, query]);

  const deactivate = async (collaboratorId: string, name: string) => {
    if (!onDeactivatePerson || !window.confirm(`Desativar ${name}? Os planos e as responsabilidades vinculadas a este perfil voltarão a ficar pendentes.`)) return;
    setDeactivatingId(collaboratorId);
    try {
      await onDeactivatePerson(collaboratorId);
    } finally {
      setDeactivatingId("");
    }
  };

  const apply = async () => {
    if (!pendingUpdates.length) return;
    setApplying(true);
    try {
      await onApplyUpdates(pendingUpdates);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["master-plan-team-certifications"] }),
        queryClient.invalidateQueries({ queryKey: ["master-plan-requests"] }),
      ]);
      setDraft({});
      toast.success(`${pendingUpdates.length} certificação(ões) atualizada(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aplicar as atualizações.");
    } finally {
      setApplying(false);
    }
  };

  const requestTraining = async (collaboratorId: string, capabilityCode: string, level: CapabilityLevel) => {
    const key = assignmentKey(capabilityCode, collaboratorId);
    setRequestingKey(key);
    try {
      await onRequestTraining(collaboratorId, capabilityCode, level);
      await queryClient.invalidateQueries({ queryKey: ["master-plan-team-training-requests"] });
      toast.success("Capacitação solicitada para o colaborador.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível solicitar a capacitação.");
    } finally {
      setRequestingKey("");
    }
  };

  if (!currentUser) return <div className="cap-empty">Selecione um perfil de administrador para montar o mapa da equipe.</div>;
  if (requests.isLoading || teamCertifications.isLoading || teamTrainingRequests.isLoading) return <div className="cap-empty">Carregando certificações...</div>;
  if (requests.error || teamCertifications.error || teamTrainingRequests.error) return <div className="cap-empty">Não foi possível carregar as certificações. O painel de capacitação fica bloqueado até a consulta voltar a funcionar.</div>;
  const natures = ["Todas", ...new Set(library.capabilities.map((item) => item.nature))];

  return <section>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div>
        <p className="cap-eyebrow">Capacitação da equipe</p>
        <h1 className="text-2xl font-semibold text-[#172824]">Painel de capacitação</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">Revise a distribuição de níveis da equipe e aplique as mudanças de uma vez. A certificação registrada reflete a decisão aplicada neste painel.</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Revisão em lote</div>
    </div>
    <div className="mb-4 flex flex-wrap gap-2">
      <label className="cap-search-shell max-w-md"><span className="sr-only">Buscar no painel</span><input aria-label="Buscar no painel" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar capacidade ou código" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      <select aria-label="Filtrar natureza no painel" value={nature} onChange={(event) => setNature(event.target.value)} className="h-[52px] border bg-white px-3 text-sm">{natures.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="Filtrar estado no painel" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-[52px] border bg-white px-3 text-sm"><option value="todas">Todas</option><option value="planejadas">Com plano</option><option value="sem-certificacao">Sem certificação</option></select>
      <Button variant="outline" size="sm" onClick={() => { setQuery(""); setNature("Todas"); setFilter("todas"); }}><FilterX className="mr-1 h-4 w-4" /> Limpar</Button>
    </div>
    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600"><Users className="h-4 w-4" /><strong>{people.length}</strong> colaboradores ativos · <strong>{list.length}</strong> capacidades visíveis</div>
    <div className="max-h-[calc(100vh-12rem)] overflow-auto border bg-white">
      <table className="min-w-[1120px] w-full border-collapse text-left">
        <thead><tr className="border-b bg-zinc-50"><th className="sticky left-0 top-0 z-30 min-w-[360px] bg-zinc-50 px-4 py-3 text-xs font-semibold">Capacidade</th>{people.map((person) => <th key={person.id} className="sticky top-0 z-20 min-w-40 bg-zinc-50 px-2 py-3 text-xs font-semibold"><div className="flex items-center justify-between gap-1"><span>{person.name}</span>{onDeactivatePerson && <button type="button" aria-label={`Desativar ${person.name}`} title={`Desativar ${person.name}`} disabled={deactivatingId === person.id} onClick={() => void deactivate(person.id, person.name)} className="grid h-7 w-7 place-items-center border text-zinc-500 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-50"><UserX className="h-3.5 w-3.5" /></button>}</div></th>)}</tr></thead>
        <tbody>{list.map((capability) => {
          const visual = capabilityVisual(capability.code);
          return <tr key={capability.code} className="border-b last:border-0"><th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 align-top"><div className="flex gap-3"><img src={`/capability-stickers/posters/${capability.code}.png`} alt={`Figurinha ${capability.code}: ${capability.title}`} className="h-16 w-16 shrink-0 border bg-white object-contain" loading="lazy" decoding="async" /><div className="min-w-0"><span className="block text-[11px] font-semibold text-teal-700">{capability.code} · {capability.nature}</span><span className="mt-1 block text-sm font-semibold">{capability.title}</span><p className="mt-1 text-xs leading-relaxed text-zinc-600">{capability.summary}</p><p className="mt-1 text-xs leading-relaxed text-zinc-700"><strong>Finalidade:</strong> {visual?.concept ?? capability.summary}</p></div></div></th>{people.map((person) => {
            const approved = approvedByPerson.get(person.id)?.get(capability.code) ?? 0;
            const selected = selectedLevel(capability.code, person.id);
            const key = assignmentKey(capability.code, person.id);
            const nextLevel = approved < 3 ? Math.max(1, approved + 1) as CapabilityLevel : null;
            const trainingRequest = (teamTrainingRequests.data ?? []).find((request) => request.collaborator_id === person.id && request.capability_code === capability.code && request.status !== "cancelled" && request.target_level > approved);
            const trainingLevel = (approved > 0 ? nextLevel : selected || 1) as CapabilityLevel | null;
            const isTrainingRequested = trainingRequest?.status === "requested" || trainingRequest?.status === "started";
            const controls = <TeamLevelControls
              capabilityTitle={capability.title}
              personName={person.name}
              approved={approved}
              selected={selected}
              trainingLevel={trainingLevel}
              isTrainingRequested={isTrainingRequested}
              requesting={requestingKey === key}
              onSelect={(level) => setDraft((current) => ({ ...current, [key]: level }))}
              onRequest={() => trainingLevel && void requestTraining(person.id, capability.code, trainingLevel)}
              onDiscard={() => setDraft((current) => ({ ...current, [key]: approved as PlanLevel }))}
            />;
            return <td key={person.id} className="px-2 py-3 align-top">{controls}</td>;
          })}</tr>;
        })}</tbody>
      </table>
      {!list.length && <div className="p-6 text-center text-sm text-zinc-600">Nenhuma capacidade encontrada com os filtros atuais.</div>}
    </div>
    {pendingUpdates.length > 0 && <div className="fixed bottom-4 left-1/2 z-50 flex w-[min(900px,calc(100vw-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-3 border border-teal-700 bg-white px-4 py-3 shadow-lg"><p className="text-sm text-zinc-700"><strong>{pendingUpdates.length}</strong> atualização(ões) pronta(s) para aplicar.</p><div className="flex gap-2"><Button variant="outline" disabled={applying} onClick={() => setDraft({})}>Descartar</Button><Button disabled={applying} onClick={() => void apply()} className="bg-[#176f68] hover:bg-[#115b55]"><Save className="mr-2 h-4 w-4" />{applying ? "Aplicando..." : "Aplicar atualizações"}</Button></div></div>}
  </section>;
}
