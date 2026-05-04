import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Map, Users, UserCog, Cpu, DoorOpen,
  FileText, AlertTriangle, BarChart3, Settings, Shield, ChevronRight,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { title: "Painel Executivo", url: "/", icon: LayoutDashboard },
  { title: "Unidades Prediais", url: "/unidades", icon: Building2 },
  { title: "Mapa das Comarcas", url: "/comarcas", icon: Map },
  { title: "Servidores", url: "/servidores", icon: Users },
  { title: "Terceirizados", url: "/terceirizados", icon: UserCog },
  { title: "Equipamentos", url: "/equipamentos", icon: Cpu },
  { title: "Portões e Acessos", url: "/portoes", icon: DoorOpen },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Ocorrências e Manutenções", url: "/ocorrencias", icon: AlertTriangle },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, roles } = useAuth();
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();
  const role = roles[0] ?? "—";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-sidebar-primary">COSEPH</span>
              <span className="text-xs font-semibold text-sidebar-foreground">TJRO</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold data-[active=true]:border-l-4 data-[active=true]:border-sidebar-primary data-[active=true]:rounded-l-none"
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
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground capitalize">{role}</p>
              <p className="truncate text-[10px] text-sidebar-foreground/60">GSI/COSEPH</p>
            </div>
          )}
          {!collapsed && <ChevronRight className="h-4 w-4 text-sidebar-foreground/40" />}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
