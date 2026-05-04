import { useEffect, useMemo } from "react";
import {
  Download, Building2, Cpu, Users, UserCog, DoorOpen, FileText, AlertTriangle, ShieldCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { useServidoresMock, calcIdade, faixaEtaria, tempoServicoAnos } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { usePortoesMock } from "@/data/portoesMock";
import { useContratosMock, statusFromVigencia } from "@/data/contratosMock";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";

const COLORS = [
  "hsl(217 91% 55%)",
  "hsl(142 65% 45%)",
  "hsl(42 95% 55%)",
  "hsl(0 75% 55%)",
  "hsl(262 70% 60%)",
  "hsl(180 65% 45%)",
  "hsl(215 15% 60%)",
];

const groupBy = <T,>(arr: T[], key: (t: T) => string) => {
  const map = new Map<string, number>();
  arr.forEach((it) => {
    const k = key(it);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

const exportCsv = (rows: Record<string, unknown>[], name: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((r) => headers.map((h) => r[h]))]
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export default function RelatoriosPage() {
  const unidades = useUnidadesMock();
  const equipamentos = useEquipamentosMock();
  const servidores = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const portoes = usePortoesMock();
  const contratos = useContratosMock();
  const ocorrencias = useOcorrenciasMock();

  useEffect(() => { document.title = "Relatórios | COSEPH TJRO"; }, []);

  const unidadeNome = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u.nome])),
    [unidades],
  );

  // KPIs gerais
  const totals = {
    unidades: unidades.length,
    equipamentos: equipamentos.length,
    servidores: servidores.length,
    terceirizados: terceirizados.length,
    portoes: portoes.length,
    contratos: contratos.length,
    ocorrencias: ocorrencias.length,
  };

  // Cobertura de segurança
  const cobertura = useMemo(() => {
    const total = unidades.length || 1;
    return {
      derso: Math.round((unidades.filter((u) => u.possui_derso).length / total) * 100),
      acesso: Math.round((unidades.filter((u) => u.controle_acesso).length / total) * 100),
      vigilancia: Math.round((unidades.filter((u) => u.vigilancia_eletronica).length / total) * 100),
    };
  }, [unidades]);

  // Equipamentos por tipo / status
  const equipPorTipo = useMemo(() => groupBy(equipamentos, (e) => e.tipo), [equipamentos]);
  const equipPorStatus = useMemo(() => groupBy(equipamentos, (e) => e.status), [equipamentos]);

  // Distribuição por comarca
  const unidadesPorComarca = useMemo(() => groupBy(unidades, (u) => u.comarca), [unidades]);
  const servidoresPorComarca = useMemo(() => groupBy(servidores, (s) => s.comarca), [servidores]);
  const servidoresPorRegime = useMemo(() => groupBy(servidores, (s) => s.regime), [servidores]);
  const servidoresPorFuncao = useMemo(
    () => groupBy(servidores, (s) => s.funcao_atual?.trim() || s.cargo),
    [servidores],
  );
  const servidoresPorFaixa = useMemo(
    () => groupBy(servidores, (s) => faixaEtaria(calcIdade(s.data_nascimento))),
    [servidores],
  );
  const servidoresCapInterior = useMemo(
    () => groupBy(servidores, (s) => (s.comarca === "Porto Velho" ? "Capital" : "Interior")),
    [servidores],
  );
  const tempoMedio = useMemo(() => {
    const tempos = servidores.map((s) => tempoServicoAnos(s.data_ingresso)).filter((t): t is number => t != null);
    if (!tempos.length) return 0;
    return Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10;
  }, [servidores]);
  const proximosAposentadoria = useMemo(
    () => servidores.filter((s) => {
      const i = calcIdade(s.data_nascimento);
      return i != null && i >= 60 && s.situacao === "Ativo";
    }).length,
    [servidores],
  );

  // Criticidade
  const criticidadeUnidades = useMemo(() => groupBy(unidades, (u) => u.criticidade), [unidades]);

  // Contratos por status
  const contratosPorStatus = useMemo(
    () => groupBy(contratos, (c) => statusFromVigencia(c.data_fim)),
    [contratos],
  );

  // Ocorrências
  const ocoPorTipo = useMemo(() => groupBy(ocorrencias, (o) => o.tipo), [ocorrencias]);
  const ocoPorStatus = useMemo(() => groupBy(ocorrencias, (o) => o.status), [ocorrencias]);
  const ocoAtrasadas = useMemo(() => {
    const today = new Date();
    return ocorrencias.filter((o) =>
      o.prazo && o.status !== "Concluído" && o.status !== "Cancelado" &&
      new Date(o.prazo + "T00:00:00") < today,
    );
  }, [ocorrencias]);

  const portoesManutencao = portoes.filter((p) => p.necessidade_manutencao !== "Nenhuma");

  // Datasets exportáveis (com nomes de unidade resolvidos)
  const equipExport = useMemo(
    () => equipamentos.map((e) => ({ ...e, unidade: unidadeNome[e.unidade_id] ?? "" })),
    [equipamentos, unidadeNome],
  );
  const portoesExport = useMemo(
    () => portoes.map((p) => ({ ...p, unidade: unidadeNome[p.unidade_id] ?? "" })),
    [portoes, unidadeNome],
  );
  const ocoExport = useMemo(
    () => ocorrencias.map((o) => ({ ...o, unidade: unidadeNome[o.unidade_id] ?? "" })),
    [ocorrencias, unidadeNome],
  );

  return (
    <div>
      <PageHeader
        title="Relatórios consolidados"
        description="Visão analítica integrando unidades, equipamentos, pessoal, portões, contratos e ocorrências."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv(unidades, "unidades")}><Download className="mr-1 h-4 w-4" />Unidades</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(equipExport, "equipamentos")}><Download className="mr-1 h-4 w-4" />Equipamentos</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(servidores, "servidores")}><Download className="mr-1 h-4 w-4" />Servidores</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(terceirizados, "terceirizados")}><Download className="mr-1 h-4 w-4" />Terceirizados</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(portoesExport, "portoes")}><Download className="mr-1 h-4 w-4" />Portões</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(contratos, "contratos")}><Download className="mr-1 h-4 w-4" />Contratos</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(ocoExport, "ocorrencias")}><Download className="mr-1 h-4 w-4" />Ocorrências</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi icon={Building2}     label="Unidades"      value={totals.unidades} />
        <Kpi icon={Cpu}           label="Equipamentos"  value={totals.equipamentos} />
        <Kpi icon={Users}         label="Servidores"    value={totals.servidores} />
        <Kpi icon={UserCog}       label="Terceirizados" value={totals.terceirizados} />
        <Kpi icon={DoorOpen}      label="Portões"       value={totals.portoes} />
        <Kpi icon={FileText}      label="Contratos"     value={totals.contratos} />
        <Kpi icon={AlertTriangle} label="Ocorrências"   value={totals.ocorrencias} />
      </div>

      {/* Cobertura de segurança */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Cobertura de segurança nas unidades</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <CoverageBar label="Possui DERSO" pct={cobertura.derso} />
            <CoverageBar label="Controle de acesso" pct={cobertura.acesso} />
            <CoverageBar label="Vigilância eletrônica" pct={cobertura.vigilancia} />
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Unidades por comarca">
          <BarHorizontal data={unidadesPorComarca} />
        </ChartCard>
        <ChartCard title="Servidores por comarca">
          <BarHorizontal data={servidoresPorComarca} />
        </ChartCard>

        <ChartCard title="Equipamentos por tipo">
          <BarHorizontal data={equipPorTipo} />
        </ChartCard>
        <ChartCard title="Equipamentos por status">
          <Donut data={equipPorStatus} />
        </ChartCard>

        <ChartCard title="Criticidade das unidades">
          <Donut data={criticidadeUnidades} />
        </ChartCard>
        <ChartCard title="Contratos por situação">
          <Donut data={contratosPorStatus} />
        </ChartCard>

        <ChartCard title="Ocorrências por tipo">
          <BarHorizontal data={ocoPorTipo} />
        </ChartCard>
        <ChartCard title="Ocorrências por status">
          <Donut data={ocoPorStatus} />
        </ChartCard>
      </div>

      {/* Indicadores de Servidores */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />Indicadores de Servidores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi icon={Users} label="Tempo médio de serviço (anos)" value={tempoMedio} />
            <Kpi icon={Users} label="Próximos da aposentadoria (60+)" value={proximosAposentadoria} />
            <Kpi icon={Users} label="Total de servidores" value={totals.servidores} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Servidores por faixa etária">
              <BarHorizontal data={servidoresPorFaixa} />
            </ChartCard>
            <ChartCard title="Servidores por regime de trabalho">
              <Donut data={servidoresPorRegime} />
            </ChartCard>
            <ChartCard title="Servidores por função/cargo">
              <BarHorizontal data={servidoresPorFuncao} />
            </ChartCard>
            <ChartCard title="Capital × Interior">
              <Donut data={servidoresCapInterior} />
            </ChartCard>
          </div>
        </CardContent>
      </Card>

      {/* Pendências consolidadas */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />Pendências e ações necessárias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PendRow
            tone="critical"
            count={ocoAtrasadas.length}
            label="Ocorrências com prazo vencido"
          />
          <PendRow
            tone="partial"
            count={portoesManutencao.length}
            label="Portões com manutenção pendente"
          />
          <PendRow
            tone="partial"
            count={contratos.filter((c) => statusFromVigencia(c.data_fim) === "A vencer").length}
            label="Contratos a vencer nos próximos 90 dias"
          />
          <PendRow
            tone="critical"
            count={contratos.filter((c) => statusFromVigencia(c.data_fim) === "Vencido").length}
            label="Contratos vencidos"
          />
          <PendRow
            tone="critical"
            count={equipamentos.filter((e) => e.status === "Inoperante").length}
            label="Equipamentos inoperantes"
          />
          <PendRow
            tone="partial"
            count={unidades.filter((u) => !u.possui_derso).length}
            label="Unidades sem DERSO"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
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

function CoverageBar({ label, pct }: { label: string; pct: number }) {
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function BarHorizontal({ data }: { data: { name: string; value: number }[] }) {
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

function Donut({ data }: { data: { name: string; value: number }[] }) {
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

function Empty() {
  return <p className="py-12 text-center text-xs text-muted-foreground">Sem dados</p>;
}

function PendRow({ tone, count, label }: { tone: "critical" | "partial"; count: number; label: string }) {
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
