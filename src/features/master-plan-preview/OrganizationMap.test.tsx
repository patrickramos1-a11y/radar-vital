// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrganizationMap } from "./OrganizationMap";
import { organizationMap } from "./organizationMapModel";

afterEach(cleanup);

describe("organization map", () => {
  const officialCompetencyIds = [...new Set(organizationMap.flatMap((nucleus) => nucleus.sectors.flatMap((sector) => sector.functions.flatMap((item) => item.competencies.filter((competency) => competency.origin === "Original").map((competency) => competency.officialSourceId)))))];

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

  it("keeps functions and competencies open independently across multiple sectors", () => {
    render(<OrganizationMap go={vi.fn()} officialCompetencyIds={officialCompetencyIds} certifiedLevels={{ F01: 1 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Núcleo Técnico" }));
    const map = screen.getByRole("region", { name: "Organograma interativo" });
    fireEvent.click(within(map).getByRole("button", { name: /5 funções essenciaisSetor Projetos/ }));
    fireEvent.click(within(map).getByRole("button", { name: /5 funções essenciaisSetor Processos e Órgãos/ }));
    expect(map.querySelectorAll(".organization-map-sector-row.is-open")).toHaveLength(2);
    fireEvent.click(within(map).getByRole("button", { name: "Coordenador(a) de Projetos" }));
    fireEvent.click(within(map).getByRole("button", { name: "Coordenador(a) de Processos e Órgãos" }));
    expect(map.querySelectorAll(".organization-map-sector-row.is-deep")).toHaveLength(2);
    expect(map.querySelectorAll(".organization-map-function.is-open")).toHaveLength(2);
    expect(map.querySelectorAll(".organization-map-competency-group")).toHaveLength(2);
    fireEvent.click(within(map).getByRole("button", { name: "Planejamento da Produção Técnica" }));
    expect(map.querySelector(".organization-map-requirements")).toBeTruthy();
    expect(map.querySelector(".organization-map-board.has-capabilities")).toBeTruthy();
    expect(map.querySelectorAll(".organization-map-requirement").length).toBeGreaterThan(0);
  });

  it("opens every function competency group from the sector action", () => {
    render(<OrganizationMap go={vi.fn()} officialCompetencyIds={officialCompetencyIds} />);
    fireEvent.click(screen.getByRole("button", { name: "Expandir Núcleo Técnico" }));
    const map = screen.getByRole("region", { name: "Organograma interativo" });
    fireEvent.click(within(map).getByRole("button", { name: /5 funções essenciaisSetor Projetos/ }));
    fireEvent.click(within(map).getByRole("button", { name: "Abrir competências de Setor Projetos" }));
    const projectSector = within(map).getByLabelText("Funções de Setor Projetos");
    expect(projectSector.querySelectorAll(".organization-map-function.is-open")).toHaveLength(5);
    expect(projectSector.querySelectorAll(".organization-map-competency-group")).toHaveLength(5);
    expect(within(map).getByRole("button", { name: "Recolher competências de Setor Projetos" })).toBeTruthy();
  });

  it("simulates journey scope without using the selected profile credentials", () => {
    render(<OrganizationMap go={vi.fn()} officialCompetencyIds={officialCompetencyIds} certifiedLevels={{}} />);
    expect(screen.getByText("Leitura real do perfil selecionado, conforme as capacidades já certificadas.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Abrangência da jornada"), { target: { value: "operador_junior" } });
    expect(screen.getByText("Simulação: credenciais pessoais ignoradas")).toBeTruthy();
    expect(screen.getByText(/Operação técnica inicial/)).toBeTruthy();
    expect(document.querySelector(".organization-map.is-simulating")).toBeTruthy();
  });

  it("keeps proposals separate from certification and opens their manual sheet", () => {
    const go = vi.fn();
    render(<OrganizationMap go={go} officialCompetencyIds={officialCompetencyIds} />);
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
