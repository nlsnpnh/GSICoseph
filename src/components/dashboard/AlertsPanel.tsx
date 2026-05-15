import { AlertTriangle, AlertCircle, ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAlertas, type Alerta } from "@/hooks/useAlertas";

const iconByTipo = {
  critical: { Icon: AlertCircle,   color: "text-critical", count: "text-critical" },
  warning:  { Icon: AlertTriangle, color: "text-partial",  count: "text-partial"  },
  info:     { Icon: Info,          color: "text-blue-600", count: "text-blue-600" },
};

function SecaoAlertas({
  titulo, items, cor, onNavigate,
}: { titulo: string; items: Alerta[]; cor: string; onNavigate: (href: string) => void }) {
  return (
    <div>
      <div className={cn("flex items-center gap-2 border-b border-border px-4 py-2", cor)}>
        <span className="text-xs font-semibold uppercase tracking-wide">{titulo}</span>
        <span className="rounded-full bg-current/15 px-1.5 py-0.5 text-[10px] font-bold leading-none">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-center text-xs text-muted-foreground">Nenhum alerta.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a, i) => {
            const cfg = iconByTipo[a.tipo];
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onNavigate(a.href)}
                  title={`Abrir: ${a.label}`}
                  className="group flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <cfg.Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
                    <span className="truncate text-foreground group-hover:text-primary">{a.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className={cn("text-xs font-semibold", cfg.count)}>
                      {a.count} {a.unidade}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AlertsPanel() {
  const alertas = useAlertas();
  const navigate = useNavigate();

  const criticos     = alertas.filter((a) => a.tipo === "critical");
  const atencao      = alertas.filter((a) => a.tipo === "warning");
  const informativos = alertas.filter((a) => a.tipo === "info");

  return (
    <Card className="flex h-full flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          Alertas e Pendências
        </CardTitle>
        <button
          onClick={() => navigate("/ocorrencias")}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todos
        </button>
      </CardHeader>
      <CardContent className="flex-1 divide-y divide-border p-0">
        <SecaoAlertas titulo="Críticos"     items={criticos}     cor="text-critical" onNavigate={navigate} />
        <SecaoAlertas titulo="Atenção"      items={atencao}      cor="text-partial"  onNavigate={navigate} />
        <SecaoAlertas titulo="Informativos" items={informativos} cor="text-blue-600" onNavigate={navigate} />
      </CardContent>
    </Card>
  );
}
