// Blocos de apresentação dos relatórios consolidados.
import { Building2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FioAcento } from "@/components/admin/FioAcento";
import { CHART } from "@/lib/design-tokens";

const COLORS = [
  CHART.primary,
  CHART.adequate,
  CHART.accent,
  CHART.critical,
  "hsl(262 55% 55%)",
  "hsl(190 55% 42%)",
  "hsl(215 15% 60%)",
];

export function Kpi({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      <CardContent className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-[9px] font-medium uppercase leading-[1.3] tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
        </div>
        <p className="mt-2 text-[28px] font-light tabular-nums leading-none tracking-[-0.035em]">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function CoverageBar({ label, pct }: { label: string; pct: number }) {
  const tone = pct >= 70 ? "bg-adequate" : pct >= 40 ? "bg-partial" : "bg-critical";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      <CardHeader className="border-b border-border bg-muted/30 px-3 py-2">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}

/**
 * Barra horizontal para comparar magnitude. Uma cor só: o comprimento já
 * codifica o valor, e mais matizes só atrapalhariam.
 *
 * `max` dobra a cauda em "Outras (n)". Sem isso, "unidades por comarca" viria
 * com 31 barras e mais de 800px de altura — uma lista disfarçada de gráfico.
 */
export function BarHorizontal({
  data, max = 10, vazio, ordenar = true,
}: {
  data: { name: string; value: number }[];
  max?: number;
  vazio?: string;
  /**
   * Ordena do maior para o menor — é o que faz "as N maiores" significar algo.
   * Desligue quando a categoria já tem ordem própria (faixa etária, meses):
   * ali reordenar por valor embaralha a leitura.
   */
  ordenar?: boolean;
}) {
  if (data.length === 0) return <Empty>{vazio}</Empty>;

  const ordenados = ordenar ? [...data].sort((a, b) => b.value - a.value) : data;
  const cabem = ordenados.slice(0, max);
  const cauda = ordenados.slice(max);
  const linhas = cauda.length
    ? [...cabem, {
        name: `Outras ${cauda.length}`,
        value: cauda.reduce((s, d) => s + d.value, 0),
      }]
    : cabem;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, linhas.length * 26 + 32)}>
      {/* Margem à direita reserva espaço para o rótulo no fim da barra. */}
      <BarChart data={linhas} layout="vertical" margin={{ left: 8, right: 40 }}>
        <CartesianGrid stroke={CHART.grid} horizontal={false} />
        <XAxis type="number" allowDecimals={false} {...CHART.axisStyle} />
        <YAxis type="category" dataKey="name" width={140} {...CHART.axisStyle} />
        <Tooltip {...CHART.tooltip} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="value" fill={CHART.primary} radius={[0, 3, 3, 0]}>
          {/* Rótulo direto: dispensa perseguir o eixo para ler o número. */}
          <LabelList
            dataKey="value" position="right"
            fill="hsl(var(--muted-foreground))" fontSize={11}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data, vazio,
}: {
  data: { name: string; value: number }[];
  vazio?: string;
}) {
  if (data.length === 0) return <Empty>{vazio}</Empty>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Tooltip {...CHART.tooltip} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Estado vazio. O texto padrão é deliberadamente genérico; quando o vazio tem
 * um motivo — não há divergência, ainda não há chamados — passe a explicação,
 * senão o gráfico parece quebrado.
 */
export function Empty({ children }: { children?: React.ReactNode }) {
  return (
    <p className="px-4 py-10 text-center text-[11px] leading-relaxed text-muted-foreground">
      {children ?? "Sem dados"}
    </p>
  );
}

export function PendRow({ tone, count, label }: { tone: "critical" | "partial"; count: number; label: string }) {
  const cls = tone === "critical"
    ? "bg-critical/10 text-critical border-critical/30"
    : "bg-partial/15 text-partial border-partial/30";
  return (
    <div className="flex items-center justify-between rounded border border-border bg-card px-3 py-1.5">
      <span className="text-[12px]">{label}</span>
      <Badge variant="outline" className={`px-1.5 py-0 text-[11px] font-normal tabular-nums ${cls}`}>
        {count}
      </Badge>
    </div>
  );
}
