import { describe, expect, it } from "vitest";
import { countsForUnit, sectorRecords, sectorUnits, type MasterPlanContext } from "./data";

const context: MasterPlanContext = {
  readAt: "2026-10-24T12:00:00Z",
  units: [
    { id: "projects", name: "SETOR DE PROJETOS", universe_category: "SETOR", logo_url: null },
    { id: "company", name: "RAMOS ENGENHARIA", universe_category: "EMPRESA", logo_url: null },
  ],
  challenges: [
    { id: "challenge-1", client_id: "projects", title: "Criar o Padrão Ramos de Projetos", description: null, status: "open", created_at: "2026-10-24", due_at: null, expected_deliverable: null, success_criteria: "" },
    { id: "challenge-2", client_id: "company", title: "Outra demanda", description: null, status: "open", created_at: "2026-10-24", due_at: null, expected_deliverable: null, success_criteria: "" },
  ],
  tasks: [{ id: "task-1", client_id: "projects", title: "Revisar projeto", status: "pendente", completed: false, completed_at: null, created_at: "2026-10-24", due_date: null, assigned_to: [] }],
  comments: [{ id: "comment-1", client_id: "company", comment_text: "Revisar fluxo", author_name: "Patrick", created_at: "2026-10-24" }],
  collaborators: [],
};

describe("Plano Mestre source separation", () => {
  it("counts only the registered sector records in sector views", () => {
    expect(sectorUnits(context).map((unit) => unit.id)).toEqual(["projects"]);
    expect(countsForUnit(context, "projects")).toEqual({ challenges: 1, tasks: 1, comments: 0 });
    expect(sectorRecords(context).challenges.map((item) => item.id)).toEqual(["challenge-1"]);
    expect(sectorRecords(context).comments).toEqual([]);
  });

});
