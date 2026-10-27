import { describe, expect, it } from "vitest";
import {
  canApproveApplication, canSubmitApplication, capabilityCatalogue, certifiedLevelFor,
  capabilityLevelDetailFor, certificationRequestGuideFor, createAssessment, criteriaFor, emptyJourneyStore, newApplication, pendingCriteria,
  submitApplication,
} from "./capabilityJourney";
import {
  changeResponse, changeReview, createDemoStore, DEMO_PERSON_ID,
  nextTargetLevel, responsibilitiesFor, REVIEW_PERSON_ID,
} from "./capabilityDemo";

describe("catálogo e jornada visual", () => {
  it("mantém as 28 fichas reais e vínculos apenas da planilha", () => {
    expect(capabilityCatalogue).toHaveLength(28);
    expect(new Set(capabilityCatalogue.map((item) => item.code)).size).toBe(28);
    expect(responsibilitiesFor("F04")).toHaveLength(4);
    expect(capabilityCatalogue.every((item) => item.selfAssessmentQuestions.length === 4)).toBe(true);
    for (const item of capabilityCatalogue) {
      expect(item.title.trim()).not.toBe("");
      expect(item.detail.statement.trim()).not.toBe("");
      expect(item.detail.scope.trim()).not.toBe("");
      expect(item.detail.performanceCriteria.trim()).not.toBe("");
      expect(item.detail.prerequisites.trim()).not.toBe("");
      expect(item.detail.limits.trim()).not.toBe("");
      expect(criteriaFor(item, 1).length).toBeGreaterThan(0);
      expect(criteriaFor(item, 2).length).toBeGreaterThan(criteriaFor(item, 1).length);
      expect(criteriaFor(item, 3).length).toBeGreaterThan(criteriaFor(item, 2).length);
      expect(criteriaFor(item, 3).every((criterion) => criterion.guidance && criterion.reviewCheck)).toBe(true);
      expect(criteriaFor(item, 3).every((criterion) => criterion.kind === "evidence")).toBe(true);
    }
  });

  it("indica o nível pela menor das quatro respostas e conserva o histórico", () => {
    const first = createAssessment(emptyJourneyStore(), DEMO_PERSON_ID, "F04", [3, 2, 1, 2], "Preciso de apoio na decisão.", "2026-10-01T12:00:00Z", "00000000-0000-4000-8000-000000000201");
    const second = createAssessment(first, DEMO_PERSON_ID, "F04", [2, 2, 2, 3], "Agora consigo executar sozinho.", "2026-10-02T12:00:00Z", "00000000-0000-4000-8000-000000000202");
    expect(second.assessments.map((entry) => entry.indicatedLevel)).toEqual([1, 2]);
    expect(first.assessments).toHaveLength(1);
    expect(() => createAssessment(first, DEMO_PERSON_ID, "F04", [1, 1, 1, 1], "")).toThrow();
  });

  it("lê níveis, solicitações e critérios detalhados da matriz de capacidades", () => {
    const capability = capabilityCatalogue.find((item) => item.code === "T01")!;
    const criteria = criteriaFor(capability, 1);
    expect(capabilityLevelDetailFor("T01", 1)?.practice).toContain("Arquivar");
    expect(certificationRequestGuideFor("T01", 1)?.narrativePrompt).toBeTruthy();
    expect(criteria[0]).toMatchObject({ id: "T01-AS-01", level: 1, guidance: expect.any(String), reviewCheck: expect.any(String) });
  });

  it("cobra critérios cumulativos e dispensa o nível já aprovado", () => {
    const capability = capabilityCatalogue.find((item) => item.code === "F04")!;
    const levelOne = criteriaFor(capability, 1);
    const levelTwo = criteriaFor(capability, 2);
    expect(levelTwo.length).toBeGreaterThan(levelOne.length);
    expect(pendingCriteria(capability, 2, 0)).toHaveLength(levelTwo.length);
    expect(pendingCriteria(capability, 2, 1).every((item) => item.level === 2)).toBe(true);
    expect(nextTargetLevel(1)).toBe(2);
    expect(nextTargetLevel(3)).toBeNull();
  });

  it("só permite envio completo e aprovação após aceite de todos os critérios", () => {
    const capability = capabilityCatalogue.find((item) => item.code === "F04")!;
    const criteria = criteriaFor(capability, 1);
    let application = newApplication(DEMO_PERSON_ID, capability.code, 1);
    expect(canSubmitApplication(application, criteria)).toBe(false);
    for (const criterion of criteria) application = changeResponse(application, criterion.id, {
      complete: true, explanation: "Atendi com acompanhamento.",
      evidenceName: criterion.kind === "evidence" ? "Calendário de obrigações" : "",
      reference: criterion.kind === "evidence" ? "https://repo.example/calendario" : "",
    });
    expect(canSubmitApplication(application, criteria)).toBe(true);
    const evidence = criteria.find((criterion) => criterion.kind === "evidence")!;
    expect(canSubmitApplication(changeResponse(application, evidence.id, { evidenceName: "" }), criteria)).toBe(false);
    application = submitApplication(application, criteria);
    expect(canApproveApplication(application, criteria)).toBe(false);
    for (const criterion of criteria) application = changeReview(application, criterion.id, {
      decision: "accepted", note: "", at: "2026-10-25T12:00:00Z",
    });
    expect(canApproveApplication(application, criteria)).toBe(true);
  });

  it("separa o caso inicial de revisão da jornada do colaborador", () => {
    const store = createDemoStore();
    expect(store.applications.find((item) => item.capabilityCode === "F04")?.personId).toBe(REVIEW_PERSON_ID);
    expect(certifiedLevelFor(store, DEMO_PERSON_ID, "F04")).toBe(0);
    expect(certifiedLevelFor(store, DEMO_PERSON_ID, "T04")).toBe(1);
  });
});
