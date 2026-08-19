import { Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import { TYPO } from "@/lib/design-tokens";
import { FioAcento } from "@/components/admin/FioAcento";

// O mapa carrega o geojson dos municipios de RO (~416 kB). Sob demanda ele sai
// do chunk do Dashboard, que passa a pintar os indicadores sem esperar o mapa.
const ComarcasMap = lazy(() =>
  import("./ComarcasMap").then((m) => ({ default: m.ComarcasMap })),
);

const legenda = [
  { key: "adequado", label: "Adequado", cor: "bg-adequate" },
  { key: "parcial", label: "Parcial", cor: "bg-partial" },
  { key: "critico", label: "Crítico", cor: "bg-critical" },
  { key: "sem_dados", label: "Sem dados", cor: "bg-muted-foreground/40" },
];

const MapSkeleton = () => (
  <div className="flex h-[460px] w-full items-center justify-center rounded-md border border-border bg-muted/20">
    <span className="text-[12px] text-muted-foreground">Carregando mapa…</span>
  </div>
);

export function MapaComarcasCard() {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      {/* A legenda vive no cabeçalho, não flutuando sobre o mapa: antes ela
          cobria o canto inferior e disputava atenção com o rótulo do estado. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-px w-5 bg-accent" aria-hidden="true" />
          <h3 className={`${TYPO.eyebrow} text-accent`}>Mapa das comarcas</h3>
          <span className="text-[12px] text-muted-foreground">
            Nível de estrutura de segurança — Rondônia
          </span>
        </div>

        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {legenda.map((l) => (
            <li key={l.key} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${l.cor}`} aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {l.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3">
        <Suspense fallback={<MapSkeleton />}>
          <ComarcasMap />
        </Suspense>
      </div>
    </Card>
  );
}
