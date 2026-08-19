import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidades } from "@/data/unidades";
import {
  STATUS_MANUT, CATEGORIAS_NOMES, type OcorrenciaManut, type SlaTone,
  calcSla, isAberto, tempoAtendimentoDias,
} from "@/data/ocorrencias";
import { exportPdfTable, exportExcelMulti, type Column } from "@/lib/exporters";
import { toast } from "@/hooks/use-toast";
import { CHART_COLORS, fmtDate, count } from "./formatacao";

export function RelatoriosTab({
  items, unidades, unidadeNome,
}: {
  items: OcorrenciaManut[];
  unidades: ReturnType<typeof useUnidades>;
  unidadeNome: (id: string) => string;
}) {
  const [unidadeFilter, setUnidadeFilter] = useState("all");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const filtered = useMemo(() => items.filter((o) => {
    if (unidadeFilter !== "all" && o.unidade_id !== unidadeFilter) return false;
    if (categoriaFilter !== "all" && o.categoria !== categoriaFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (de && o.data_abertura && o.data_abertura < de) return false;
    if (ate && o.data_abertura && o.data_abertura > ate) return false;
    return true;
  }), [items, unidadeFilter, categoriaFilter, statusFilter, de, ate]);

  // KPIs
  const total = filtered.length;
  const abertos = filtered.filter((o) => isAberto(o.status)).length;
  const concluidos = filtered.filter((o) => o.status === "Concluído");
  const atrasados = filtered.filter((o) => calcSla(o).indicador === "Atrasado").length;
  const slaNoPrazo = concluidos.filter((o) => calcSla(o).indicador === "No prazo").length;
  const slaFora = concluidos.filter((o) => calcSla(o).indicador === "Fora do prazo").length;
  const pctSla = concluidos.length ? Math.round((slaNoPrazo / concluidos.length) * 100) : 0;
  const tempos = concluidos.map((o) => tempoAtendimentoDias(o)).filter((t): t is number => t != null);
  const tempoMedio = tempos.length ? Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10 : 0;

  // Agregações para gráficos
  // unidadeNome deriva de `unidades` (já listado); incluí-la recalcularia a cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const porUnidade = useMemo(() => count(filtered, (o) => unidadeNome(o.unidade_id)), [filtered, unidades]);
  const porCategoria = useMemo(() => count(filtered, (o) => o.categoria || "Sem categoria"), [filtered]);
  const porStatus = useMemo(() => count(filtered, (o) => o.status), [filtered]);
  const slaData = useMemo(
    () => [
      { name: "No prazo", value: slaNoPrazo },
      { name: "Fora do prazo", value: slaFora },
    ].filter((d) => d.value > 0),
    [slaNoPrazo, slaFora],
  );
  const concluidosPorMes = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const hoje = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const m = d.getMonth(), a = d.getFullYear();
      const value = concluidos.filter((o) => {
        if (!o.data_conclusao) return false;
        const dt = new Date(o.data_conclusao + "T00:00:00");
        return dt.getMonth() === m && dt.getFullYear() === a;
      }).length;
      return { name: `${meses[m]}/${String(a).slice(2)}`, value };
    });
  }, [concluidos]);

  // Resumo por unidade (tabela)
  const resumoUnidade = useMemo(() => {
    const map = new Map<string, { unidade: string; total: number; abertos: number; concluidos: number; atrasados: number }>();
    for (const o of filtered) {
      const nome = unidadeNome(o.unidade_id);
      const r = map.get(nome) ?? { unidade: nome, total: 0, abertos: 0, concluidos: 0, atrasados: 0 };
      r.total += 1;
      if (isAberto(o.status)) r.abertos += 1;
      if (o.status === "Concluído") r.concluidos += 1;
      if (calcSla(o).indicador === "Atrasado") r.atrasados += 1;
      map.set(nome, r);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
    // unidadeNome deriva de `unidades` (já listado); incluí-la recalcularia a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, unidades]);

  // Exportações
  const linhasChamados = () => filtered.map((o) => ({
    Numero: o.protocolo,
    "Aberto em": fmtDate(o.data_abertura),
    "Data Final": fmtDate(o.data_conclusao),
    SLA: calcSla(o).indicador,
    Status: o.status,
    Servico: o.servico,
    Categoria: o.categoria,
    Cliente: unidadeNome(o.unidade_id),
    "Solicitante TJRO": o.servidor_solicitante,
    Responsavel: o.responsavel_nome,
  }));

  const subtitle = `${total} chamados${de || ate ? ` · período ${de ? fmtDate(de) : "…"} a ${ate ? fmtDate(ate) : "…"}` : ""}`;

  const handlePdf = async () => {
    const columns: Column[] = [
      { header: "Número", key: "Numero" }, { header: "Aberto em", key: "Aberto em" },
      { header: "Data Final", key: "Data Final" }, { header: "SLA", key: "SLA" },
      { header: "Status", key: "Status" }, { header: "Serviço", key: "Servico" },
      { header: "Categoria", key: "Categoria" }, { header: "Cliente", key: "Cliente" },
      { header: "Solicitante", key: "Solicitante TJRO" }, { header: "Responsável", key: "Responsavel" },
    ];
    await exportPdfTable({
      title: "Relatório de Manutenções — COSEPH/TJRO",
      subtitle, columns, rows: linhasChamados(), fileName: "manutencoes",
    });
    toast({ title: "PDF gerado" });
  };

  const handleExcel = async () => {
    await exportExcelMulti([
      { name: "Chamados", rows: linhasChamados() },
      { name: "Por unidade", rows: resumoUnidade.map((r) => ({ Unidade: r.unidade, Total: r.total, Abertos: r.abertos, Concluidos: r.concluidos, Atrasados: r.atrasados })) },
      { name: "Por categoria", rows: porCategoria.map((c) => ({ Categoria: c.name, Quantidade: c.value })) },
      { name: "Por status", rows: porStatus.map((c) => ({ Status: c.name, Quantidade: c.value })) },
      { name: "SLA", rows: [{ "No prazo": slaNoPrazo, "Fora do prazo": slaFora, "% no prazo": `${pctSla}%`, "Tempo médio (dias)": tempoMedio }] },
    ], "manutencoes");
    toast({ title: "Excel gerado" });
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          {unidades.length > 1 && (
            <FilterField label="Cliente (unidade)">
              <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
          )}
          <FilterField label="Categoria">
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIAS_NOMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_MANUT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="De"><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9 w-[150px]" /></FilterField>
          <FilterField label="Até"><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9 w-[150px]" /></FilterField>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcel}><FileSpreadsheet className="mr-1 h-4 w-4" />Excel</Button>
            <Button variant="outline" size="sm" onClick={handlePdf}><Download className="mr-1 h-4 w-4" />PDF</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total" value={total} />
        <Kpi label="Em aberto" value={abertos} />
        <Kpi label="Concluídos" value={concluidos.length} />
        <Kpi label="Atrasados" value={atrasados} tone="critical" />
        <Kpi label="SLA no prazo" value={`${pctSla}%`} tone={pctSla >= 70 ? "adequate" : pctSla >= 40 ? "partial" : "critical"} />
        <Kpi label="Tempo médio (dias)" value={tempoMedio} />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Manutenções por unidade"><BarH data={porUnidade} /></ChartCard>
        <ChartCard title="Manutenções por categoria"><BarH data={porCategoria} /></ChartCard>
        <ChartCard title="Manutenções por status"><Donut data={porStatus} /></ChartCard>
        <ChartCard title="SLA — No prazo × Fora do prazo (concluídos)"><Donut data={slaData} /></ChartCard>
        <ChartCard title="Chamados concluídos por período (6 meses)"><BarV data={concluidosPorMes} /></ChartCard>
      </div>

      {/* Tabela resumo */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Resumo por unidade</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {resumoUnidade.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Sem dados no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade (Cliente)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Em aberto</TableHead>
                  <TableHead className="text-right">Concluídos</TableHead>
                  <TableHead className="text-right">Atrasados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumoUnidade.map((r) => (
                  <TableRow key={r.unidade}>
                    <TableCell className="font-medium">{r.unidade}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right">{r.abertos}</TableCell>
                    <TableCell className="text-right">{r.concluidos}</TableCell>
                    <TableCell className="text-right">
                      {r.atrasados > 0
                        ? <span className="font-medium text-critical">{r.atrasados}</span>
                        : r.atrasados}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: SlaTone }) {
  const color = tone === "critical" ? "text-critical" : tone === "partial" ? "text-partial" : tone === "adequate" ? "text-adequate" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
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

const tooltipStyle = {
  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  color: "hsl(var(--card-foreground))", borderRadius: 6,
} as const;

function BarH({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={150} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="hsl(217 91% 55%)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarV({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -10, right: 16, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="hsl(142 65% 45%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty() {
  return <p className="py-12 text-center text-xs text-muted-foreground">Sem dados</p>;
}

