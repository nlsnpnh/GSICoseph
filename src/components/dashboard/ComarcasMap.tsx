import { useMemo, useState } from "react";
import { type Criticidade } from "@/data/mockDashboard";
import { ComarcaDetailDrawer } from "./ComarcaDetailDrawer";
import muniData from "@/data/ro-municipios.json";
import { useComarcaMetrics, type ComarcaMetric } from "@/hooks/useComarcaMetrics";
import { useUnidadesMock } from "@/data/unidadesMock";

const fillByNivel: Record<Criticidade, string> = {
  adequado:  "hsl(142 65% 55%)",
  parcial:   "hsl(42 95% 60%)",
  critico:   "hsl(0 75% 58%)",
  sem_dados: "hsl(215 15% 78%)",
};

const PIN_UNIDADE = "hsl(217 91% 55%)";

type Feature = {
  type: "Feature";
  properties: { id: string; name: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

const FEATURES = (muniData as { features: Feature[] }).features;

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function ComarcasMap() {
  const [selected, setSelected] = useState<ComarcaMetric | null>(null);
  const metrics  = useComarcaMetrics();
  const unidades = useUnidadesMock();
  const byName   = useMemo(() => new Map(metrics.map((m) => [norm(m.nome), m])), [metrics]);

  // Unidades com coordenadas cadastradas
  const unidadesComCoords = useMemo(
    () => unidades.filter((u) => u.lat != null && u.lng != null),
    [unidades],
  );

  const { paths, project, vbW, vbH } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const collect = (coords: number[][][] | number[][][][], type: string) => {
      const polys = type === "Polygon" ? [coords as number[][][]] : (coords as number[][][][]);
      for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    };
    for (const f of FEATURES) collect(f.geometry.coordinates, f.geometry.type);

    const pad   = 6;
    const scale = 80;
    const vbW   = (maxX - minX) * scale + pad * 2;
    const vbH   = (maxY - minY) * scale + pad * 2;

    const project = (lng: number, lat: number): [number, number] => [
      pad + (lng - minX) * scale,
      pad + (maxY - lat) * scale,
    ];

    const ringToPath = (ring: number[][]) =>
      ring.map(([x, y], i) => {
        const [px, py] = project(x, y);
        return `${i === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`;
      }).join(" ") + " Z";

    const paths = FEATURES.map((f) => {
      const polys = f.geometry.type === "Polygon"
        ? [f.geometry.coordinates as number[][][]]
        : (f.geometry.coordinates as number[][][][]);
      const d = polys.map((poly) => poly.map(ringToPath).join(" ")).join(" ");
      return { id: f.properties.id, name: f.properties.name, d };
    });

    return { paths, project, vbW, vbH };
  }, []);

  return (
    <>
      <div className="w-full overflow-hidden rounded-md border border-border bg-card p-2">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto max-h-[460px] w-full"
          role="img"
          aria-label="Mapa de Rondônia — nível de estrutura de segurança por comarca"
        >
          {/* Regiões dos municípios coloridas por nível */}
          {paths.map((p) => {
            const c = byName.get(norm(p.name));
            const fill = c ? fillByNivel[c.nivel] : fillByNivel.sem_dados;
            return (
              <path
                key={p.id}
                d={p.d}
                fill={fill}
                fillOpacity={0.9}
                stroke="hsl(0 0% 100%)"
                strokeWidth={0.6}
                className={c ? "cursor-pointer transition-opacity hover:opacity-80" : ""}
                onClick={() => c && setSelected(c)}
              >
                <title>
                  {c
                    ? `${p.name} — ${c.nivel} • ${c.unidades} unid. • ${c.quantidadeTotal} equip. • ${c.itensVinculados} itens • cobertura ${c.cobertura}% • ${c.ocorrenciasAbertas} ocorrência(s)`
                    : p.name}
                </title>
              </path>
            );
          })}

          {/* Pins menores para unidades prediais com coordenadas */}
          {unidadesComCoords.map((u) => {
            const [x, y] = project(u.lng!, u.lat!);
            return (
              <g key={u.id} transform={`translate(${x - 5}, ${y - 5})`}>
                <rect
                  width={10}
                  height={10}
                  rx={2}
                  fill={PIN_UNIDADE}
                  stroke="white"
                  strokeWidth={1}
                  opacity={0.95}
                />
                <title>{u.nome}</title>
              </g>
            );
          })}

          {/* Pins maiores para comarcas (teardrop) */}
          {metrics.map((c) => {
            const [x, y] = project(c.lng, c.lat);
            return (
              <g
                key={c.nome}
                transform={`translate(${x - 7}, ${y - 16})`}
                className="cursor-pointer"
                onClick={() => setSelected(c)}
              >
                <path
                  d="M7,0 C3.1,0 0,3.1 0,7 C0,12.5 7,18 7,18 C7,18 14,12.5 14,7 C14,3.1 10.9,0 7,0 Z"
                  fill="hsl(0 0% 15%)"
                  stroke="white"
                  strokeWidth={1}
                />
                <circle cx={7} cy={7} r={2.5} fill="white" />
                <title>{c.nome}</title>
              </g>
            );
          })}
        </svg>
      </div>
      <ComarcaDetailDrawer comarca={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  );
}
