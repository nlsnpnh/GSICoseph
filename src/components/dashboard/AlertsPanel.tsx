import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAlertas, type Alerta } from "@/hooks/useAlertas";

const iconByTipo = {
  critical: { Icon: AlertCircle,   color: "text-critical", count: "text-critical" },
  warning:  { Icon: AlertTriangle, color: "text-partial",  count: "text-partial"  },
  info:     { Icon: Info,          color: "text-blue-600", count: "text-blue-600" },
};

function SecaoAlertas({ titulo, items, cor }: { titulo: string; items: Alerta[]; cor: string }) {
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
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <cfg.Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
                  <span className="truncate text-foreground">{a.label}</span>
                </div>
                <span className={cn("shrink-0 text-xs font-semibold", cfg.count)}>
                  {a.count} {a.unidade}
                </span>
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
        <SecaoAlertas titulo="Críticos"     items={criticos}     cor="text-critical" />
        <SecaoAlertas titulo="Atenção"      items={atencao}      cor="text-partial"  />
        <SecaoAlertas titulo="Informativos" items={informativos} cor="text-blue-600" />
      </CardContent>
    </Card>
  );
}
