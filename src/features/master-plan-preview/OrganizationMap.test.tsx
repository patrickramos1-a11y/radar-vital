// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrganizationMap } from "./OrganizationMap";
import { organizationMap } from "./organizationMapModel";

afterEach(cleanup);

describe("organization map", () => {
  it("preserves the approved structure and essential functions", () => {
    expect(organizationMap).toHaveLength(3);
    expect(organizationMap.flatMap((nucleus) => nucleus.sectors)).toHaveLength(11);
    expect(organizationMap.flatMap((nucleus) => nucleus.sectors.flatMap((sector) => sector.functions))).toHaveLength(41);
  });

  it("starts compact, expands nuclei in selection order, and keeps other nuclei available", () => {
    render(<OrganizationMap go={vi.fn()} officialCompetencyIds={[]} />);
    const map = screen.getByRole("region", { name: "Organograma interativo" });
    expect(map.querySelectorAll(".organization-map-lane.is-compact")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Núcleo Suporte" }));
    expect(map.querySelector(".organization-map-lane")?.textContent).toContain("Núcleo Suporte");
    expect(map.querySelectorAll(".organization-map-lane.is-compact")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Núcleo Técnico" }));
    expect(map.querySelectorAll(".organization-map-lane.is-open")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Recolher Núcleo Suporte" }));
    expect(map.querySelectorAll(".organization-map-lane.is-open")).toHaveLength(1);
  });

  it("opens multiple sectors, then a function and its named competencies", () => {
    render(<OrganizationMap go={vi.fn()} officialCompetencyIds={[]} certifiedLevels={{ F01: 1 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Núcleo Técnico" }));
    const map = screen.getByRole("region", { name: "Organograma interativo" });
    fireEvent.click(within(map).getByRole("button", { name: /5 funções essenciaisSetor Projetos/ }));
    fireEvent.click(within(map).getByRole("button", { name: /5 funções essenciaisSetor Processos e Órgãos/ }));
    expect(map.querySelectorAll(".organization-map-sector-row.is-open")).toHaveLength(2);
    expect(map.querySelector(".organization-map-sector-row")?.textContent).toContain("Setor Projetos");
    fireEvent.click(within(map).getByRole("button", { name: "Coordenador(a) de Projetos" }));
    expect(within(map).getByRole("button", { name: "Planejamento da Produção Técnica" })).toBeTruthy();
    fireEvent.click(within(map).getByRole("button", { name: "Planejamento da Produção Técnica" }));
    expect(map.querySelector(".organization-map-requirements")).toBeTruthy();
    expect(map.querySelectorAll(".organization-map-requirement").length).toBeGreaterThan(0);
  });

  it("keeps proposals separate from certification and opens their manual sheet", () => {
    const go = vi.fn();
    render(<OrganizationMap go={go} officialCompetencyIds={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Núcleo Técnico" }));
    const map = screen.getByRole("region", { name: "Organograma interativo" });
    fireEvent.click(within(map).getByRole("button", { name: /5 funções essenciaisSetor Projetos/ }));
    const functionButton = within(map).getByRole("button", { name: "Coordenador(a) de Projetos" });
    fireEvent.click(functionButton);
    const proposal = map.querySelector(".organization-map-competency.is-pending");
    expect(proposal).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Recolher tudo" }));
    expect(map.querySelectorAll(".organization-map-lane.is-compact")).toHaveLength(3);
  });
});
