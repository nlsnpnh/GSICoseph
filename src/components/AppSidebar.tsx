import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Map, Users, UserCog, Cpu, DoorOpen,
  FileText, AlertTriangle, BarChart3, Settings, Search, HelpCircle,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { title: "Painel Executivo",          url: "/",              icon: LayoutDashboard },
  { title: "Unidades Prediais",         url: "/unidades",      icon: Building2 },
  { title: "Mapa das Comarcas",         url: "/comarcas",      icon: Map,           adminOnly: true },
  { title: "Servidores",                url: "/servidores",    icon: Users },
  { title: "Terceirizados",             url: "/terceirizados", icon: UserCog },
  { title: "Equipamentos",              url: "/equipamentos",  icon: Cpu },
  { title: "Portões e Acessos",         url: "/portoes",       icon: DoorOpen },
  { title: "Contratos",                 url: "/contratos",     icon: FileText,      adminOnly: true },
  { title: "Ocorrências e Manutenções", url: "/ocorrencias",   icon: AlertTriangle },
  { title: "Consultas",                 url: "/consultas",     icon: Search,        adminOnly: true },
  { title: "Relatórios",                url: "/relatorios",    icon: BarChart3,     adminOnly: true },
  { title: "Configurações",             url: "/configuracoes", icon: Settings,      adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isOperador } = useAuth();
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  const visibleItems = isOperador ? items.filter((i) => !(i as any).adminOnly) : items;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4 space-y-3">
        {/* Logo + título */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md overflow-hidden shadow-sm">
            <img src="/GSI.png" alt="GSI" className="h-10 w-10 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-sidebar-primary">COSEPH TJRO</span>
              <span className="mt-1 text-[10px] leading-snug text-sidebar-foreground/70">
                Painel Integrado da Coordenadoria de Segurança Patrimonial e Humana
              </span>
            </div>
          )}
        </div>


      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-white data-[active=true]:bg-sidebar-accent data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:border-l-4 data-[active=true]:border-sidebar-primary data-[active=true]:rounded-l-none"
                  >
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-3">
        <button
          onClick={() => navigate("/ajuda")}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium">Precisa de ajuda?</p>
              <p className="text-[10px] text-sidebar-foreground/50 group-hover:text-white/70">
                Acesse o guia do sistema
              </p>
            </div>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
