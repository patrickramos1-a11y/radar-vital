// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsibilityCapabilityCoverage } from "./ResponsibilityCapabilityCoverage";

const fixture = vi.hoisted(() => ({
  profile: { id: "patrick", name: "Patrick", role: "admin" },
  requests: [{ collaborator_id: "gabi", capability_code: "T04", target_level: 2, status: "approved" }],
  error: null as Error | null,
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ currentUser: fixture.profile }) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: fixture.requests, error: fixture.error, isLoading: false }) }));

function open() {
  const onOpen = vi.fn();
  const onRequest = vi.fn();
  const onReview = vi.fn();
  render(<ResponsibilityCapabilityCoverage
    capabilities={[{ id: "T04", title: "Gestão de Prazos e Prioridades", sectorIds: [], sourceChallengeIds: [], status: "local" }]}
    collaborators={[{ id: "gabi", name: "Gabi", is_active: true, photo_url: null }]}
    minimumLevels={{ T04: "Assistido" }}
    onOpen={onOpen} onRequest={onRequest} onReview={onReview} onUnlink={vi.fn()}
  />);
  return { onOpen, onRequest, onReview };
}

afterEach(() => {
  cleanup();
  fixture.profile = { id: "patrick", name: "Patrick", role: "admin" };
  fixture.requests = [{ collaborator_id: "gabi", capability_code: "T04", target_level: 2, status: "approved" }];
  fixture.error = null;
});

describe("capability coverage on a responsibility", () => {
  it("shows approved collaborators and admin actions", () => {
    const actions = open();
    expect(screen.getByText(/Colaboradores certificados: 1/)).toBeTruthy();
    expect(screen.getByText(/Gabi/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Gestão de Prazos e Prioridades" }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar capacitação" }));
    fireEvent.click(screen.getByRole("button", { name: "Avaliar pedidos" }));
    expect(actions.onOpen).toHaveBeenCalledWith("T04");
    expect(actions.onRequest).toHaveBeenCalledWith("T04");
    expect(actions.onReview).toHaveBeenCalledWith("T04");
  });

  it("shows only the current collaborator's level", () => {
    fixture.profile = { id: "gabi", name: "Gabi", role: "colaborador" };
    open();
    expect(screen.getByText(/Seu nível:/)).toBeTruthy();
    expect(screen.getByText("Autônomo")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Avaliar pedidos" })).toBeNull();
  });

  it("does not invent a certified level when the official read fails", () => {
    fixture.error = new Error("table unavailable");
    open();
    expect(screen.getByText(/Níveis certificados indisponíveis/)).toBeTruthy();
    expect(screen.queryByText(/Colaboradores certificados:/)).toBeNull();
  });
});
