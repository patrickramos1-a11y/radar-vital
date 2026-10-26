import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FilterX, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { fetchRequests, type Library } from "./journeyRemote";
import { approvedLevels } from "./responsibilityEligibility";

type PlanLevel = 0 | CapabilityLevel;
type Props = {
  library: Library;
  people: Array<{ id: string; name: string }>;
  plans: Record<string, Record<string, PlanLevel>>;
  onPlanChange: (capabilityCode: string, collaboratorId: string, level: PlanLevel) => void;
};

const planLabels: Record<PlanLevel, string> = { 0: "Sem prioridade", 1: "Assistido", 2: "Autônomo", 3: "Multiplicador" };

export function CapabilityTeamMatrix({ library, people, plans, onPlanChange }: Props) {
  const { currentUser } = useAuth();
  const requests = useQuery({ queryKey: ["master-plan-requests", currentUser?.id, true], queryFn: () => fetchRequests(currentUser!.id, true), enabled: !!currentUser, retry: false });
  const [query, setQuery] = useState("");
  const [nature, setNature] = useState("Todas");
  const [filter, setFilter] = useState<"todas" | "priorizadas" | "sem-certificacao">("todas");
  const approvedByPerson = useMemo(() => new Map(people.map((person) => [person.id, approvedLevels(requests.data ?? [], person.id)])), [people, requests.data]);
  const list = useMemo(() => library.capabilities.filter((capability) => {
    const matchesText = `${capability.code} ${capability.title}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
    const matchesNature = nature === "Todas" || capability.nature === nature;
    const hasPlan = people.some((person) => (plans[capability.code]?.[person.id] ?? 0) > 0);
    const hasCertification = people.some((person) => (approvedByPerson.get(person.id)?.get(capability.code) ?? 0) > 0);
    return matchesText && matchesNature && (filter === "todas" || (filter === "priorizadas" ? hasPlan : !hasCertification));
  }), [approvedByPerson, filter, library.capabilities, nature, people, plans, query]);
  if (!currentUser) return <div className="cap-empty">Selecione um perfil de administrador para montar o mapa da equipe.</div>;
  if (requests.isLoading) return <div className="cap-empty">Carregando certificações aprovadas...</div>;
  if (requests.error) return <div className="cap-empty">Não foi possível carregar as certificações. O planejamento inicial fica bloqueado até a consulta voltar a funcionar.</div>;
  const natures = ["Todas", ...new Set(library.capabilities.map((item) => item.nature))];
  return <section>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><p className="cap-eyebrow">Planejamento da equipe</p><h1 className="text-2xl font-semibold text-[#172824]">Mapa inicial de capacitações</h1><p className="mt-2 max-w-3xl text-sm text-zinc-600">Cada linha é uma capacidade. A certificação aprovada aparece como referência; use a seleção em cada pessoa para registrar a prioridade inicial de desenvolvimento.</p></div><div className="flex items-center gap-2 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Certificações e plano separados</div></div>
    <div className="mb-4 flex flex-wrap gap-2"><label className="cap-search-shell max-w-md"><span className="sr-only">Buscar na matriz</span><input aria-label="Buscar na matriz" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar capacidade ou código" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select aria-label="Filtrar natureza na matriz" value={nature} onChange={(event) => setNature(event.target.value)} className="h-[52px] border bg-white px-3 text-sm">{natures.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar estado na matriz" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-[52px] border bg-white px-3 text-sm"><option value="todas">Todas</option><option value="priorizadas">Com prioridade</option><option value="sem-certificacao">Sem certificação</option></select><Button variant="outline" size="sm" onClick={() => { setQuery(""); setNature("Todas"); setFilter("todas"); }}><FilterX className="mr-1 h-4 w-4" /> Limpar</Button></div>
    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600"><Users className="h-4 w-4" /><strong>{people.length}</strong> colaboradores · <strong>{list.length}</strong> capacidades visíveis</div>
    <div className="overflow-x-auto border bg-white"><table className="min-w-[900px] w-full border-collapse text-left"><thead><tr className="border-b bg-zinc-50"><th className="sticky left-0 z-10 min-w-72 bg-zinc-50 px-4 py-3 text-xs font-semibold">Capacidade</th>{people.map((person) => <th key={person.id} className="min-w-48 px-3 py-3 text-xs font-semibold">{person.name}</th>)}</tr></thead><tbody>{list.map((capability) => <tr key={capability.code} className="border-b last:border-0"><th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 align-top"><span className="block text-[11px] font-semibold text-teal-700">{capability.code} · {capability.nature}</span><span className="mt-1 block text-sm font-semibold">{capability.title}</span></th>{people.map((person) => { const approved = approvedByPerson.get(person.id)?.get(capability.code) ?? 0; const plan = plans[capability.code]?.[person.id] ?? 0; return <td key={person.id} className="px-3 py-3 align-top"><p className={`text-xs ${approved ? "text-emerald-700" : "text-zinc-500"}`}>Certificado: <strong>{approved ? capabilityLevelNames[approved] : "Nenhum"}</strong></p><label className="mt-2 block text-[11px] font-medium text-zinc-600">Prioridade inicial<select aria-label={`Plano de ${capability.title} para ${person.name}`} value={plan} onChange={(event) => onPlanChange(capability.code, person.id, Number(event.target.value) as PlanLevel)} className="mt-1 h-8 w-full border bg-white px-2 text-xs">{([0, 1, 2, 3] as PlanLevel[]).map((level) => <option value={level} key={level}>{planLabels[level]}</option>)}</select></label></td>; })}</tr>)}</tbody></table>{!list.length && <div className="p-6 text-center text-sm text-zinc-600">Nenhuma capacidade encontrada com os filtros atuais.</div>}</div>
  </section>;
}
