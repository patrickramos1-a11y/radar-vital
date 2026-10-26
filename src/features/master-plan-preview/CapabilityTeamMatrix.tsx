import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleX, FilterX, Users, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { capabilityCoverPath, capabilityVisual } from "./capabilityVisuals";
import { fetchRequests, type Library } from "./journeyRemote";
import { approvedLevels } from "./responsibilityEligibility";

type PlanLevel = 0 | CapabilityLevel;
type Props = {
  library: Library;
  people: Array<{ id: string; name: string }>;
  plans: Record<string, Record<string, PlanLevel>>;
  onPlanChange: (capabilityCode: string, collaboratorId: string, level: PlanLevel) => void;
  onDeactivatePerson?: (collaboratorId: string) => Promise<void>;
};

const levelStyles: Record<CapabilityLevel, { idle: string; active: string }> = {
  1: { idle: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100", active: "border-sky-600 bg-sky-600 text-white" },
  2: { idle: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100", active: "border-amber-500 bg-amber-500 text-white" },
  3: { idle: "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100", active: "border-violet-600 bg-violet-600 text-white" },
};

export function CapabilityTeamMatrix({ library, people, plans, onPlanChange, onDeactivatePerson }: Props) {
  const { currentUser } = useAuth();
  const requests = useQuery({ queryKey: ["master-plan-requests", currentUser?.id, true], queryFn: () => fetchRequests(currentUser!.id, true), enabled: !!currentUser, retry: false });
  const [query, setQuery] = useState("");
  const [nature, setNature] = useState("Todas");
  const [filter, setFilter] = useState<"todas" | "planejadas" | "sem-certificacao">("todas");
  const [deactivatingId, setDeactivatingId] = useState("");
  const approvedByPerson = useMemo(() => new Map(people.map((person) => [person.id, approvedLevels(requests.data ?? [], person.id)])), [people, requests.data]);
  const list = useMemo(() => library.capabilities.filter((capability) => {
    const matchesText = `${capability.code} ${capability.title}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    const matchesNature = nature === "Todas" || capability.nature === nature;
    const hasPlan = people.some((person) => (plans[capability.code]?.[person.id] ?? 0) > 0);
    const hasCertification = people.some((person) => (approvedByPerson.get(person.id)?.get(capability.code) ?? 0) > 0);
    return matchesText && matchesNature && (filter === "todas" || (filter === "planejadas" ? hasPlan : !hasCertification));
  }), [approvedByPerson, filter, library.capabilities, nature, people, plans, query]);

  const deactivate = async (collaboratorId: string, name: string) => {
    if (!onDeactivatePerson || !window.confirm(`Desativar ${name}? Os planos e as responsabilidades vinculadas a este perfil voltarão a ficar pendentes.`)) return;
    setDeactivatingId(collaboratorId);
    try {
      await onDeactivatePerson(collaboratorId);
    } finally {
      setDeactivatingId("");
    }
  };

  if (!currentUser) return <div className="cap-empty">Selecione um perfil de administrador para montar o mapa da equipe.</div>;
  if (requests.isLoading) return <div className="cap-empty">Carregando certificações aprovadas...</div>;
  if (requests.error) return <div className="cap-empty">Não foi possível carregar as certificações. O painel de capacitação fica bloqueado até a consulta voltar a funcionar.</div>;
  const natures = ["Todas", ...new Set(library.capabilities.map((item) => item.nature))];

  return <section>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div>
        <p className="cap-eyebrow">Capacitação da equipe</p>
        <h1 className="text-2xl font-semibold text-[#172824]">Painel de capacitação</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">Defina o nível que cada pessoa precisa desenvolver. A certificação aparece como conclusão oficial depois da avaliação.</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Planejamento e certificação separados</div>
    </div>
    <div className="mb-4 flex flex-wrap gap-2">
      <label className="cap-search-shell max-w-md"><span className="sr-only">Buscar no painel</span><input aria-label="Buscar no painel" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar capacidade ou código" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      <select aria-label="Filtrar natureza no painel" value={nature} onChange={(event) => setNature(event.target.value)} className="h-[52px] border bg-white px-3 text-sm">{natures.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="Filtrar estado no painel" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-[52px] border bg-white px-3 text-sm"><option value="todas">Todas</option><option value="planejadas">Com plano</option><option value="sem-certificacao">Sem certificação</option></select>
      <Button variant="outline" size="sm" onClick={() => { setQuery(""); setNature("Todas"); setFilter("todas"); }}><FilterX className="mr-1 h-4 w-4" /> Limpar</Button>
    </div>
    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600"><Users className="h-4 w-4" /><strong>{people.length}</strong> colaboradores ativos · <strong>{list.length}</strong> capacidades visíveis</div>
    <div className="overflow-x-auto border bg-white">
      <table className="min-w-[1120px] w-full border-collapse text-left">
        <thead><tr className="border-b bg-zinc-50"><th className="sticky left-0 z-10 min-w-[360px] bg-zinc-50 px-4 py-3 text-xs font-semibold">Capacidade</th>{people.map((person) => <th key={person.id} className="min-w-40 px-2 py-3 text-xs font-semibold"><div className="flex items-center justify-between gap-1"><span>{person.name}</span>{onDeactivatePerson && <button type="button" aria-label={`Desativar ${person.name}`} title={`Desativar ${person.name}`} disabled={deactivatingId === person.id} onClick={() => void deactivate(person.id, person.name)} className="grid h-7 w-7 place-items-center border text-zinc-500 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-50"><UserX className="h-3.5 w-3.5" /></button>}</div></th>)}</tr></thead>
        <tbody>{list.map((capability) => {
          const visual = capabilityVisual(capability.code);
          return <tr key={capability.code} className="border-b last:border-0"><th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 align-top"><div className="flex gap-3"><img src={capabilityCoverPath(capability.code)} alt="" className="h-16 w-24 shrink-0 border object-cover" loading="lazy" /><div className="min-w-0"><span className="block text-[11px] font-semibold text-teal-700">{capability.code} · {capability.nature}</span><span className="mt-1 block text-sm font-semibold">{capability.title}</span><p className="mt-1 text-xs leading-relaxed text-zinc-600">{capability.summary}</p><p className="mt-1 text-xs leading-relaxed text-zinc-700"><strong>Finalidade:</strong> {visual?.concept ?? capability.summary}</p></div></div></th>{people.map((person) => {
            const approved = approvedByPerson.get(person.id)?.get(capability.code) ?? 0;
            const plan = plans[capability.code]?.[person.id] ?? 0;
            return <td key={person.id} className="px-2 py-3 align-top"><p className={`text-xs ${approved ? "text-emerald-700" : "text-zinc-500"}`}>Certificado: <strong>{approved ? capabilityLevelNames[approved] : "Nenhum"}</strong></p><div className="mt-2" role="group" aria-label={`Capacitação planejada de ${capability.title} para ${person.name}`}><p className="mb-1 text-[11px] font-medium text-zinc-600">Capacitação planejada</p><div className="grid grid-cols-2 gap-1">{([1, 2, 3] as CapabilityLevel[]).map((level) => <button key={level} type="button" aria-pressed={plan === level} onClick={() => onPlanChange(capability.code, person.id, level)} className={`min-h-7 border px-1 text-[10px] font-semibold leading-tight ${plan === level ? levelStyles[level].active : levelStyles[level].idle} ${level === 3 ? "col-span-2" : ""}`}>{capabilityLevelNames[level]}</button>)}</div>{plan > 0 && <button type="button" onClick={() => onPlanChange(capability.code, person.id, 0)} aria-label={`Remover plano de ${capability.title} para ${person.name}`} title="Remover plano" className="mt-1 inline-flex h-6 w-6 items-center justify-center text-zinc-500 hover:text-rose-700"><CircleX className="h-4 w-4" /></button>}</div></td>;
          })}</tr>;
        })}</tbody>
      </table>
      {!list.length && <div className="p-6 text-center text-sm text-zinc-600">Nenhuma capacidade encontrada com os filtros atuais.</div>}
    </div>
  </section>;
}
