// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { OfficialCapabilityExperience } from "./OfficialCapabilityExperience";
import { applyTeamCertifications, fetchAssessments, fetchRequests, requestTeamTraining } from "./journeyRemote";
import type { Library } from "./journeyRemote";

const fixture = vi.hoisted(() => ({
  profile: { id: "collaborator-1", name: "Gabi", role: "colaborador" },
  requests: [] as Array<Record<string, unknown>>,
  certifications: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: fixture.profile, loading: false }),
}));
vi.mock("./journeyRemote", () => ({
  fetchAssessments: vi.fn(async () => []),
  fetchRequests: vi.fn(async () => fixture.requests),
  fetchTeamCertifications: vi.fn(async () => fixture.certifications),
  fetchTeamTrainingRequests: vi.fn(async () => []),
  applyTeamCertifications: vi.fn(async () => undefined),
  requestTeamTraining: vi.fn(async () => ({ status: "requested" })),
  createRemoteAssessment: vi.fn(async () => ({ id: "assessment-1" })),
}));

const library: Library = {
  capabilities: source.capabilities,
  responsibilities: source.responsibilities,
  sourceSha256: source.source.sha256,
};

function open(view: "capacidades" | "capacidade" | "capacitacoes", code = "", tab = "visao", mode = "") {
  const go = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><OfficialCapabilityExperience view={view} code={code} tab={tab} mode={mode} go={go} library={library} people={[{ id: "collaborator-1", name: "Gabi" }]} /></QueryClientProvider>);
  return go;
}

afterEach(() => { cleanup(); fixture.profile = { id: "collaborator-1", name: "Gabi", role: "colaborador" }; fixture.requests = []; fixture.certifications = []; });

