// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({ data: queryKey.at(-1) === "documento" ? remote.document : fixture, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }),
  useQueryClient: () => ({ setQueryData: vi.fn() }),
}));
vi.mock("@/features/master-plan-preview/remote", () => ({
  fetchRemoteMasterPlanDraft: vi.fn(),
  updateRemoteMasterPlanDraft: vi.fn(async (update: (value: Record<string, unknown>) => Record<string, unknown>) => {
    remote.document = update(remote.document);
    return remote.document;
  }),
}));
vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
beforeEach(() => {
  window.localStorage.clear();
  remote.document = { version: 1, savedAt: "", nucleusOverrides: {}, capabilities: [], responsibilities: [], requests: [], responsibilityOverrides: {}, requestPlans: {}, trainingRequests: [], claims: [], nucleusThresholds: {} };
});
afterEach(cleanup);

function openPreview(initial = "/universo-ramos/plano-mestre") {
  return render(<MemoryRouter initialEntries={[initial]}><Routes><Route path="/universo-ramos/plano-mestre" element={<PlanoMestrePreview />} /></Routes></MemoryRouter>);
}

const nav = () => within(screen.getByRole("navigation", { name: "Páginas do Plano Mestre" }));
const main = () => within(screen.getByRole("main"));

describe("Plano Mestre organizational preview", () => {
  it("opens all ten pages without treating proposals as registered data", () => {
    openPreview();
    const pages = [
      ["Visão geral", "Mapa da Ramos"], ["Núcleos", "Núcleos"], ["Setores", "Setores"],
      ["Responsabilidades", "Responsabilidades"], ["Capacidades", "Banco de capacidades"],
      ["Capacitações", "Capacitações e oportunidades"], ["Solicitações", "Solicitações"],
      ["Cronologia", "Cronologia"], ["Minha jornada", "Minha jornada"],
      ["Cobertura e sucessão", "Cobertura e sucessão"],
    ];
    for (const [button, heading] of pages) {
      fireEvent.click(nav().getByRole("button", { name: button }));
      expect(main().getByRole("heading", { name: heading })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", { name: "Entenda os dados" }));
    expect(screen.getByText(/Do banco operacional:/)).toBeTruthy();
    expect(screen.getByText(/Do Plano Mestre:/)).toBeTruthy();
  });

  it("starts with sectors and people but no inferred capabilities or responsibilities", () => {
    openPreview();
    expect(main().getByText("Gabi")).toBeTruthy();
    expect(main().getAllByText("0 mapeadas")).toHaveLength(2);
    fireEvent.click(main().getByRole("button", { name: /Núcleo Técnico/ }));
    fireEvent.click(main().getByRole("button", { name: /SETOR DE PROJETOS1 desafio/ }));
    expect(main().getByRole("button", { name: "Cadastrar primeira capacidade" })).toBeTruthy();
    expect(main().getByRole("button", { name: "Cadastrar primeira responsabilidade" })).toBeTruthy();
    expect(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ })).toBeTruthy();
    fireEvent.click(nav().getByRole("button", { name: "Capacitações" }));
    expect(main().getByText("Nenhuma capacidade cadastrada no Plano Mestre.")).toBeTruthy();
    expect(main().getByText("Nenhuma responsabilidade cadastrada no Plano Mestre.")).toBeTruthy();
  });

  it("saves a capability and responsibility before linking them", async () => {
    openPreview();
    fireEvent.click(main().getByRole("button", { name: /SETOR DE PROJETOS/ }));
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
    fireEvent.click(nav().getByRole("button", { name: "Solicitações" }));
    fireEvent.click(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ }));
    expect(main().getByText("Definir um padrão oficial.")).toBeTruthy();
    expect(main().getByText(/ID de origem preservado: real-challenge/)).toBeTruthy();
  });

  it("keeps registered records after reopening the page", async () => {
    const rendered = openPreview();
    fireEvent.click(main().getByRole("button", { name: "Nova capacidade" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos" } });
    fireEvent.change(dialog.getByLabelText("Setor existente"), { target: { value: "projects" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos" })).toBeTruthy());
    rendered.unmount();
    openPreview();
    expect(main().getByText("1 mapeada")).toBeTruthy();
    expect(main().getByText("Gabi")).toBeTruthy();
  });

  it("edits a saved capability after registration", async () => {
    openPreview();
    fireEvent.click(main().getByRole("button", { name: "Nova capacidade" }));
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
    openPreview();
    fireEvent.click(main().getByRole("button", { name: "Nova capacidade" }));
    let dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Título"), { target: { value: "Revisar projetos" } });
    fireEvent.change(dialog.getByLabelText("Setor existente"), { target: { value: "projects" } });
    fireEvent.click(dialog.getByRole("button", { name: "Salvar no Plano Mestre" }));
    await waitFor(() => expect(main().getByRole("heading", { name: "Revisar projetos" })).toBeTruthy());
    fireEvent.click(nav().getByRole("button", { name: "Responsabilidades" }));
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

  it("keeps a clear return path without adding sector tabs to the trail", () => {
    openPreview();
    fireEvent.click(main().getByRole("button", { name: /Núcleo Técnico/ }));
    fireEvent.click(main().getByRole("button", { name: /SETOR DE PROJETOS1 desafio/ }));
    fireEvent.click(main().getByRole("tab", { name: "Capacidades" }));
    expect(main().getByRole("tab", { name: "Capacidades" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(main().getByRole("button", { name: "Voltar" }));
    expect(main().getByRole("heading", { name: "Núcleo Técnico" })).toBeTruthy();
  });

  it("saves regrouping of existing sectors without changing their names", async () => {
    openPreview();
    fireEvent.click(nav().getByRole("button", { name: "Núcleos" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Núcleo de SETOR DE PROJETOS" }), { target: { value: "suporte" } });
    expect(main().getByRole("button", { name: /Núcleo Suporte/ })).toBeTruthy();
    expect(screen.getAllByText("SETOR DE PROJETOS").length).toBeGreaterThan(0);
    await waitFor(() => expect((screen.getByRole("combobox", { name: "Núcleo de SETOR DE PROJETOS" }) as HTMLSelectElement).value).toBe("suporte"));
  });

  it("keeps challenge-derived requests in Kanban and marks missing responsibility for classification", () => {
    openPreview();
    fireEvent.click(nav().getByRole("button", { name: "Solicitações" }));
    expect(main().getByLabelText("Kanban de solicitações")).toBeTruthy();
    expect(main().getByText("A classificar")).toBeTruthy();
    fireEvent.click(main().getByRole("button", { name: "Lista" }));
    expect(main().getByRole("button", { name: /Criar o Padrão Ramos de Projetos/ })).toBeTruthy();
  });

  it("shows where forms are persisted", () => {
    openPreview();
    fireEvent.click(nav().getByRole("button", { name: "Responsabilidades" }));
    fireEvent.click(main().getByRole("button", { name: "Nova responsabilidade" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/grava no Plano Mestre/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps planning changes and leaves unclassified requests unlinked", async () => {
    openPreview();
    fireEvent.click(nav().getByRole("button", { name: "Solicitações" }));
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
