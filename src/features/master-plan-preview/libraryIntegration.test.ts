import { describe, expect, it } from "vitest";
import { emptyMasterPlanDraft } from "./storage";
import { integrateSourceLibrary, isResponsibilityCandidate, sourceResponsibilities, suggestedSectorId } from "./libraryIntegration";
import type { Unit } from "./data";

const sectors: Unit[] = [
  { id: "projects", name: "SETOR DE PROJETOS", universe_category: "SETOR", logo_url: null },
  { id: "processes", name: "LICENCIAMENTO E PROCESSOS", universe_category: "SETOR", logo_url: null },
  { id: "field", name: "SERVIÇOS DE CAMPO", universe_category: "SETOR", logo_url: null },
  { id: "management", name: "GESTÃO E PLANEJAMENTO", universe_category: "SETOR", logo_url: null },
];

const suggestedSelections = Object.fromEntries(sourceResponsibilities
  .filter((item) => isResponsibilityCandidate(item.sourceSector))
  .map((item) => [item.sourceId, suggestedSectorId(item.sourceSector, sectors)]));

describe("integração da biblioteca com setores", () => {
  it("vincula as 51 responsabilidades atribuídas aos quatro setores", () => {
    const result = integrateSourceLibrary(emptyMasterPlanDraft(), sectors, suggestedSelections);
    expect(result.capabilities).toHaveLength(28);
    expect(result.responsibilities).toHaveLength(51);
    expect(result.responsibilities.every((item) => item.sectorId && item.capabilityIds.length > 0)).toBe(true);
    expect(result.responsibilities.filter((item) => item.sectorId === "management")).toHaveLength(14);
    expect(result.responsibilities.some((item) => item.title === "Financeiro")).toBe(false);
    expect(result.responsibilities.some((item) => item.title === "Passagem de Bastão / Interface entre Setores")).toBe(false);
    expect(result.capabilities.find((item) => item.id === "F10")?.sectorIds).toContain("field");
  });

  it("aceita revisão individual, preserva titular e não duplica na segunda importação", () => {
    const management = sourceResponsibilities.find((item) => item.sourceSector === "Gestão Interna")!;
    const directSelections = Object.fromEntries(sourceResponsibilities
      .filter((item) => item.sourceSector !== "Gestão Interna" && isResponsibilityCandidate(item.sourceSector))
      .map((item) => [item.sourceId, suggestedSelections[item.sourceId]]));
    const first = integrateSourceLibrary(emptyMasterPlanDraft(), sectors, { ...directSelections, [management.sourceId]: "management" });
    const changed = { ...first, responsibilities: first.responsibilities.map((item) => item.id === management.sourceId ? { ...item, holderId: "patrick" } : item) };
    const second = integrateSourceLibrary(changed, sectors, { ...directSelections, [management.sourceId]: "projects" });
    expect(second.responsibilities).toHaveLength(38);
    expect(second.responsibilities.find((item) => item.id === management.sourceId)).toMatchObject({ holderId: "patrick", sectorId: "projects" });
    for (const required of management.requiredCapabilities) {
      const sectorIds = second.capabilities.find((item) => item.id === required.capabilityCode)?.sectorIds ?? [];
      expect(sectorIds).toContain("projects");
      expect(sectorIds).not.toContain("management");
    }
  });

  it("recusa IDs de setor que não existem", () => {
    const first = sourceResponsibilities.find((item) => item.sourceSector === "Projetos")!;
    expect(() => integrateSourceLibrary(emptyMasterPlanDraft(), sectors, { [first.sourceId]: "missing" })).toThrow(/Setor inválido/);
  });

  it("preserva associações manuais de capacidades durante a integração", () => {
    const manual = {
      ...emptyMasterPlanDraft(),
      capabilities: [{ id: "T01", title: "Gestão de Informações e Acervo", sectorIds: ["management"], sourceChallengeIds: [], status: "local" as const }],
    };
    const result = integrateSourceLibrary(manual, sectors, suggestedSelections);
    expect(result.capabilities.find((item) => item.id === "T01")?.sectorIds).toContain("management");
  });
});
