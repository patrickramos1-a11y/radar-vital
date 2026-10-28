// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrganizationMap } from "./OrganizationMap";
import { organizationMap } from "./organizationMapModel";

afterEach(cleanup);

describe("organization map", () => {
  it("uses the approved nucleus, sector and essential-function relationships", () => {
    expect(organizationMap).toHaveLength(3);
    expect(organizationMap.flatMap((nucleus) => nucleus.sectors)).toHaveLength(11);
    const functions = organizationMap.flatMap((nucleus) => nucleus.sectors.flatMap((sector) => sector.functions));
    expect(functions).toHaveLength(41);
    expect(functions.every((item) => item.competencies.length > 0)).toBe(true);
    expect(organizationMap[0].sectors.map((sector) => sector.item.id)).toEqual(["SET-01", "SET-02", "SET-11", "SET-03"]);
  });

  it("focuses a sector, opens its sheet and resets the panorama", () => {
    const go = vi.fn();
    render(<OrganizationMap go={go} officialCompetencyIds={[]} />);
    const panorama = screen.getByRole("region", { name: "Organograma panorâmico" });
    expect(panorama.querySelectorAll(".organization-map-sector")).toHaveLength(11);
    fireEvent.click(within(panorama).getByRole("button", { name: /Setor · 5 funçõesSetor Projetos/ }));
    expect(panorama.querySelectorAll(".organization-map-sector-row.is-filtered").length).toBe(10);
    fireEvent.click(screen.getByRole("button", { name: "Abrir ficha" }));
    expect(go).toHaveBeenCalledWith("setor", "SET-01");
    fireEvent.click(screen.getByRole("button", { name: "Ver empresa inteira" }));
    expect(panorama.querySelectorAll(".organization-map-sector-row.is-filtered")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Abrir ficha" })).toBeNull();
  });

  it("keeps reading modes separate from the institution's records", () => {
    const go = vi.fn();
    render(<OrganizationMap go={go} officialCompetencyIds={[]} />);
    const panorama = screen.getByRole("region", { name: "Organograma panorâmico" });
    fireEvent.click(screen.getByRole("button", { name: "Compactar setores" }));
    expect(panorama.querySelector(".organization-map-mode-sectors")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tudo aberto" }));
    const proposal = panorama.querySelectorAll(".organization-map-competencies .is-proposal");
    expect(proposal.length).toBeGreaterThan(0);
    fireEvent.click(proposal[0]);
    expect(go).toHaveBeenCalledWith("competencia-manual", expect.stringMatching(/^COMP-0/));
  });
});
