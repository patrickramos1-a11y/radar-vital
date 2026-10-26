import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, RefreshCw } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { UserSelector } from "./UserSelector";
import { activeModule, activeView, navigationModules } from "./navigationModel";
import "./app-navigation.css";

export function AppNavigation({ onRefresh, tools }: { onRefresh: () => void; tools?: ReactNode }) {
  const location = useLocation();
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const modulesRef = useRef<HTMLElement>(null);
  const module = activeModule(location.pathname);
  const view = activeView(module, location.pathname, location.search);
  const isUniverse = module.context === "ramos";

  useEffect(() => {
    const list = modulesRef.current;
    const selected = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && selected) {
      const preceding = selected.previousElementSibling as HTMLElement | null;
      list.scrollLeft = preceding?.offsetLeft ?? selected.offsetLeft;
    }
  }, [module.key]);

  return <header className={`app-navigation ${isUniverse ? "app-navigation-ramos" : ""}`}>
    <div className="app-navigation-top">
      <div className="app-navigation-left">
        <button type="button" className="app-navigation-icon" onClick={toggleSidebar}
          aria-label={isMobile ? openMobile ? "Fechar menu" : "Abrir menu" : state === "expanded" ? "Fechar menu" : "Abrir menu"}
          title="Menu de todas as páginas"><Menu className="h-[19px] w-[19px]" /></button>
      </div>

      <nav ref={modulesRef} className="app-navigation-modules" aria-label="Módulos">
        {navigationModules.map((entry) => {
          const Icon = entry.icon;
          const selected = module.key === entry.key;
          return <Link key={entry.key} to={entry.href} aria-current={selected ? "page" : undefined} className={`app-navigation-module ${selected ? "is-active" : ""}`}><Icon className="h-[17px] w-[17px] shrink-0" /><span>{entry.label}</span></Link>;
        })}
      </nav>

      <div className="app-navigation-right">
        <button type="button" className="app-navigation-icon app-navigation-refresh" aria-label="Atualizar aplicativo e limpar arquivos temporários" title="Atualizar aplicativo" onClick={onRefresh}><RefreshCw className="h-[18px] w-[18px]" /></button>
        <UserSelector />
      </div>
    </div>

    <div className="app-navigation-views-row">
      <nav className="app-navigation-views" aria-label={`Visões de ${module.label}`}>
        {module.views.map((entry) => {
          const Icon = entry.icon;
          const selected = view === entry.key;
          return <Link key={entry.key} to={entry.href} aria-current={selected ? "page" : undefined} className={`app-navigation-view ${selected ? "is-active" : ""}`}><Icon className="h-[15px] w-[15px] shrink-0" /><span>{entry.label}</span></Link>;
        })}
      </nav>
      {tools && <div className="app-navigation-tools">{tools}</div>}
    </div>

  </header>;
}
