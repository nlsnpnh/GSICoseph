// Blocos de apresentação dos relatórios consolidados.
import { Building2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
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

export function BarHorizontal({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 26 + 32)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
        <XAxis type="number" allowDecimals={false} {...CHART.axisStyle} />
        <YAxis type="category" dataKey="name" width={140} {...CHART.axisStyle} />
        <Tooltip {...CHART.tooltip} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="value" fill={CHART.primary} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <Empty />;
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

export function Empty() {
  return <p className="py-10 text-center text-[11px] text-muted-foreground">Sem dados</p>;
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
