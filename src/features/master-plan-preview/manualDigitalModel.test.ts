import { describe, expect, it } from "vitest";
import type { Unit } from "./data";
import {
  essentialFunctionIdsBySector, essentialFunctionsForSector, essentialSectorIdsForFunction,
  institutionalSectorId, linkedCompetenciesForSector, linkedFunctionsForSector,
  linkedResponsibilitiesForSector, manualCatalog, operationalUnitsForSector,
} from "./manualDigitalModel";

describe("Manual Digital catalog", () => {
  it("keeps the institutional structure and proposals separate from official records", () => {
    expect(manualCatalog.nuclei).toHaveLength(3);
    expect(manualCatalog.sectors).toHaveLength(11);
    expect(manualCatalog.areas).toHaveLength(24);
    expect(manualCatalog.functions).toHaveLength(44);
    expect(manualCatalog.responsibilities).toHaveLength(133);
    expect(manualCatalog.competencies.filter((item) => item.origin === "Original")).toHaveLength(56);
    expect(manualCatalog.competencies.filter((item) => item.origin === "Nova")).toHaveLength(11);
    expect(manualCatalog.capabilities.filter((item) => item.origin === "Nova")).toHaveLength(24);
    expect(manualCatalog.competencies.filter((item) => item.origin === "Original").every((item) => item.officialSourceId)).toBe(true);
    expect(manualCatalog.competencies.filter((item) => item.origin === "Nova").every((item) => !item.officialSourceId && item.content["Objetivo da competência"])).toBe(true);
  });

  it("resolves operational aliases without assigning unmatched units", () => {
    const units = [
      { id: "projects", name: "SETOR DE PROJETOS", universe_category: "SETOR" },
      { id: "unknown", name: "SETOR DESCONHECIDO", universe_category: "SETOR" },
    ] as Unit[];
    expect(institutionalSectorId(units[0])).toBe("SET-01");
    expect(institutionalSectorId(units[1])).toBeUndefined();
    expect(operationalUnitsForSector("SET-01", units).map((item) => item.id)).toEqual(["projects"]);
  });

  it("preserves sector-to-function-to-responsibility-to-competency links", () => {
    const functionIds = new Set(manualCatalog.functions.map((item) => item.id));
    const responsibilityIds = new Set(manualCatalog.responsibilities.map((item) => item.id));
    const competencyIds = new Set(manualCatalog.competencies.map((item) => item.id));
    for (const sector of manualCatalog.sectors) {
      expect(linkedFunctionsForSector(sector.id).length).toBeGreaterThan(0);
      expect(linkedResponsibilitiesForSector(sector.id).length).toBeGreaterThan(0);
      expect(linkedCompetenciesForSector(sector.id).length).toBeGreaterThan(0);
    }
    for (const link of manualCatalog.links.functionResponsibilities) {
      expect(functionIds.has(link.ID_Funcao ?? "")).toBe(true);
      expect(responsibilityIds.has(link.ID_Responsabilidade ?? "")).toBe(true);
    }
    for (const link of manualCatalog.links.responsibilityCompetencies) {
      expect(responsibilityIds.has(link.ID_Responsabilidade ?? "")).toBe(true);
      expect(competencyIds.has(link.ID_Competencia ?? "")).toBe(true);
    }
    expect(manualCatalog.links.functionSectors.length).toBeGreaterThan(manualCatalog.functions.length);
  });

  it("shows only the user-selected essential functions for each sector", () => {
    expect(Object.keys(essentialFunctionIdsBySector)).toHaveLength(11);
    expect(Object.values(essentialFunctionIdsBySector).map((ids) => ids.length)).toEqual([5, 5, 7, 2, 4, 3, 2, 2, 5, 2, 4]);
    for (const sector of manualCatalog.sectors) {
      const ids = essentialFunctionIdsBySector[sector.id];
      expect(ids).toBeDefined();
      expect(new Set(ids).size).toBe(ids.length);
      expect(essentialFunctionsForSector(sector.id).map((item) => item.id)).toEqual(ids);
      const linkedIds = new Set(linkedFunctionsForSector(sector.id).map((item) => item.id));
      expect(ids.every((id) => linkedIds.has(id))).toBe(true);
    }
    expect(essentialFunctionsForSector("SET-01").map((item) => item.name)).toContain("Gestor(a) de Terceiros Técnicos");
    expect(essentialFunctionsForSector("SET-01").map((item) => item.name)).not.toContain("Coordenador(a) do Núcleo Técnico");
    expect(essentialSectorIdsForFunction("FUN-021")).toEqual(["SET-11"]);
  });
});
