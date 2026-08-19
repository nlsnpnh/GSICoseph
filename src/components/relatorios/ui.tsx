// Blocos de apresentação dos relatórios consolidados.
import { Building2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "hsl(217 91% 55%)",
  "hsl(142 65% 45%)",
  "hsl(42 95% 55%)",
  "hsl(0 75% 55%)",
  "hsl(262 70% 60%)",
  "hsl(180 65% 45%)",
  "hsl(215 15% 60%)",
];

export function Kpi({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-4 w-4" />{label}
        </div>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CoverageBar({ label, pct }: { label: string; pct: number }) {
  const tone = pct >= 70 ? "bg-adequate" : pct >= 40 ? "bg-partial" : "bg-critical";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

export function BarHorizontal({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))", borderRadius: 6 }} itemStyle={{ color: "hsl(var(--card-foreground))" }} labelStyle={{ color: "hsl(var(--card-foreground))" }} />
        <Bar dataKey="value" fill="hsl(217 91% 55%)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))", borderRadius: 6 }} itemStyle={{ color: "hsl(var(--card-foreground))" }} labelStyle={{ color: "hsl(var(--card-foreground))" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Empty() {
  return <p className="py-12 text-center text-xs text-muted-foreground">Sem dados</p>;
}

export function PendRow({ tone, count, label }: { tone: "critical" | "partial"; count: number; label: string }) {
  const cls = tone === "critical"
    ? "bg-critical/10 text-critical border-critical/30"
    : "bg-partial/15 text-partial border-partial/30";
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2">
      <span className="text-sm">{label}</span>
      <Badge variant="outline" className={cls}>{count}</Badge>
    </div>
  );
}
