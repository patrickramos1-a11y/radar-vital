import sourceCatalog from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import type { Unit } from "./data";
import type { MasterPlanDraft } from "./storage";

export const newSectorNames = ["SERVIÇOS DE CAMPO", "FINANCEIRO", "TECNOLOGIA E SISTEMAS"] as const;

export const sourceResponsibilities = sourceCatalog.responsibilities;
export const sourceCapabilities = sourceCatalog.capabilities;

const sectorDestination: Record<string, string> = {
  "Gestão Interna": "GESTÃO E PLANEJAMENTO",
  "Projetos": "SETOR DE PROJETOS",
  "Processos e Órgãos": "LICENCIAMENTO E PROCESSOS",
  "Serviços, Visitas e Levantamentos": "SERVIÇOS DE CAMPO",
};

export function isResponsibilityCandidate(sourceSector: string): boolean {
  return sourceSector !== "Fora do Núcleo Técnico" && sourceSector !== "Transversal (todos os setores)";
}

export function suggestedSectorId(sourceSector: string, sectors: Unit[]): string {
  const name = sectorDestination[sourceSector];
  return sectors.find((sector) => sector.name === name)?.id ?? "";
}

export function integrateSourceLibrary(
  current: MasterPlanDraft,
  sectors: Unit[],
  selections: Record<string, string>,
): MasterPlanDraft {
  const validSectorIds = new Set(sectors.map((sector) => sector.id));
  const nextResponsibilities = [...current.responsibilities];
  const byId = new Map(nextResponsibilities.map((item, index) => [item.id, index]));

  for (const source of sourceResponsibilities) {
    if (!isResponsibilityCandidate(source.sourceSector)) continue;
    const sectorId = selections[source.sourceId];
    if (!sectorId) continue;
    if (!validSectorIds.has(sectorId)) throw new Error(`Setor inválido para ${source.title}.`);
    const index = byId.get(source.sourceId);
    if (index !== undefined) {
      nextResponsibilities[index] = { ...nextResponsibilities[index], sectorId };
    } else {
      byId.set(source.sourceId, nextResponsibilities.length);
      nextResponsibilities.push({
        id: source.sourceId,
        title: source.title,
        sectorId,
        capabilityIds: source.requiredCapabilities.map((item) => item.capabilityCode),
        sourceChallengeIds: [],
        holderId: null,
        substituteId: null,
        status: "local",
      });
    }
  }

  const existingCapabilities = new Map(current.capabilities.map((item) => [item.id, item]));
  const sourceIds = new Set(sourceResponsibilities.map((item) => item.sourceId));
  const mappedCapabilities = sourceCapabilities.map((source) => {
    const previous = existingCapabilities.get(source.code);
    const previousImportedSectorIds = new Set(current.responsibilities
      .filter((responsibility) => sourceIds.has(responsibility.id) && responsibility.capabilityIds.includes(source.code))
      .map((responsibility) => responsibility.sectorId));
    const sectorIds = [...new Set([
      ...(previous?.sectorIds ?? []).filter((sectorId) => !previousImportedSectorIds.has(sectorId)),
      ...nextResponsibilities
        .filter((responsibility) => responsibility.capabilityIds.includes(source.code))
        .map((responsibility) => responsibility.sectorId),
    ])];
    return previous
      ? { ...previous, sectorIds }
      : { id: source.code, title: source.title, sectorIds, sourceChallengeIds: [], status: "local" as const };
  });

  return {
    ...current,
    capabilities: [
      ...current.capabilities.filter((item) => !sourceCapabilities.some((source) => source.code === item.id)),
      ...mappedCapabilities,
    ],
    responsibilities: nextResponsibilities,
  };
}
