// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppNavigation } from "./AppNavigation";

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ toggleSidebar: vi.fn(), state: "collapsed", isMobile: false, openMobile: false }),
}));
vi.mock("./UserSelector", () => ({ UserSelector: () => <button type="button">Perfil</button> }));

function open(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={<AppNavigation onRefresh={vi.fn()} />} /></Routes></MemoryRouter>);
}

afterEach(cleanup);

describe("AppNavigation", () => {
  it("shows modules and views without redundant global controls", () => {
    open("/universo-ramos/plano-mestre?view=capacidades");
    for (const name of [/Área atual/, /Ir para página/, /Buscar páginas/, /Histórico/]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    const modules = within(screen.getByRole("navigation", { name: "Módulos" }));
    const views = within(screen.getByRole("navigation", { name: "Visões de Plano Mestre" }));
    expect(screen.getByRole("navigation", { name: "Módulos" }).parentElement?.classList.contains("app-navigation-top")).toBe(true);
    expect(screen.queryByRole("link", { name: /SISRAMOS/ })).toBeNull();
    expect(modules.getByRole("link", { name: "Plano Mestre" }).getAttribute("aria-current")).toBe("page");
    expect(views.getByRole("link", { name: "Capacidades" }).getAttribute("aria-current")).toBe("page");
    expect(views.getByRole("link", { name: "Solicitações" }).getAttribute("href")).toBe("/universo-ramos/plano-mestre?view=solicitacoes");
  });

  it("updates the selected Central de Entregas view from the URL", () => {
    open("/central-entregas?tab=deliverables");
    const views = within(screen.getByRole("navigation", { name: "Visões de Central de Entregas" }));
    expect(views.getByRole("link", { name: "Entregáveis" }).getAttribute("aria-current")).toBe("page");
  });

  it("keeps refresh and profile accessible", () => {
    open("/dashboard");
    expect(screen.getByRole("button", { name: /Atualizar aplicativo/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Perfil" })).toBeTruthy();
  });
});
