// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { OfficialCapabilityExperience } from "./OfficialCapabilityExperience";
import { capabilityLevelPalette } from "./capabilityJourney";
import { applyTeamCertifications, fetchAssessments, fetchRequests, requestResponsibility, requestTeamTraining } from "./journeyRemote";
import type { Library } from "./journeyRemote";

const fixture = vi.hoisted(() => ({
  profile: { id: "collaborator-1", name: "Gabi", role: "colaborador" },
  requests: [] as Array<Record<string, unknown>>,
  certifications: [] as Array<Record<string, unknown>>,
  trainingRequests: [] as Array<Record<string, unknown>>,
  responsibilityClaims: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: fixture.profile, loading: false }),
}));
vi.mock("./journeyRemote", () => ({
  fetchAssessments: vi.fn(async () => []),
  fetchRequests: vi.fn(async () => fixture.requests),
  fetchTeamCertifications: vi.fn(async () => fixture.certifications),
  fetchTeamTrainingRequests: vi.fn(async () => fixture.trainingRequests),
  fetchResponsibilityClaims: vi.fn(async () => fixture.responsibilityClaims),
  applyTeamCertifications: vi.fn(async () => undefined),
  requestTeamTraining: vi.fn(async () => ({ status: "requested" })),
  requestResponsibility: vi.fn(async () => ({ id: "claim-1", status: "requested" })),
  reviewResponsibilityClaim: vi.fn(async () => ({ id: "claim-1", status: "approved" })),
  createRemoteAssessment: vi.fn(async () => ({ id: "assessment-1" })),
}));

const library: Library = {
  capabilities: source.capabilities,
  responsibilities: source.responsibilities,
  sourceSha256: source.source.sha256,
};

function open(view: "capacidades" | "capacidade" | "capacitacoes" | "jornada" | "cargos-funcoes", code = "", tab = "visao", mode = "") {
  const go = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><OfficialCapabilityExperience view={view} code={code} tab={tab} mode={mode} go={go} library={library} people={[{ id: "collaborator-1", name: "Gabi" }]} /></QueryClientProvider>);
  return go;
}

