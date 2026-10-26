export const nuclei = [
  { id: "tecnico", name: "Núcleo Técnico", color: "text-fuchsia-700 border-fuchsia-300 bg-fuchsia-50" },
  { id: "suporte", name: "Núcleo Suporte", color: "text-sky-700 border-sky-300 bg-sky-50" },
  { id: "administrativo", name: "Núcleo Administrativo", color: "text-teal-700 border-teal-300 bg-teal-50" },
] as const;

export type NucleusId = (typeof nuclei)[number]["id"];
const nucleusCoverFiles: Record<NucleusId, string> = {
  tecnico: "NUCLEO_TECNICO_CORUJA_BURAQUEIRA.png",
  suporte: "NUCLEO_SUPORTE_ABELHA_JATAI.png",
  administrativo: "NUCLEO_ADMINISTRATIVO_CAPIVARA.png",
};

export function nucleusCoverPath(nucleusId: NucleusId) {
  return `/nucleus-covers/${nucleusCoverFiles[nucleusId]}`;
}

export type ProposalStatus = "proposal" | "local";

export interface PreviewCapability {
  id: string;
  title: string;
  sectorIds: string[];
  sourceChallengeIds: string[];
  status: ProposalStatus;
}

export interface PreviewResponsibility {
  id: string;
  title: string;
  sectorId: string;
  capabilityIds: string[];
  sourceChallengeIds: string[];
  holderId: string | null;
  substituteId: string | null;
  status: ProposalStatus;
}

const suggestedNucleusBySector: Record<string, NucleusId> = {
  "SETOR DE PROJETOS": "tecnico",
  "LICENCIAMENTO E PROCESSOS": "tecnico",
  "SERVIÇOS DE CAMPO": "tecnico",
  "TREINAMENTOS": "tecnico",
  "MANUTENÇÃO": "suporte",
  "SUPRIMENTOS E COMPRAS": "suporte",
  "MARKETING": "suporte",
  "ADMINISTRAÇÃO": "administrativo",
  "GESTÃO E PLANEJAMENTO": "administrativo",
  "FINANCEIRO": "administrativo",
  "PESSOAS E CULTURA": "administrativo",
};

export function suggestedNucleus(sectorName: string): NucleusId | "" {
  return suggestedNucleusBySector[sectorName.toLocaleUpperCase("pt-BR")] ?? "";
}

export function requestColumn(status: string): "disponivel" | "andamento" | "validacao" | "concluida" | "encerrada" {
  if (status === "accepted" || status === "in_progress") return "andamento";
  if (status === "awaiting_validation") return "validacao";
  if (status === "succeeded") return "concluida";
  if (status === "failed" || status === "cancelled") return "encerrada";
  return "disponivel";
}
