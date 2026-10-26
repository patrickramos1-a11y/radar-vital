import { describe, expect, it } from "vitest";
import { activeModule, activeView, navigationModules } from "./navigationModel";

describe("global navigation routes", () => {
  it("keeps every module and view linked to an existing application route", () => {
    const knownPaths = new Set([
      "/", "/dashboard", "/comentarios", "/relatorios-pdf", "/config",
      "/jackbox", "/jackbox-unificado", "/central-entregas",
      "/universo-ramos", "/universo-ramos/plano-mestre", "/auditorias", "/tesouro",
    ]);
    for (const module of navigationModules) {
      expect(knownPaths.has(module.href.split("?")[0])).toBe(true);
      for (const view of module.views) expect(knownPaths.has(view.href.split("?")[0])).toBe(true);
    }
  });

  it("selects the deepest module before its parent", () => {
    expect(activeModule("/universo-ramos/plano-mestre").key).toBe("plano");
    expect(activeModule("/universo-ramos").key).toBe("universo");
    expect(activeModule("/jackbox").key).toBe("tarefas");
  });

  it("reflects query-driven views, including detail pages", () => {
    const master = activeModule("/universo-ramos/plano-mestre");
    expect(activeView(master, "/universo-ramos/plano-mestre", "?view=capacidade&id=T01")).toBe("capacidades");
    expect(activeView(master, "/universo-ramos/plano-mestre", "?view=solicitacao&id=1")).toBe("solicitacoes");
    expect(activeView(master, "/universo-ramos/plano-mestre", "")).toBe("empresa");
    const central = activeModule("/central-entregas");
    expect(activeView(central, "/central-entregas", "?tab=deliverables")).toBe("deliverables");
    expect(activeView(central, "/central-entregas", "")).toBe("priorities");
  });
});