describe("official capability library", () => {
  it("shows all 28 published cards and filters by the source title", () => {
    const go = open("capacidades");
    expect(screen.getByText("28 de 28")).toBeTruthy();
    expect(screen.getAllByRole("img", { name: /^Capa ilustrada de / })).toHaveLength(28);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar capacidades" }), { target: { value: "Gestão de Informações e Acervo" } });
    expect(screen.getByText("1 de 28")).toBeTruthy();
    expect(screen.getByRole("img", { name: /T01: Gestão de Informações e Acervo/ }).getAttribute("src")).toBe("/universe-capabilities/T01.png");
    fireEvent.click(screen.getByRole("button", { name: /T01.*Gestão de Informações e Acervo/ }));
    expect(go).toHaveBeenCalledWith("capacidade", "T01");
  });

  it("uses complete source text and keeps unmapped responsibilities visibly pending", () => {
    open("capacidade", "T01", "responsabilidades");
    expect(screen.getByRole("img", { name: /T01: Gestão de Informações e Acervo/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Gestão de Informações e Acervo" })).toBeTruthy();
    expect(screen.getByText(/Estas responsabilidades exigem a capacidade/)).toBeTruthy();
    expect(screen.getAllByText("Vínculo com setor pendente; ficha ainda indisponível").length).toBeGreaterThan(0);
  });

  it("opens a mapped responsibility directly from the capability", () => {
    const mapped = library.responsibilities.find((responsibility) => responsibility.requiredCapabilities.some((entry) => entry.capabilityCode === "T01"))!;
    const go = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><OfficialCapabilityExperience view="capacidade" code="T01" tab="responsabilidades" mode="" go={go} library={library} people={[]} mappedResponsibilities={[{ id: mapped.sourceId, title: mapped.title, sectorId: "sector-1", capabilityIds: ["T01"], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }]} sectors={[{ id: "sector-1", name: "GESTÃO E PLANEJAMENTO", universe_category: "SETOR", logo_url: null }]} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(mapped.title) }));
    expect(go).toHaveBeenCalledWith("responsabilidade", mapped.sourceId);
  });

  it("uses the selected collaborator profile without requesting an email login", async () => {
    open("capacitacoes", "T01", "autoavaliacao");
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar autoavaliação" })).toBeTruthy());
    expect(screen.getByText("Gabi")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Entrar na jornada" })).toBeNull();
    expect(fetchAssessments).toHaveBeenCalledWith("collaborator-1");
    expect(fetchRequests).toHaveBeenCalledWith("collaborator-1", false);
  });

  it("opens Capacitações with the collaborator journey and next recommendations", async () => {
    open("capacitacoes");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Minhas capacitações" })).toBeTruthy());
    expect(screen.getByRole("heading", { name: "Próximas recomendações" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Solicitar Assistido/ }).length).toBeGreaterThan(0);
  });

  it("opens the certified capabilities from the personal journey summary", async () => {
    fixture.certifications = [{ collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    const go = open("capacitacoes");
    const summary = await screen.findByRole("button", { name: /Ver certificações/ });
    fireEvent.click(summary);
    expect(screen.getByRole("heading", { name: "Certificações de Gabi" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /T01.*Gestão de Informações e Acervo/ }));
    expect(go).toHaveBeenCalledWith("capacidade", "T01");
  });

  it("does not offer the administrative queue to a collaborator", async () => {
    open("capacitacoes", "T01", "autoavaliacao", "administrador");
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar autoavaliação" })).toBeTruthy());
    expect(screen.queryByRole("heading", { name: /Aguardando avaliação/ })).toBeNull();
  });

  it("asks for an evidence name and repository location, without file upload", async () => {
    open("capacitacoes", "T01", "criterios");
    await waitFor(() => expect(screen.getAllByText("Como comprovar:").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Nome da evidência").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Link ou caminho no repositório").length).toBeGreaterThan(0);
    expect(screen.queryByText("Selecionar arquivo")).toBeNull();
  });

  it("shows the review queue for the existing admin profile", async () => {
    fixture.profile = { id: "admin-1", name: "Patrick", role: "admin" };
    open("capacitacoes", "T01", "retorno", "administrador");
    await waitFor(() => expect(screen.getByText("Aguardando avaliação · 0")).toBeTruthy());
    expect(fetchRequests).toHaveBeenCalledWith("admin-1", true);
  });

  it("uses level buttons in the team training panel and shows the capability identity", async () => {
    fixture.profile = { id: "admin-1", name: "Patrick", role: "admin" };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><OfficialCapabilityExperience view="capacitacoes" code="E01" tab="mapa" mode="administrador" go={vi.fn()} library={library} people={[{ id: "collaborator-1", name: "Gabi" }]} onDeactivateCollaborator={async () => {}} /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Painel de capacitação" })).toBeTruthy());
    expect(screen.getByRole("columnheader", { name: "Gabi" }).className).toContain("sticky");
    expect(screen.getByRole("columnheader", { name: "Gabi" }).className).toContain("top-0");
    const controls = screen.getByRole("group", { name: /Capacidade de Engenharia de Sistemas de Saneamento para Gabi/ });
    expect(within(controls).getByRole("button", { name: "Solicitar Assistido" })).toBeTruthy();
    fireEvent.click(within(controls).getByRole("button", { name: "Autônomo" }));
    fireEvent.click(within(controls).getByRole("button", { name: "Solicitar Autônomo" }));
    await waitFor(() => expect(requestTeamTraining).toHaveBeenCalledWith("admin-1", "collaborator-1", "E01", 2));
    expect(screen.getByRole("button", { name: "Aplicar atualizações" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar atualizações" }));
    await waitFor(() => expect(applyTeamCertifications).toHaveBeenCalledWith("admin-1", [{ collaboratorId: "collaborator-1", capabilityCode: "E01", level: 2 }]));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Aplicar atualizações" })).toBeNull());
    fireEvent.click(within(controls).getByRole("button", { name: "Multiplicador" }));
    expect(screen.getByRole("button", { name: "Aplicar atualizações" })).toBeTruthy();
    expect(screen.getAllByText("Finalidade:").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Desativar Gabi" })).toBeTruthy();
  });

  it("shows a certified level as current and only offers the next evolution", async () => {
    fixture.profile = { id: "admin-1", name: "Patrick", role: "admin" };
    fixture.certifications = [{ collaborator_id: "collaborator-1", capability_code: "E01", certified_level: 1, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><OfficialCapabilityExperience view="capacitacoes" code="E01" tab="mapa" mode="administrador" go={vi.fn()} library={library} people={[{ id: "collaborator-1", name: "Gabi" }]} /></QueryClientProvider>);
    const controls = await screen.findByRole("group", { name: /Capacidade de Engenharia de Sistemas de Saneamento para Gabi/ });
    expect(within(controls).getByText("Capacidade atual")).toBeTruthy();
    expect(within(controls).getByText("Assistido")).toBeTruthy();
    expect(within(controls).queryByRole("button", { name: "Assistido" })).toBeNull();
    expect(within(controls).getByRole("button", { name: "Conceder Autônomo" })).toBeTruthy();
  });
});
