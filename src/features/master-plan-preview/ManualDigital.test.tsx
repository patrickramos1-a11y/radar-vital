// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManualDigital } from "./ManualDigital";
import { manualCatalog } from "./manualDigitalModel";

const officialCapabilityCodes = manualCatalog.capabilities.filter((item) => item.origin !== "Nova").map((item) => item.code);
afterEach(cleanup);

function sector(tab: string, certifiedLevels: Record<string, number> | null = { F01: 3 }) {
  const go = vi.fn();
  render(<ManualDigital view="setor" id="SET-01" tab={tab} go={go} officialCapabilityCodes={officialCapabilityCodes} officialCompetencyIds={[]} certifiedLevels={certifiedLevels} />);
  return go;
}

describe("Manual Digital sector journey", () => {
  it("shows the official function sticker on its direct page", () => {
    render(<ManualDigital view="funcao" id="FUN-003" tab="visao" go={vi.fn()} officialCapabilityCodes={officialCapabilityCodes} officialCompetencyIds={[]} />);
    const sticker = screen.getByRole("img", { name: /Figurinha de/ });
    expect(sticker.getAttribute("src")).toBe("/organization-map/functions/T20.webp");
  });

  it("opens all four quick facts and keeps areas in the overview without a tab", () => {
    const go = sector("visao");
    expect(screen.queryByRole("tab", { name: /Áreas/ })).toBeNull();
    for (const [label, tab] of [["funções", "funcoes"], ["capacidades", "capacidades"], ["competências", "competencias"], ["pessoas em tarefas", "pessoas"]]) {
      fireEvent.click(screen.getByRole("button", { name: `Abrir ${label} do setor` }));
      expect(go).toHaveBeenLastCalledWith("setor", "SET-01", tab);
    }
    expect(screen.getByRole("heading", { name: "Áreas" })).toBeTruthy();
  });

  it("dims unmet competency requirements but keeps certified requirements colored", () => {
    sector("competencias");
    const earned = screen.getAllByRole("button", { name: /Gestão de Demandas e Fluxo Operacional · Multiplicador/ })[0];
    const pending = screen.getAllByRole("button", { name: /Gestão de Prazos e Prioridades · Autônomo/ })[0];
    expect(earned.className).not.toContain("sector-requirement-pending");
    expect(pending.className).toContain("sector-requirement-pending");
    expect(pending.textContent).toContain("pendente");
  });

  it("shows only the sector's selected essential functions", () => {
    sector("funcoes");
    expect(screen.getByRole("tab", { name: "Funções (5)" })).toBeTruthy();
    expect(screen.getByText("Coordenador(a) de Projetos")).toBeTruthy();
    expect(screen.getByText("Gestor(a) de Terceiros Técnicos")).toBeTruthy();
    expect(screen.queryByText("Coordenador(a) do Núcleo Técnico")).toBeNull();
  });

  it("colors certified capabilities and dims unearned and proposed ones", () => {
    sector("capacidades");
    const earned = screen.getByRole("button", { name: /F01 · Funcional.*Gestão de Demandas e Fluxo Operacional/ });
    const pending = screen.getByRole("button", { name: /T09 · Transversal.*Padronização e Melhoria de Métodos/ });
    const proposal = screen.getByRole("button", { name: /T09.1 · Transversal · Proposta/ });
    expect(earned.className).not.toContain("sector-capability-pending");
    expect(earned.textContent).toContain("Conquistada · Multiplicador");
    expect(pending.className).toContain("sector-capability-pending");
    expect(proposal.className).toContain("sector-capability-pending");
    expect(proposal.textContent).toContain("Ainda não certificável");
  });

  it("marks only the highest sector requirement already met by the profile", () => {
    sector("capacidades", { F01: 3, T07: 1, T04: 2, "T09.1": 3 });
    const belowRequired = screen.getByRole("button", { name: /T07 · Transversal.*Interface e Passagem de Bastão/ });
    const requirement = belowRequired.querySelector(".sector-required-insignia");
    expect(belowRequired.className).not.toContain("sector-capability-pending");
    expect(belowRequired.textContent).toContain("Exige Multiplicador");
    expect(belowRequired.textContent).toContain("Conquistada · Assistido");
    expect(requirement?.getAttribute("aria-label")).toBe("Nível exigido: Multiplicador, pendente");
    expect(requirement?.className).not.toContain("sector-required-insignia-met");

    const attained = screen.getByRole("button", { name: /T04 · Transversal.*Gestão de Prazos e Prioridades/ });
    expect(attained.querySelector(".sector-required-insignia-met")?.getAttribute("aria-label")).toBe("Nível exigido: Autônomo, atendido");
    expect(attained.querySelector(".sector-required-insignia-met svg")).toBeTruthy();

    const proposed = screen.getByRole("button", { name: /T09.1 · Transversal · Proposta/ });
    expect(proposed.querySelector(".sector-required-insignia-met")).toBeNull();
  });

  it("dims capabilities when certification data has not loaded", () => {
    sector("capacidades", null);
    const capability = screen.getByRole("button", { name: /T09 · Transversal.*Padronização e Melhoria de Métodos/ });
    expect(capability.className).toContain("sector-capability-pending");
    expect(capability.textContent).toContain("Certificação não disponível");
  });
});