afterEach(() => { cleanup(); fixture.profile = { id: "collaborator-1", name: "Gabi", role: "colaborador" }; fixture.requests = []; fixture.certifications = []; fixture.trainingRequests = []; fixture.responsibilityClaims = []; });

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

  it("shows the corresponding sticker for every capability level", () => {
    open("capacidade", "T04", "niveis");
    expect(screen.getByRole("img", { name: "Insígnia do nível Assistido" }).getAttribute("src")).toBe("/capability-stickers/levels/INSIGNIA_ASSISTIDO.png");
    expect(screen.getByRole("img", { name: "Insígnia do nível Autônomo" }).getAttribute("src")).toBe("/capability-stickers/levels/INSIGNIA_AUTONOMO.png");
    expect(screen.getByRole("img", { name: "Insígnia do nível Multiplicador" }).getAttribute("src")).toBe("/capability-stickers/levels/INSIGNIA_MULTIPLICADOR.png");
  });

  it("keeps the standard palette for every certification level", () => {
    expect(capabilityLevelPalette).toEqual({
      1: { primary: "#25533F", secondary: "#4E8B59", highlight: "#AACC96" },
      2: { primary: "#876029", secondary: "#5A3B1E", highlight: "#B47A32" },
      3: { primary: "#D99A21", secondary: "#A86713", highlight: "#EFCE7B" },
    });
  });

  it("uses the selected collaborator profile without requesting an email login", async () => {
    open("capacitacoes", "T01", "autoavaliacao");
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar autoavaliação" })).toBeTruthy());
    expect(screen.getByText("Gabi")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Entrar na jornada" })).toBeNull();
    expect(fetchAssessments).toHaveBeenCalledWith("collaborator-1");
    expect(fetchRequests).toHaveBeenCalledWith("collaborator-1", false);
  });

  it("opens Capacitações with the collaborator journey", async () => {
    open("capacitacoes");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Minhas capacitações" })).toBeTruthy());
    expect(screen.getByRole("tab", { name: "Minha jornada" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Acervo e disponibilidade" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Próximas recomendações" })).toBeNull();
  });

  it("shows the capability collection in its own Capacitações tab", async () => {
    open("capacitacoes", "", "acervo");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Próximas recomendações" })).toBeTruthy());
    expect(screen.getByRole("tab", { name: "Acervo e disponibilidade" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("heading", { name: "Próximas recomendações" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Solicitar Assistido/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: /Figurinha T01/ }).getAttribute("src")).toBe("/capability-stickers/posters/T01.png");
    fireEvent.click(screen.getByRole("button", { name: "Falta certificar" }));
    expect(screen.getByRole("button", { name: "Falta certificar" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Falta Assistido" }));
    expect(screen.getAllByRole("img", { name: /Figurinha/ })[0].closest("article")?.className).toContain("cap-sticker-card-missing");
  }, 10_000);

  it("shows the professional journey with capabilities, responsibilities, and career evolution", async () => {
    fixture.certifications = [
      { collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
      { collaborator_id: "collaborator-1", capability_code: "E01", certified_level: 1, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
    ];
    const go = open("jornada");
    await waitFor(() => expect(screen.getByText(/3 de 84 pontos/)).toBeTruthy());
    const capability = screen.getByRole("button", { name: /E01.*Engenharia de Sistemas de Saneamento/ });
    expect(within(capability).getByRole("img", { name: "Figurinha E01: Engenharia de Sistemas de Saneamento" })).toBeTruthy();
    expect(within(capability).getByRole("img", { name: "Nível habilitado: Assistido" })).toBeTruthy();
    expect(within(capability).getByRole("img", { name: "Nível a desenvolver: Autônomo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Responsabilidades" }));
    expect(screen.getByRole("heading", { name: "Responsabilidades em evolução" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Concedidas (0)" }));
    expect(screen.getByRole("heading", { name: "Responsabilidades concedidas" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Escada de cargo" }));
    expect(screen.getByRole("heading", { name: "Escada de promoção · Núcleo Técnico" })).toBeTruthy();
    expect(screen.getAllByText("Operador Júnior").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Responsabilidades deste cargo").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Responsabilidades acumuladas · \d+/).length).toBeGreaterThan(0);
    const firstF01 = screen.getAllByRole("button", { name: /F01 · Autônomo/ })[0];
    expect(firstF01.querySelector("img")?.getAttribute("src")).toBe("/capability-stickers/levels/INSIGNIA_AUTONOMO.png");
    fireEvent.click(firstF01);
    expect(go).toHaveBeenCalledWith("capacidade", "F01");
  });

  it("links responsibility, sector, and missing capability from the professional journey", async () => {
    const go = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><OfficialCapabilityExperience view="jornada" code="" tab="" mode="" go={go} library={library} people={[{ id: "collaborator-1", name: "Gabi" }]} mappedResponsibilities={[{ id: "resp-413535e8de506f6a", title: "SISRAMOS", sectorId: "sector-1", capabilityIds: ["T01", "T02", "T08"], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }]} /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole("tab", { name: "Responsabilidades" }));
    const row = screen.getByText("SISRAMOS").closest("article");
    expect(row).toBeTruthy();
    expect(within(row!).getByText("Capacitações necessárias e níveis")).toBeTruthy();
    fireEvent.click(within(row!).getByRole("button", { name: "Abrir responsabilidade Gestão Interna" }));
    expect(go).toHaveBeenCalledWith("responsabilidade", "resp-413535e8de506f6a");
    fireEvent.click(within(row!).getByRole("button", { name: "Abrir setor SISRAMOS" }));
    expect(go).toHaveBeenCalledWith("setor", "sector-1");
    fireEvent.click(within(row!).getByRole("button", { name: /T02 · Atual: Não certificado · Exigido: Multiplicador/ }));
    expect(go).toHaveBeenCalledWith("capacidade", "T02");
  });

  it("separates granted responsibilities from the evolution queue", async () => {
    fixture.responsibilityClaims = [{
      id: "claim-1",
      collaborator_id: "collaborator-1",
      responsibility_source_id: "resp-413535e8de506f6a",
      status: "approved",
      requested_at: "2026-10-25T00:00:00.000Z",
      decided_at: "2026-10-26T00:00:00.000Z",
      decided_by: "admin-1",
      decision_note: "Concedida",
    }];
    open("jornada");
    await screen.findByRole("tab", { name: "Concedidas (1)" });
    fireEvent.click(screen.getByRole("tab", { name: "Responsabilidades" }));
    expect(screen.queryByText("SISRAMOS")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Concedidas (1)" }));
    expect(screen.getByRole("heading", { name: "Responsabilidades concedidas" })).toBeTruthy();
    expect(screen.getByText("SISRAMOS")).toBeTruthy();
  });

  it("shows the administrative architecture of careers and functions to Patrick", async () => {
    fixture.profile = { id: "admin-1", name: "Patrick", role: "admin" };
    fixture.certifications = [{ collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 3, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    open("cargos-funcoes");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Cargos e funções" })).toBeTruthy());
    expect(screen.getByRole("heading", { name: "Arquitetura de cargos e funções" })).toBeTruthy();
    expect(screen.getByText("Estratégia do Núcleo Técnico")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Gabi" })).toBeTruthy();
  });

  it("opens the certified capabilities from the personal journey summary", async () => {
    fixture.certifications = [{ collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    const go = open("capacitacoes");
    const summary = await screen.findByRole("button", { name: /Certificadas.*1.*capacidades com nível reconhecido/ });
    fireEvent.click(summary);
    expect(screen.getByRole("heading", { name: "Certificações de Gabi" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /T01.*Gestão de Informações e Acervo/ }));
    expect(go).toHaveBeenCalledWith("capacidade", "T01");
  });

  it("opens training in development from the personal journey summary", async () => {
    fixture.trainingRequests = [{ collaborator_id: "collaborator-1", capability_code: "T01", target_level: 1, status: "requested", requested_by: "admin-1", requested_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    const go = open("capacitacoes");
    const summary = await screen.findByRole("button", { name: /Em desenvolvimento.*1.*capacitações solicitadas/ });
    fireEvent.click(summary);
    const developmentPanel = screen.getByRole("heading", { name: "Capacitações em desenvolvimento" }).closest("section");
    expect(developmentPanel).toBeTruthy();
    fireEvent.click(within(developmentPanel!).getByRole("button", { name: /T01.*Gestão de Informações e Acervo/ }));
    expect(go).toHaveBeenCalledWith("capacitacoes", "T01", "criterios", "colaborador");
  });

  it("filters the full map by the missing next level", async () => {
    fixture.certifications = [{ collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    open("capacidades");
    fireEvent.click(screen.getByRole("button", { name: "Falta Multiplicador" }));
    await waitFor(() => expect(screen.getByText("1 de 28")).toBeTruthy());
    expect(screen.getByRole("img", { name: /T01: Gestão de Informações e Acervo/ })).toBeTruthy();
  });

  it("explains the requested training level and next step on a capability card", async () => {
    fixture.trainingRequests = [{ collaborator_id: "collaborator-1", capability_code: "T01", target_level: 1, status: "requested", requested_by: "admin-1", requested_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" }];
    open("capacidades");
    await waitFor(() => expect(screen.getByText("Capacitação solicitada:")).toBeTruthy());
    expect(screen.getByText("Próximo passo: concluir os critérios do nível solicitado e aguardar a validação.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ver solicitação e critérios" })).toBeTruthy();
  });

  it("shows responsibility readiness from the complete mixed-level capability matrix", async () => {
    fixture.certifications = [
      { collaborator_id: "collaborator-1", capability_code: "T02", certified_level: 3, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
      { collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
      { collaborator_id: "collaborator-1", capability_code: "T08", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
    ];
    const go = open("capacitacoes");
    await screen.findByRole("heading", { name: "Disponibilidade para assumir" });
    expect(screen.queryByRole("heading", { name: "Como ler uma responsabilidade" })).toBeNull();
    expect(screen.getAllByText("Capacitações necessárias e níveis").length).toBeGreaterThan(0);
    expect(screen.getByText("SISRAMOS")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("7 de 7 pontos")).toBeTruthy());
    const row = screen.getByText("SISRAMOS").closest("article");
    expect(row).toBeTruthy();
    fireEvent.click(within(row!).getByRole("button", { name: /Abrir responsabilidade Gestão Interna/ }));
    expect(go).toHaveBeenCalledWith("responsabilidade", "resp-413535e8de506f6a");
    fireEvent.click(within(row!).getByRole("button", { name: "Solicitar responsabilidade" }));
    await waitFor(() => expect(requestResponsibility).toHaveBeenCalledWith("collaborator-1", "resp-413535e8de506f6a"));
  });

  it("opens the mapped sector from a responsibility row in the journey", async () => {
    fixture.certifications = [
      { collaborator_id: "collaborator-1", capability_code: "T02", certified_level: 3, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
      { collaborator_id: "collaborator-1", capability_code: "T01", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
      { collaborator_id: "collaborator-1", capability_code: "T08", certified_level: 2, certified_by: "admin-1", certified_at: "2026-10-25T00:00:00.000Z", updated_at: "2026-10-25T00:00:00.000Z" },
    ];
    const go = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><OfficialCapabilityExperience view="capacitacoes" code="" tab="jornada" mode="" go={go} library={library} people={[{ id: "collaborator-1", name: "Gabi" }]} mappedResponsibilities={[{ id: "resp-413535e8de506f6a", title: "SISRAMOS", sectorId: "sector-1", capabilityIds: ["T01", "T02", "T08"], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }]} /></QueryClientProvider>);
    const row = await screen.findByText("SISRAMOS");
    fireEvent.click(within(row.closest("article")!).getByRole("button", { name: "Abrir setor SISRAMOS" }));
    expect(go).toHaveBeenCalledWith("setor", "sector-1");
  });

  it("shows the capabilities and responsibility impact behind the next steps summary", async () => {
    const go = open("capacitacoes");
    const summary = await screen.findByRole("button", { name: /Próximos passos.*Ver capacidades e impactos/ });
    fireEvent.click(summary);
    expect(go).toHaveBeenCalledWith("capacitacoes", undefined, "proximas");
    cleanup();
    open("capacitacoes", "", "proximas");
    expect(await screen.findByRole("heading", { name: "Próximas capacitações" })).toBeTruthy();
    expect(screen.getAllByText(/Impacta \d+ responsabilidades?/).length).toBeGreaterThan(0);
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
