import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAlertas } from "@/hooks/useAlertas";

const iconByTipo = {
  critical: { Icon: AlertCircle,  color: "text-critical", count: "text-critical" },
  warning:  { Icon: AlertTriangle, color: "text-partial",  count: "text-partial"  },
  info:     { Icon: Info,          color: "text-blue-600", count: "text-blue-600" },
};

export function AlertsPanel() {
  const alertas = useAlertas();

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          Alertas e Pendências
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alertas.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Nenhum alerta no momento.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {alertas.map((a, i) => {
              const cfg = iconByTipo[a.tipo];
              return (
                <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
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
      </CardContent>
    </Card>
  );
}
