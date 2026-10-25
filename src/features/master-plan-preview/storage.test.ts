// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  emptyMasterPlanDraft, loadMasterPlanDraft, MASTER_PLAN_STORAGE_KEY,
  mergeMasterPlanDraft, parseMasterPlanDraft, saveMasterPlanDraft,
} from "./storage";

beforeEach(() => window.localStorage.clear());

describe("Plano Mestre backup", () => {
  it("saves and restores a responsibility with its capability and assignee", () => {
    const draft = emptyMasterPlanDraft();
    draft.capabilities.push({ id: "cap-1", title: "Revisão técnica", sectorIds: ["sector-1"], sourceChallengeIds: [], status: "local" });
    draft.responsibilities.push({ id: "resp-1", title: "Conferir projetos", sectorId: "sector-1", capabilityIds: ["cap-1"], sourceChallengeIds: [], holderId: "person-1", substituteId: null, status: "local" });
    saveMasterPlanDraft(draft);
    expect(window.localStorage.getItem(MASTER_PLAN_STORAGE_KEY)).toContain("Conferir projetos");
    expect(loadMasterPlanDraft().responsibilities[0].holderId).toBe("person-1");
  });

  it("merges imported records without replacing more recent local edits", () => {
    const current = emptyMasterPlanDraft();
    const imported = emptyMasterPlanDraft();
    current.capabilities.push({ id: "cap-1", title: "Nome revisado", sectorIds: ["sector-1"], sourceChallengeIds: [], status: "local" });
    imported.capabilities.push({ id: "cap-1", title: "Nome antigo", sectorIds: ["sector-1"], sourceChallengeIds: [], status: "local" });
    imported.capabilities.push({ id: "cap-2", title: "Gestão de equipe", sectorIds: ["sector-2"], sourceChallengeIds: [], status: "local" });
    expect(mergeMasterPlanDraft(current, imported).capabilities.map((item) => item.title)).toEqual(["Nome revisado", "Gestão de equipe"]);
  });

  it("rejects duplicate IDs and incompatible backups", () => {
    const draft = emptyMasterPlanDraft();
    draft.capabilities.push({ id: "same", title: "Primeira", sectorIds: [], sourceChallengeIds: [], status: "local" });
    draft.capabilities.push({ id: "same", title: "Segunda", sectorIds: [], sourceChallengeIds: [], status: "local" });
    expect(() => parseMasterPlanDraft(draft)).toThrow("identificadores duplicados");
    expect(() => parseMasterPlanDraft({ version: 2 })).toThrow();
  });
});
