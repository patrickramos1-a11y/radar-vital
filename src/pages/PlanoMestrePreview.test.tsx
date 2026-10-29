// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateRemoteMasterPlanDraft } from "@/features/master-plan-preview/remote";
import PlanoMestrePreview from "./PlanoMestrePreview";

const fixture = vi.hoisted(() => ({
  readAt: "2026-10-24T12:00:00Z",
  units: [
    { id: "projects", name: "SETOR DE PROJETOS", universe_category: "SETOR", logo_url: "/universe-sectors/04-setor-de-projetos.png" },
    { id: "training", name: "TREINAMENTOS", universe_category: "SETOR", logo_url: null },
    { id: "company", name: "RAMOS ENGENHARIA", universe_category: "EMPRESA", logo_url: null },
  ],
  challenges: [{ id: "real-challenge", client_id: "projects", title: "Criar o Padrão Ramos de Projetos", description: "Definir um padrão oficial.", status: "open", created_at: "2026-10-24T12:00:00Z", due_at: null, expected_deliverable: null, success_criteria: "" }],
  tasks: [{ id: "real-task", client_id: "training", title: "Treinamento de outorga", status: "pendente", completed: false, completed_at: null, created_at: "2026-10-24T12:00:00Z", due_date: null, assigned_to: [] }],
  comments: [{ id: "real-comment", client_id: "projects", comment_text: "Criar um desafio sobre mapas modelos", author_name: "Patrick", created_at: "2026-10-24T12:00:00Z" }],
  collaborators: [{ id: "person-1", name: "Gabi", is_active: true, photo_url: null }],
}));

const remote = vi.hoisted(() => ({
  document: {
    version: 1 as const, savedAt: "", nucleusOverrides: {}, capabilities: [],
    responsibilities: [], requests: [], responsibilityOverrides: {}, requestPlans: {},
    trainingRequests: [], claims: [], nucleusThresholds: {},
  } as Record<string, unknown>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({ data: queryKey.at(-1) === "documento" ? remote.document : queryKey[0] === "master-plan-requests" ? [] : fixture, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }),
  useQueryClient: () => ({ setQueryData: vi.fn() }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: { id: "person-1", name: "Gabi", role: "admin" }, loading: false }),
}));
vi.mock("@/features/master-plan-preview/remote", () => ({
  fetchRemoteMasterPlanDraft: vi.fn(),
  updateRemoteMasterPlanDraft: vi.fn(async (update: (value: Record<string, unknown>) => Record<string, unknown>) => {
    remote.document = update(remote.document);
    return remote.document;
  }),
}));
vi.mock("@/components/layout/AppLayout", async () => {
  const { Link } = await import("react-router-dom");
  const views = [
    ["Visão geral", "empresa"], ["Núcleos", "nucleos"], ["Setores", "setores"],
    ["Responsabilidades", "responsabilidades"], ["Capacidades", "capacidades"],
    ["Capacitações", "capacitacoes"], ["Solicitações", "solicitacoes"],
    ["Cronologia", "cronologia"], ["Minha jornada", "jornada"], ["Cobertura e sucessão", "cobertura"],
  ];
  return { AppLayout: ({ children, navigationTools }: { children: React.ReactNode; navigationTools?: React.ReactNode }) => <>
    <nav aria-label="Visões de Plano Mestre">{views.map(([label, view]) => <Link key={view} to={`?view=${view}`}>{label}</Link>)}</nav>
    {navigationTools}{children}
  </> };
});
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
beforeEach(() => {
  window.localStorage.clear();
  remote.document = { version: 1, savedAt: "", nucleusOverrides: {}, capabilities: [], responsibilities: [], requests: [], responsibilityOverrides: {}, requestPlans: {}, trainingRequests: [], claims: [], nucleusThresholds: {} };
});
afterEach(cleanup);

function openPreview(initial = "/universo-ramos/plano-mestre") {
  return render(<MemoryRouter initialEntries={[initial]}><Routes><Route path="/universo-ramos/plano-mestre" element={<PlanoMestrePreview />} /></Routes></MemoryRouter>);
}

const nav = () => within(screen.getByRole("navigation", { name: "Visões de Plano Mestre" }));
const main = () => within(screen.getByRole("main"));

