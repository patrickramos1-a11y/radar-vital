import {
  essentialFunctionsForSector, manualCatalog,
  type ManualCompetency, type ManualFunction, type ManualSector,
} from "./manualDigitalModel";

interface NucleusDesign {
  id: string;
  routeId: "tecnico" | "suporte" | "administrativo";
  label: string;
  animal: string;
  tone: string;
  soft: string;
  image: string;
  sticker: string;
  summary: string;
  sectorIds: string[];
}

interface SectorDesign {
  label?: string;
  tone: string;
  image: string;
}

export interface OrganizationFunction {
  item: ManualFunction;
  competencies: ManualCompetency[];
}

export interface OrganizationSector {
  item: ManualSector;
  label: string;
  tone: string;
  image: string;
  functions: OrganizationFunction[];
}

export interface OrganizationNucleus extends NucleusDesign {
  sectors: OrganizationSector[];
}

const imageRoot = "/organization-map";

const nuclei: NucleusDesign[] = [
  {
    id: "NUC-01", routeId: "tecnico", label: "Núcleo Técnico", animal: "Coruja-buraqueira",
    tone: "#236aa5", soft: "#e4f0f7", image: `${imageRoot}/nucleo-tecnico.webp`, sticker: `${imageRoot}/stickers/tecnico.webp`,
    summary: "Analisa, projeta, regulariza e transforma conhecimento em soluções aplicáveis.",
    sectorIds: ["SET-01", "SET-02", "SET-11", "SET-03"],
  },
  {
    id: "NUC-02", routeId: "suporte", label: "Núcleo Suporte", animal: "Abelha-jataí",
    tone: "#b36a10", soft: "#fff2cd", image: `${imageRoot}/nucleo-suporte.webp`, sticker: `${imageRoot}/stickers/suporte.webp`,
    summary: "Conecta recursos, comunicação, bem-estar e operação para manter a Ramos em movimento.",
    sectorIds: ["SET-04", "SET-05", "SET-06"],
  },
  {
    id: "NUC-03", routeId: "administrativo", label: "Núcleo ADM", animal: "Capivara",
    tone: "#7a1f46", soft: "#f8e8ee", image: `${imageRoot}/nucleo-administrativo.webp`, sticker: `${imageRoot}/stickers/administrativo.webp`,
    summary: "Organiza relações, decisões e segurança institucional em toda a empresa.",
    sectorIds: ["SET-07", "SET-08", "SET-09", "SET-10"],
  },
];

const sectors: Record<string, SectorDesign> = {
  "SET-01": { tone: "#6d4cb3", image: "projetos" },
  "SET-02": { tone: "#2467b2", image: "processos" },
  "SET-11": { label: "Serviços, Visitas e Levantamentos", tone: "#858324", image: "campo" },
  "SET-03": { tone: "#187c86", image: "gestao-interna" },
  "SET-04": { tone: "#bb6253", image: "bem-estar" },
  "SET-05": { tone: "#777619", image: "operacoes" },
  "SET-06": { tone: "#bf306b", image: "marketing" },
  "SET-07": { tone: "#17745b", image: "comercial" },
  "SET-08": { tone: "#876029", image: "financeiro" },
  "SET-09": { label: "Setor RH", tone: "#b8564d", image: "rh" },
  "SET-10": { tone: "#263b59", image: "contratos" },
};

function required<T>(value: T | undefined, id: string): T {
  if (!value) throw new Error(`O mapa organizacional não encontrou ${id} no catálogo.`);
  return value;
}

const competencyById = new Map(manualCatalog.competencies.map((item) => [item.id, item]));
const sectorById = new Map(manualCatalog.sectors.map((item) => [item.id, item]));

export const organizationMap: OrganizationNucleus[] = nuclei.map((nucleus) => ({
  ...nucleus,
  sectors: nucleus.sectorIds.map((sectorId) => {
    const item = required(sectorById.get(sectorId), sectorId);
    const design = required(sectors[sectorId], sectorId);
    if (item.nucleusId !== nucleus.id) throw new Error(`${sectorId} não pertence a ${nucleus.id}.`);
    return {
      item,
      label: design.label ?? item.name,
      tone: design.tone,
      image: `${imageRoot}/sectors/${design.image}.webp`,
      functions: essentialFunctionsForSector(sectorId).map((entry) => ({
        item: entry,
        competencies: [...entry.content["Competências requeridas (IDs)"].matchAll(/COMP-\d{3}/g)]
          .map(([id]) => required(competencyById.get(id), id)),
      })),
    };
  }),
}));
