import type { LucideIcon } from "lucide-react";
import {
  Archive, BarChart3, BookOpen, BriefcaseBusiness, CalendarDays,
  ClipboardList, FileUp, GitBranch, Globe2, GraduationCap, Landmark,
  Layers3, LayoutDashboard, ListChecks, MessageSquare, Settings,
  ShieldCheck, ShieldAlert, Sparkles, Star, Target, TrendingUp, Users,
  CheckSquare, Package,
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
    key: "tarefas", label: "Tarefas", href: "/jackbox-unificado", icon: ListChecks, context: "ac",
    views: [
      { key: "gestao", label: "Gestão de tarefas", href: "/jackbox-unificado", icon: ListChecks },
      { key: "quadro", label: "Quadro de clientes", href: "/jackbox", icon: LayoutDashboard },
    ],
  },
  {
    key: "entregas", label: "Central de Entregas", href: "/central-entregas", icon: Target, context: "ac",
    views: [
      { key: "priorities", label: "Prioridades", href: deliveries("priorities"), icon: Star },
      { key: "tasks", label: "Tarefas", href: deliveries("tasks"), icon: CheckSquare },
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
      { key: "responsabilidades", label: "Responsabilidades", href: masterPlan("responsabilidades"), icon: ShieldAlert },
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

export function activeModule(pathname: string): NavigationModule {
  if (pathname.startsWith("/universo-ramos/plano-mestre")) return navigationModules[4];
  if (pathname.startsWith("/universo-ramos")) return navigationModules[3];
  if (pathname.startsWith("/central-entregas")) return navigationModules[2];
  if (pathname.startsWith("/jackbox")) return navigationModules[1];
  if (pathname.startsWith("/auditorias")) return navigationModules[5];
  if (pathname.startsWith("/tesouro")) return navigationModules[6];
  return navigationModules[0];
}

export function activeView(module: NavigationModule, pathname: string, search: string): string {
  if (module.key === "plano") {
    const view = new URLSearchParams(search).get("view") ?? "empresa";
    return detailParent[view] ?? view;
  }
  if (module.key === "entregas") return new URLSearchParams(search).get("tab") ?? "priorities";
  if (module.key === "painel") return module.views.find((view) => view.href === pathname)?.key ?? "inicio";
  if (module.key === "tarefas") return pathname === "/jackbox" ? "quadro" : "gestao";
  return module.views[0].key;
}