describe("Plano Mestre organizational preview", () => {
  it("opens an institutional sector directly and searches the eleven-sector directory", () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=SET-01");
    expect(main().getByRole("heading", { name: "Setor Projetos" })).toBeTruthy();
    expect(main().queryByRole("tab", { name: /Áreas/ })).toBeNull();
    expect(main().getByRole("button", { name: "Abrir funções do setor" })).toBeTruthy();
    fireEvent.click(nav().getByRole("link", { name: "Setores" }));
    fireEvent.change(main().getByPlaceholderText("Buscar setor ou missão"), { target: { value: "Marketing" } });
    expect(main().getByRole("button", { name: /Setor Marketing/ })).toBeTruthy();
    expect(main().queryByRole("button", { name: /Setor Projetos/ })).toBeNull();
  });

  it("shows the sector visual identity, real outputs, work flow and linked capabilities", () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=SET-01");
    expect(main().getByText("Da leitura ao projeto")).toBeTruthy();
    expect(main().getByRole("img", { name: /Camadas de terreno, água/ }).getAttribute("src")).toBe("/organization-map/sectors/projetos.webp");
    expect(main().getByRole("heading", { name: "O que o setor entrega" })).toBeTruthy();
    expect(main().getByText("Estudos, planos, projetos, relatórios técnicos, memoriais e pranchas revisados")).toBeTruthy();
    expect(main().getByText("Dados e requisitos")).toBeTruthy();
    expect(main().getByRole("button", { name: "Abrir competências do setor" })).toBeTruthy();
    fireEvent.click(main().getByRole("tab", { name: /Capacidades/ }));
    expect(main().getByRole("button", { name: /F01.*Gestão de Demandas e Fluxo Operacional/ })).toBeTruthy();
    expect(main().queryByRole("button", { name: /Solicitar nível/ })).toBeNull();
    expect(updateRemoteMasterPlanDraft).not.toHaveBeenCalled();
  });

  it("keeps organizational responsibilities hidden from sector and function pages", () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=SET-03&tab=responsabilidades");
    expect(main().getByRole("heading", { name: "Setor Gestão Interna" })).toBeTruthy();
    expect(main().getByRole("tab", { name: "Visão geral" }).getAttribute("aria-selected")).toBe("true");
    expect(main().queryByRole("tab", { name: /Responsabilidades/ })).toBeNull();
    cleanup();
    openPreview("/universo-ramos/plano-mestre?view=funcao&id=FUN-001");
    expect(main().getByRole("heading", { name: "Coordenador(a) de Gestão Interna" })).toBeTruthy();
    expect(main().queryByRole("heading", { name: "Responsabilidades relacionadas" })).toBeNull();
    expect(main().getByRole("heading", { name: "Competências requeridas" })).toBeTruthy();
    expect(remote.document).toMatchObject({ capabilities: [], responsibilities: [] });
    expect(updateRemoteMasterPlanDraft).not.toHaveBeenCalled();
  });

  it("shows complete proposed capability levels without certification actions", () => {
    openPreview("/universo-ramos/plano-mestre?view=competencia-manual&id=COMP-057");
    expect(main().getByRole("heading", { name: "Marketing Digital e Conteúdo" })).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: /Planejamento de Conteúdo e Canais Digitais/ }));
    expect(main().getByRole("heading", { name: "Planejamento de Conteúdo e Canais Digitais" })).toBeTruthy();
    expect(main().getByRole("heading", { name: "Assistido" })).toBeTruthy();
    expect(main().getByRole("heading", { name: "Autônomo" })).toBeTruthy();
    expect(main().getByRole("heading", { name: "Multiplicador" })).toBeTruthy();
    expect(main().queryByRole("button", { name: /Solicitar/ })).toBeNull();
    expect(updateRemoteMasterPlanDraft).not.toHaveBeenCalled();
  });

  it("starts the sectors page without duplicate heading or breadcrumb bars", () => {
    openPreview("/universo-ramos/plano-mestre?view=setores");
    expect(main().getByRole("heading", { name: "Setores" })).toBeTruthy();
    expect(main().queryByRole("button", { name: "Voltar" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Plano Mestre" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ferramentas do Plano Mestre" })).toBeTruthy();
  });

  it("opens the library focused on the sector from its responsibilities tab", () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=projects&tab=responsabilidades");
    fireEvent.click(main().getByRole("button", { name: "Vincular da biblioteca" }));
    expect(main().getByText("Vincular responsabilidades a SETOR DE PROJETOS")).toBeTruthy();
    expect((main().getByRole("combobox", { name: "Filtrar responsabilidades por setor" }) as HTMLSelectElement).value).toBe("projects");
  });

  it("derives sector capabilities from its saved responsibilities", async () => {
    remote.document = {
      version: 1, savedAt: "2026-10-25T20:00:00Z", nucleusOverrides: {}, requests: [], responsibilityOverrides: {}, requestPlans: {}, trainingRequests: [], claims: [], nucleusThresholds: {},
      capabilities: [{ id: "cap-prazo", title: "Gestão de Prazos", sectorIds: [], sourceChallengeIds: [], status: "local" }],
      responsibilities: [{ id: "resp-projetos", title: "Controlar entregas de projeto", sectorId: "projects", capabilityIds: ["cap-prazo"], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }],
    };
    openPreview("/universo-ramos/plano-mestre?view=setor&id=projects&tab=capacidades");
    await waitFor(() => expect(main().getByRole("button", { name: /Gestão de Prazos/ })).toBeTruthy());
    expect(main().getByText("Exigida por responsabilidade deste setor")).toBeTruthy();
  });

  it("explains when a sector has no saved library mapping", () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=training&tab=responsabilidades");
    expect(main().getByText("Este setor ainda não recebeu responsabilidades da biblioteca.")).toBeTruthy();
  });

  it("filters responsibilities by the highest capability level required", () => {
    remote.document = {
      version: 1, savedAt: "2026-10-25T20:00:00Z", nucleusOverrides: {}, capabilities: [], requests: [], responsibilityOverrides: {}, requestPlans: {}, trainingRequests: [], claims: [], nucleusThresholds: {},
      responsibilities: [
        { id: "resp-471106dc089e627c", title: "Administrativo / Marketing", sectorId: "projects", capabilityIds: [], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" },
        { id: "resp-20ec4169bc18b765", title: "Controle de Informações", sectorId: "projects", capabilityIds: [], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" },
        { id: "resp-413535e8de506f6a", title: "SISRAMOS", sectorId: "projects", capabilityIds: [], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" },
      ],
    };
    openPreview("/universo-ramos/plano-mestre?view=responsabilidades");
    const catalog = () => within(main().getByTestId("responsibility-catalog"));
    expect(main().getByText("3")).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: "Autônomo" }));
    expect(catalog().getByText("Controle de Informações")).toBeTruthy();
    expect(catalog().queryByText("SISRAMOS")).toBeNull();
    fireEvent.click(main().getByRole("button", { name: "Multiplicador" }));
    expect(catalog().getByText("SISRAMOS")).toBeTruthy();
    expect(catalog().queryByText("Controle de Informações")).toBeNull();
  });

  it("moves granted responsibilities from available items to the personal tab", () => {
    remote.document = {
      version: 1, savedAt: "2026-10-25T20:00:00Z", nucleusOverrides: {}, capabilities: [], requests: [], responsibilityOverrides: {}, requestPlans: {}, trainingRequests: [], claims: [], nucleusThresholds: {},
      responsibilities: [{ id: "resp-concedida", title: "Conferir qualidade", sectorId: "projects", capabilityIds: [], sourceChallengeIds: [], holderId: "person-1", substituteId: null, status: "local" }],
    };
    openPreview("/universo-ramos/plano-mestre?view=responsabilidades&tab=minhas");
    expect(main().getByRole("heading", { name: "Minhas responsabilidades" })).toBeTruthy();
    expect(main().getByRole("button", { name: /Conferir qualidade/ })).toBeTruthy();
    fireEvent.click(main().getByRole("tab", { name: "Disponíveis para mim" }));
    expect(main().queryByRole("button", { name: /Conferir qualidade/ })).toBeNull();
  });

  it("opens a source capability directly and returns to the local preview catalog", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacidade&id=F04");
    expect(main().getByTestId("capability-experience")).toBeTruthy();
    expect(main().getByRole("button", { name: "Banco de capacidades" })).toBeTruthy();
    fireEvent.click(main().getByRole("tab", { name: "Níveis e evidências" }));
    expect(main().getByRole("heading", { name: "Do apoio à multiplicação" })).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: "Banco de capacidades" }));
    expect(main().getByText("39 de 39 capacidades")).toBeTruthy();
    fireEvent.change(main().getByRole("textbox", { name: "Buscar capacidades" }), { target: { value: "F04" } });
    expect(main().getByText("1 de 39 capacidades")).toBeTruthy();
  });

  it("keeps position across tabs and links T04 to its prerequisite", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacidade&id=T04&tab=visao");
    expect(main().getByText(/Cada prazo relevante precisa ter origem/)).toBeTruthy();
    expect(main().getByText(/Organizar prazos legais, contratuais e internos/)).toBeTruthy();
    document.documentElement.scrollTop = 350;
    fireEvent.click(main().getByRole("tab", { name: "Níveis e evidências" }));
    expect(document.documentElement.scrollTop).toBe(350);
    fireEvent.click(main().getByRole("tab", { name: "Visão geral" }));
    fireEvent.click(main().getByRole("button", { name: /T02.*Uso e Integridade do SISRAMOS/ }));
    expect(main().getByRole("heading", { name: "Uso e Integridade do SISRAMOS" })).toBeTruthy();
  });

  it("keeps the capacity identity and title together in the desktop composition", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacidade&id=T04&tab=visao");
    expect(main().getByRole("heading", { name: "Gestão de Prazos e Prioridades" }).closest(".cap-sheet-identity")).toBeTruthy();
  });

  it("does not silently replace an invalid source code with another capability", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacidade&id=F99");
    expect(main().getByText("Capacidade não encontrada neste catálogo.")).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: "Voltar ao catálogo" }));
    expect(main().getByRole("heading", { name: "Banco de capacidades" })).toBeTruthy();
  });

  it("keeps self-assessments in memory and indicates the lowest answer", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacitacoes&id=F04");
    const answers = main().getAllByRole("button", { name: "Consigo ensinar" });
    answers.forEach((button) => fireEvent.click(button));
    fireEvent.click(main().getAllByRole("button", { name: "Com apoio" })[1]);
    expect(main().getByText("Nível indicado: Assistido")).toBeTruthy();
    fireEvent.change(main().getByRole("textbox", { name: "Comentário da autoavaliação" }), { target: { value: "Atuo com apoio na análise." } });
    fireEvent.click(main().getByRole("button", { name: "Registrar na simulação" }));
    expect(main().getByText("Atuo com apoio na análise.")).toBeTruthy();
    expect(localStorage.length).toBe(0);
    expect(updateRemoteMasterPlanDraft).not.toHaveBeenCalled();
  });

  it("reviews every criterion before enabling a simulated approval", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacitacoes&id=F04&mode=administrador");
    const approve = main().getByRole("button", { name: "Aprovar na simulação" }) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    const criterionCount = main().getAllByRole("button", { name: "Aceitar" }).length;
    expect(criterionCount).toBeGreaterThan(0);
    for (let index = 0; index < criterionCount; index += 1) {
      fireEvent.click(main().getAllByRole("button", { name: "Aceitar" })[index]);
    }
    expect(approve.disabled).toBe(false);
    fireEvent.click(approve);
    expect(main().getByText(/Aprovado apenas na simulação/)).toBeTruthy();
    expect(updateRemoteMasterPlanDraft).not.toHaveBeenCalled();
  });

  it("opens all ten pages without treating proposals as registered data", () => {
    openPreview();
    const pages = [
      ["Visão geral", "Como a empresa se organiza e atua."], ["Núcleos", "Núcleos da Ramos Engenharia"], ["Setores", "Setores"],
      ["Responsabilidades", "Responsabilidades"], ["Capacidades", "Banco de capacidades"],
      ["Capacitações", "Minha capacitação"], ["Solicitações", "Solicitações"],
      ["Cronologia", "Cronologia"], ["Minha jornada", "Minha jornada"],
      ["Cobertura e sucessão", "Cobertura e sucessão"],
    ];
    for (const [button, heading] of pages) {
      fireEvent.click(nav().getByRole("link", { name: button }));
      expect(main().getByRole("heading", { name: heading })).toBeTruthy();
    }
    fireEvent.pointerDown(screen.getByRole("button", { name: "Ferramentas do Plano Mestre" }), { button: 0, ctrlKey: false });
    fireEvent.click(screen.getByRole("menuitem", { name: "Entenda os dados" }));
    expect(screen.getByText(/Do banco operacional:/)).toBeTruthy();
    expect(screen.getByText(/Do Plano Mestre:/)).toBeTruthy();
  });

  it("starts with sectors and people but no inferred capabilities or responsibilities", () => {
    openPreview();
    expect(main().getByRole("navigation", { name: "Núcleos" }).querySelectorAll("button")).toHaveLength(3);
    const map = main().getByRole("region", { name: "Organograma interativo" });
    expect(map.querySelectorAll(".organization-map-lane.is-compact")).toHaveLength(3);
    fireEvent.click(main().getByRole("button", { name: "Expandir Núcleo Técnico" }));
    expect(map.querySelectorAll(".organization-map-sector")).toHaveLength(4);
    cleanup();
    openPreview("/universo-ramos/plano-mestre?view=setor&id=projects");
    expect(main().getByRole("button", { name: "Cadastrar primeira capacidade" })).toBeTruthy();
    expect(main().getByRole("button", { name: "Cadastrar primeira responsabilidade" })).toBeTruthy();
    expect(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ })).toBeTruthy();
    fireEvent.click(nav().getByRole("link", { name: "Capacitações" }));
    expect(main().getByRole("heading", { name: "Minha capacitação" })).toBeTruthy();
    expect(main().getByText("Prévia visual.")).toBeTruthy();
    expect(remote.document.capabilities).toEqual([]);
    expect(remote.document.responsibilities).toEqual([]);
  });

  it("saves a capability and responsibility before linking them", async () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=projects");
    fireEvent.click(main().getByRole("button", { name: "Cadastrar primeira capacidade" }));
    let dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos" })).toBeTruthy());
    fireEvent.click(main().getByRole("button", { name: "Voltar" }));
    fireEvent.click(main().getByRole("button", { name: "Cadastrar primeira responsabilidade" }));
    dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Conferir qualidade dos projetos" } });
    const capabilityOption = dialog.getByRole("option", { name: "Revisar projetos" }) as HTMLOptionElement;
    fireEvent.change(dialog.getByLabelText("Capacidade necessária"), { target: { value: capabilityOption.value } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Conferir qualidade dos projetos" })).toBeTruthy());
    expect(main().getAllByText("Revisar projetos").length).toBeGreaterThan(0);
    fireEvent.click(nav().getByRole("link", { name: "Solicitações" }));
    fireEvent.click(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ }));
    expect(main().getByText("Definir um padrão oficial.")).toBeTruthy();
    expect(main().getByText(/ID de origem preservado: real-challenge/)).toBeTruthy();
  });

  it("keeps registered records after reopening the page", async () => {
    const rendered = openPreview("/universo-ramos/plano-mestre?view=setor&id=projects");
    fireEvent.click(main().getByRole("button", { name: "Cadastrar primeira capacidade" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos" } });
    fireEvent.change(dialog.getByLabelText("Setor existente"), { target: { value: "projects" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos" })).toBeTruthy());
    rendered.unmount();
    openPreview("/universo-ramos/plano-mestre?view=capacidades&mode=atual");
    expect(main().getByText("Revisar projetos")).toBeTruthy();
  });

  it("edits a saved capability after registration", async () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=projects");
    fireEvent.click(main().getByRole("button", { name: "Cadastrar primeira capacidade" }));
    let dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos" } });
    fireEvent.change(dialog.getByLabelText("Setor existente"), { target: { value: "projects" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos" })).toBeTruthy());
    fireEvent.click(main().getByRole("button", { name: "Editar" }));
    dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos ambientais" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos ambientais" })).toBeTruthy());
  });

  it("edits a responsibility and unlinks a capability", async () => {
    openPreview("/universo-ramos/plano-mestre?view=setor&id=projects");
    fireEvent.click(main().getByRole("button", { name: "Cadastrar primeira capacidade" }));
    let dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos" } });
    fireEvent.change(dialog.getByLabelText("Setor existente"), { target: { value: "projects" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos" })).toBeTruthy());
    fireEvent.click(nav().getByRole("link", { name: "Responsabilidades" }));
    fireEvent.click(main().getByRole("button", { name: "Nova responsabilidade" }));
    dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Conferir qualidade" } });
    fireEvent.change(dialog.getByLabelText("Setor existente"), { target: { value: "projects" } });
    const capability = dialog.getByRole("option", { name: "Revisar projetos" }) as HTMLOptionElement;
    fireEvent.change(dialog.getByLabelText("Capacidade necessária"), { target: { value: capability.value } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Conferir qualidade" })).toBeTruthy());
    fireEvent.click(main().getByRole("button", { name: "Editar" }));
    dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Conferir qualidade técnica" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Conferir qualidade técnica" })).toBeTruthy());
    fireEvent.click(main().getByRole("button", { name: "Desvincular Revisar projetos" }));
    await waitFor(() => expect(main().getByText("Nenhuma capacidade vinculada.")).toBeTruthy());
  });

  it("explains how to restore a missing detail", () => {
    openPreview("/universo-ramos/plano-mestre?view=capacidade&id=local-expired");
    expect(main().getByText(/Importe o backup/)).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: "Ver capacidades" }));
    expect(main().getByRole("heading", { name: "Banco de capacidades" })).toBeTruthy();
  });

  it("returns from the sector sheet to the organization map", () => {
    openPreview();
    fireEvent.click(main().getByRole("button", { name: "Expandir Núcleo Técnico" }));
    fireEvent.click(main().getByRole("button", { name: /5 funções essenciaisSetor Projetos/ }));
    fireEvent.click(main().getByRole("button", { name: "Abrir ficha do setor" }));
    fireEvent.click(main().getByRole("tab", { name: /Funções/ }));
    expect(main().getByRole("tab", { name: /Funções/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(main().getByRole("button", { name: "Voltar" }));
    expect(main().getByRole("heading", { name: "Como a empresa se organiza e atua." })).toBeTruthy();
  });

  it("saves regrouping of existing sectors without changing their names", async () => {
    openPreview();
    fireEvent.click(nav().getByRole("link", { name: "Núcleos" }));
    fireEvent.click(main().getByRole("tab", { name: "Cadastro operacional" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Núcleo de SETOR DE PROJETOS" }), { target: { value: "suporte" } });
    expect(main().getByRole("button", { name: /Núcleo Suporte/ })).toBeTruthy();
    expect(screen.getAllByText("SETOR DE PROJETOS").length).toBeGreaterThan(0);
    await waitFor(() => expect((screen.getByRole("combobox", { name: "Núcleo de SETOR DE PROJETOS" }) as HTMLSelectElement).value).toBe("suporte"));
  });

  it("keeps challenge-derived requests in Kanban and marks missing responsibility for classification", () => {
    openPreview();
    fireEvent.click(nav().getByRole("link", { name: "Solicitações" }));
    expect(main().getByLabelText("Kanban de solicitações")).toBeTruthy();
    expect(main().getByText("A classificar")).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: "Lista" }));
    expect(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ })).toBeTruthy();
  });

  it("shows where forms are persisted", () => {
    openPreview();
    fireEvent.click(nav().getByRole("link", { name: "Responsabilidades" }));
    fireEvent.click(main().getByRole("button", { name: "Nova responsabilidade" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/grava no Plano Mestre/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps planning changes and leaves unclassified requests unlinked", async () => {
    openPreview();
    fireEvent.click(nav().getByRole("link", { name: "Solicitações" }));
    fireEvent.click(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ }));
    fireEvent.click(main().getByRole("button", { name: "Planejar solicitação" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByLabelText("Responsabilidade").querySelectorAll("option")).toHaveLength(1);
    fireEvent.change(dialog.getByLabelText("Mês de tratamento"), { target: { value: "2026-11" } });
    fireEvent.change(dialog.getByLabelText("Condição de avanço"), { target: { value: "Aguardando equipe habilitada" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByText("2026-11")).toBeTruthy());
    expect(main().getByText("Aguardando equipe habilitada")).toBeTruthy();
    expect(main().queryByRole("button", { name: "Abrir responsabilidade" })).toBeNull();
  });
});
