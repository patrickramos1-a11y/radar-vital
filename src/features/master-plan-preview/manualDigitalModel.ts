import rawCatalog from "./manualDigitalCatalog.json";
import type { Unit } from "./data";

export interface ManualEntity {
  id: string;
  name: string;
  classification: string;
  source: string;
  content: Record<string, string>;
}

export type ManualNucleus = ManualEntity;
export interface ManualSector extends ManualEntity { nucleusId: string }
export interface ManualArea extends ManualEntity { sectorId: string; nucleusId: string }
export type ManualFunction = ManualEntity;
export interface ManualResponsibility extends ManualEntity { sectorId: string; primaryFunctionId: string }
export interface ManualRequirement { code: string; level: 1 | 2 | 3 }
export interface ManualCompetency extends ManualEntity {
  origin: "Original" | "Nova";
  sectorId: string;
  nucleusId: string;
  areaId: string;
  officialSourceId: string;
  requirements: ManualRequirement[];
}
export interface ManualCapability {
  code: string;
  name: string;
  nature: string;
  origin: "Original" | "Nova";
  levels: Array<{ level: number; name: string; points: number; content: Record<string, string> }>;
}
export interface ManualLink extends Record<string, unknown> {
  id: string;
  classification: string;
  content: Record<string, string>;
  ID_Setor?: string;
  ID_Competencia?: string;
  ID_Funcao?: string;
  ID_Responsabilidade?: string;
}
export interface ManualCatalog {
  source: { file: string; sha256: string };
  nuclei: ManualNucleus[];
  sectors: ManualSector[];
  areas: ManualArea[];
  functions: ManualFunction[];
  responsibilities: ManualResponsibility[];
  competencies: ManualCompetency[];
  capabilities: ManualCapability[];
  links: {
    sectorCompetencies: ManualLink[];
    functionSectors: ManualLink[];
    functionResponsibilities: ManualLink[];
    responsibilityCompetencies: ManualLink[];
  };
  sectorAliases: Record<string, string>;
}

export const manualCatalog = rawCatalog as ManualCatalog;

export const levelNames = { 1: "Assistido", 2: "Autônomo", 3: "Multiplicador" } as const;

export function normalizeManualName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function institutionalSectorId(unit: Unit): string | undefined {
  return manualCatalog.sectorAliases[normalizeManualName(unit.name)];
}

export function operationalUnitsForSector(sectorId: string, units: Unit[]): Unit[] {
  return units.filter((unit) => unit.universe_category === "SETOR" && institutionalSectorId(unit) === sectorId);
}

export function nucleusRouteId(id: string): "tecnico" | "suporte" | "administrativo" | undefined {
  if (id === "NUC-01" || id === "tecnico") return "tecnico";
  if (id === "NUC-02" || id === "suporte") return "suporte";
  if (id === "NUC-03" || id === "administrativo") return "administrativo";
  return undefined;
}

export function nucleusCatalogId(id: string): string | undefined {
  const routeId = nucleusRouteId(id);
  return routeId === "tecnico" ? "NUC-01" : routeId === "suporte" ? "NUC-02" : routeId === "administrativo" ? "NUC-03" : undefined;
}

export function linkedFunctionsForSector(sectorId: string): ManualFunction[] {
  const ids = new Set(manualCatalog.links.functionSectors.filter((link) => link.ID_Setor === sectorId).map((link) => link.ID_Funcao));
  return manualCatalog.functions.filter((item) => ids.has(item.id));
}

// The sector's essential roster is an editorial selection over the workbook links.
// Complementary and nucleus-wide links remain available in the source catalog.
export const essentialFunctionIdsBySector: Record<string, string[]> = {
  "SET-01": ["FUN-014", "FUN-018", "FUN-017", "FUN-015", "FUN-016"],
  "SET-02": ["FUN-009", "FUN-012", "FUN-010", "FUN-013", "FUN-011"],
  "SET-03": ["FUN-001", "FUN-004", "FUN-007", "FUN-031", "FUN-002", "FUN-003", "FUN-008"],
  "SET-04": ["FUN-036", "FUN-042"],
  "SET-05": ["FUN-037", "FUN-039", "FUN-040", "FUN-038"],
  "SET-06": ["FUN-033", "FUN-034", "FUN-035"],
  "SET-07": ["FUN-005", "FUN-006"],
  "SET-08": ["FUN-041", "FUN-025"],
  "SET-09": ["FUN-026", "FUN-028", "FUN-030", "FUN-027", "FUN-029"],
  "SET-10": ["FUN-023", "FUN-024"],
  "SET-11": ["FUN-019", "FUN-020", "FUN-021", "FUN-022"],
};

export function essentialFunctionsForSector(sectorId: string): ManualFunction[] {
  const byId = new Map(manualCatalog.functions.map((item) => [item.id, item]));
  return (essentialFunctionIdsBySector[sectorId] ?? []).map((id) => byId.get(id)).filter((item): item is ManualFunction => Boolean(item));
}

export function essentialSectorIdsForFunction(functionId: string): string[] {
  return Object.entries(essentialFunctionIdsBySector).filter(([, ids]) => ids.includes(functionId)).map(([sectorId]) => sectorId);
}

export function linkedResponsibilitiesForSector(sectorId: string): ManualResponsibility[] {
  const functionIds = new Set(linkedFunctionsForSector(sectorId).map((item) => item.id));
  const sharedIds = new Set(manualCatalog.links.functionResponsibilities.filter((link) => functionIds.has(link.ID_Funcao ?? "")).map((link) => link.ID_Responsabilidade));
  return manualCatalog.responsibilities.filter((item) => item.sectorId === sectorId || sharedIds.has(item.id));
}

export function linkedCompetenciesForSector(sectorId: string): ManualCompetency[] {
  const ids = new Set(manualCatalog.links.sectorCompetencies.filter((link) => link.ID_Setor === sectorId).map((link) => link.ID_Competencia));
  return manualCatalog.competencies.filter((item) => ids.has(item.id));
}
