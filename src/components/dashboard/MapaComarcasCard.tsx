import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";

// O mapa carrega o geojson dos municipios de RO (~416 kB). Sob demanda ele sai
// do chunk do Dashboard, que passa a pintar os indicadores sem esperar o mapa.
const ComarcasMap = lazy(() =>
  import("./ComarcasMap").then((m) => ({ default: m.ComarcasMap })),
);

const legend = [
  { key: "adequado", label: "Adequado", color: "bg-adequate" },
  { key: "parcial", label: "Parcialmente adequado", color: "bg-partial" },
  { key: "critico", label: "Crítico", color: "bg-critical" },
  { key: "sem_dados", label: "Sem dados", color: "bg-muted-foreground/40" },
];

const MapSkeleton = () => (
  <div className="flex h-[460px] w-full items-center justify-center rounded-md border border-border bg-card">
    <span className="text-sm text-muted-foreground">Carregando mapa…</span>
  </div>
);

export function MapaComarcasCard() {
  return (
    <Card className="shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Mapa das Comarcas — Nível de Estrutura de Segurança
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="relative">
          <p className="absolute left-3 top-3 z-10 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            Mapa do Estado de Rondônia
          </p>
          <Suspense fallback={<MapSkeleton />}>
            <ComarcasMap />
          </Suspense>

          <div className="absolute bottom-3 left-3 inline-flex flex-col gap-2 rounded-md border border-border bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
            {legend.map((l) => (
              <div key={l.key} className="flex items-center gap-2 text-xs">
                <span className={`h-3 w-3 rounded-sm ${l.color}`} />
                <span className="text-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
