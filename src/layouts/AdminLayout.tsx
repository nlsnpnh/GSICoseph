import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, LogOut, HelpCircle, Sun, Moon, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePeriod, type Period } from "@/contexts/PeriodContext";
import { useAlertas } from "@/hooks/useAlertas";
import { cn } from "@/lib/utils";

const notifIcon = {
  critical: { Icon: AlertCircle, color: "text-critical" },
  warning: { Icon: AlertTriangle, color: "text-partial" },
  info: { Icon: Info, color: "text-blue-600" },
} as const;

export default function AdminLayout() {
  const { user, roles, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { period, setPeriod } = usePeriod();
  const navigate = useNavigate();
  const alertas = useAlertas();
  const criticalCount = alertas.filter((a) => a.tipo === "critical").length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="hidden text-xs font-medium text-muted-foreground md:inline">
                Painel Integrado da Coordenadoria de Segurança Patrimonial e Humana
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os dados</SelectItem>
                  <SelectItem value="mes">Último mês</SelectItem>
                  <SelectItem value="ano">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                    <Bell className="h-5 w-5" />
                    {alertas.length > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[9px] font-bold text-critical-foreground">
                        {criticalCount || alertas.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <p className="text-sm font-semibold">Notificações</p>
                    <span className="text-[10px] text-muted-foreground">{alertas.length} no total</span>
                  </div>
                  <ul className="max-h-80 divide-y divide-border overflow-auto">
                    {alertas.length === 0 ? (
                      <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                        Nenhuma notificação no momento.
                      </li>
                    ) : alertas.map((a, i) => {
                      const cfg = notifIcon[a.tipo];
                      return (
                        <li key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                          <cfg.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.color)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground">{a.label}</p>
                            <p className="text-[10px] text-muted-foreground">{a.count} {a.unidade}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-border p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate("/ocorrencias")}
                    >
                      Ver todas as ocorrências
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
                title={theme === "dark" ? "Modo claro" : "Modo escuro"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Ajuda">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Sair">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-popover">
                  <DropdownMenuLabel>
                    <div className="text-xs font-normal text-muted-foreground">Conectado como</div>
                    <div className="truncate text-sm">{user?.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {roles.length === 0 ? (
                        <Badge variant="outline" className="text-xs">sem papel</Badge>
                      ) : roles.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs capitalize">{r}</Badge>
                      ))}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
