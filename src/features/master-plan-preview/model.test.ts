import { describe, expect, it } from "vitest";
import { requestColumn, suggestedNucleus } from "./model";

describe("Plano Mestre preview model", () => {
  it("proposes nuclei without forcing unclassified current sectors into a nucleus", () => {
    expect(suggestedNucleus("SETOR DE PROJETOS")).toBe("tecnico");
    expect(suggestedNucleus("SERVIÇOS DE CAMPO")).toBe("tecnico");
    expect(suggestedNucleus("FINANCEIRO")).toBe("administrativo");
    expect(suggestedNucleus("TECNOLOGIA E SISTEMAS")).toBe("");
    expect(suggestedNucleus("BRINDES")).toBe("");
  });

  it("maps operational statuses without inventing blockers or readiness", () => {
    expect(requestColumn("open")).toBe("disponivel");
    expect(requestColumn("in_progress")).toBe("andamento");
    expect(requestColumn("awaiting_validation")).toBe("validacao");
    expect(requestColumn("succeeded")).toBe("concluida");
  });
});
