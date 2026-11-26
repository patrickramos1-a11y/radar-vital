import type { LucideIcon } from "lucide-react";
import {
  Archive, BarChart3, BookOpen, BriefcaseBusiness, CalendarDays,
  ClipboardList, FileUp, GitBranch, Globe2, GraduationCap, Landmark,
  Layers3, LayoutDashboard, ListChecks, MessageSquare, Settings,
  ShieldCheck, ShieldAlert, Sparkles, Target, TrendingUp, Users,
  Package, Workflow,
} from "lucide-react";

export type NavigationItem = { label: string; href: string; icon: LucideIcon; key: string };
export type NavigationModule = NavigationItem & { views: NavigationItem[]; context: "ac" | "ramos" };

const masterPlan = (view: string) => `/universo-ramos/plano-mestre?view=${view}`;
const deliveries = (tab: string) => `/central-entregas?tab=${tab}`;

export const navigationModules: NavigationModule[] = [
  {
    key: "painel", label: "Painel AC", href: "/", icon: LayoutDashboard, context: "ac",
    views: [
      { key: "inicio", label: "Visão geral", href: "/", icon: LayoutDashboard },
      { key: "indicadores", label: "Indicadores", href: "/dashboard", icon: BarChart3 },
      { key: "comentarios", label: "Comentários", href: "/comentarios", icon: MessageSquare },
      { key: "relatorios", label: "Relatórios PDF", href: "/relatorios-pdf", icon: FileUp },
      { key: "config", label: "Configurações", href: "/config", icon: Settings },
    ],
  },
  {
    key: "processos", label: "Processos", href: "/processos", icon: Workflow, context: "ac",
    views: [
      { key: "processos", label: "Processos", href: "/processos", icon: Workflow },
      { key: "gestao", label: "Gestão de processos", href: "/jackbox-unificado", icon: ListChecks },
      { key: "quadro", label: "Quadro de clientes", href: "/jackbox", icon: LayoutDashboard },
    ],
  },
  {
    key: "entregas", label: "Central", href: "/central-entregas", icon: Target, context: "ac",
    views: [
      { key: "processos", label: "Processos", href: deliveries("processos"), icon: Workflow },
      { key: "comments", label: "Comentários", href: deliveries("comments"), icon: MessageSquare },
      { key: "deliverables", label: "Entregáveis", href: deliveries("deliverables"), icon: Package },
      { key: "challenges", label: "Desafios", href: deliveries("challenges"), icon: Sparkles },
      { key: "history", label: "Histórico", href: deliveries("history"), icon: Archive },
      { key: "performance", label: "Performance", href: deliveries("performance"), icon: TrendingUp },
    ],
  },
  {
    key: "universo", label: "Universo Ramos", href: "/universo-ramos", icon: Globe2, context: "ramos",
    views: [
      { key: "universo", label: "Visão geral", href: "/universo-ramos", icon: Globe2 },
      { key: "setores", label: "Setores", href: masterPlan("setores"), icon: BriefcaseBusiness },
      { key: "solicitacoes", label: "Solicitações", href: masterPlan("solicitacoes"), icon: ClipboardList },
      { key: "capacidades", label: "Capacidades", href: masterPlan("capacidades"), icon: BookOpen },
    ],
  },
  {
    key: "plano", label: "Plano Mestre", href: "/universo-ramos/plano-mestre", icon: Layers3, context: "ramos",
    views: [
      { key: "empresa", label: "Visão geral", href: masterPlan("empresa"), icon: LayoutDashboard },
      { key: "nucleos", label: "Núcleos", href: masterPlan("nucleos"), icon: Layers3 },
      { key: "setores", label: "Setores", href: masterPlan("setores"), icon: BriefcaseBusiness },
      { key: "responsabilidades", label: "Competências", href: masterPlan("responsabilidades"), icon: ShieldAlert },
      { key: "capacidades", label: "Capacidades", href: masterPlan("capacidades"), icon: BookOpen },
      { key: "capacitacoes", label: "Capacitações", href: masterPlan("capacitacoes"), icon: GraduationCap },
      { key: "solicitacoes", label: "Solicitações", href: masterPlan("solicitacoes"), icon: ClipboardList },
      { key: "cronologia", label: "Cronologia", href: masterPlan("cronologia"), icon: CalendarDays },
      { key: "jornada", label: "Minha jornada", href: masterPlan("jornada"), icon: Users },
      { key: "cargos-funcoes", label: "Cargos e funções", href: masterPlan("cargos-funcoes"), icon: BriefcaseBusiness },
      { key: "cobertura", label: "Cobertura", href: masterPlan("cobertura"), icon: GitBranch },
    ],
  },
  {
    key: "auditorias", label: "Auditorias", href: "/auditorias", icon: ShieldCheck, context: "ac",
    views: [{ key: "auditorias", label: "Campanhas", href: "/auditorias", icon: ShieldCheck }],
  },
  {
    key: "tesouro", label: "Tesouro", href: "/tesouro", icon: Landmark, context: "ac",
    views: [{ key: "tesouro", label: "Tesouro de Estrelas", href: "/tesouro", icon: Landmark }],
  },
];

const detailParent: Record<string, string> = {
  nucleo: "nucleos", setor: "setores", responsabilidade: "responsabilidades",
  capacidade: "capacidades", solicitacao: "solicitacoes", pessoa: "jornada",
};

const moduleByKey = (key: string) => navigationModules.find((module) => module.key === key) ?? navigationModules[0];

/** Old Central tabs "priorities" and "tasks" now open the unified Processos tab. */
export function normalizeCentralTab(tab: string | null): string {
  if (!tab || tab === "priorities" || tab === "tasks") return "processos";
  return tab;
}

export function activeModule(pathname: string): NavigationModule {
  if (pathname.startsWith("/universo-ramos/plano-mestre")) return moduleByKey("plano");
  if (pathname.startsWith("/universo-ramos")) return moduleByKey("universo");
  if (pathname.startsWith("/central-entregas")) return moduleByKey("entregas");
  if (pathname.startsWith("/processos") || pathname.startsWith("/minhas-prioridades") || pathname.startsWith("/jackbox")) return moduleByKey("processos");
  if (pathname.startsWith("/auditorias")) return moduleByKey("auditorias");
  if (pathname.startsWith("/tesouro")) return moduleByKey("tesouro");
  return navigationModules[0];
}

export function activeView(module: NavigationModule, pathname: string, search: string): string {
  if (module.key === "plano") {
    const view = new URLSearchParams(search).get("view") ?? "empresa";
    return detailParent[view] ?? view;
  }
  if (module.key === "entregas") return normalizeCentralTab(new URLSearchParams(search).get("tab"));
  if (module.key === "painel") return module.views.find((view) => view.href === pathname)?.key ?? "inicio";
  if (module.key === "processos") {
    if (pathname === "/jackbox") return "quadro";
    if (pathname.startsWith("/jackbox-unificado")) return "gestao";
    return "processos";
  }
  return module.views[0].key;
}
