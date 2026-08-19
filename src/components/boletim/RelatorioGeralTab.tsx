import { useMemo, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import {
  RELATORIO_RESUMO_CARDS, useBoletimConsolidado,
} from "@/data/boletim";
import { exportExcelMulti } from "@/lib/exporters";
import { toast } from "@/hooks/use-toast";
import { ANOS, ANO_VIGENTE, MESES, MESES_ABREV } from "./constantes";

const CHART_TOOLTIP = {
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.15)",
} as const;

const CORES_RESUMO = [
  "hsl(0 75% 55%)",    // Armas de Fogo
  "hsl(30 80% 55%)",   // Armas Brancas
  "hsl(217 91% 55%)",  // Incidentes
  "hsl(270 65% 55%)",  // Acionamentos
  "hsl(142 65% 45%)",  // Reuniões
];

export function RelatorioGeralTab({
  unidades, comarcas, isOperador, operadorUnidadeId,
}: {
  unidades: { id: string; nome: string; comarca_id: string | null }[];
  comarcas: { id: string; nome: string }[];
  isOperador: boolean;
  operadorUnidadeId: string | null;
}) {
  const [fAno, setFAno] = useState<number>(ANO_VIGENTE);
  const [fMes, setFMes] = useState<string>("all");
  const [fComarca, setFComarca] = useState<string>("all");
  const [fUnidade, setFUnidade] = useState<string>("all");

  // Operador: restrito sempre à própria unidade.
  const unidadeFiltro = isOperador ? operadorUnidadeId : (fUnidade === "all" ? null : fUnidade);
  const comarcaFiltro = isOperador ? null : (fComarca === "all" ? null : fComarca);
  const mesFiltro = fMes === "all" ? null : Number(fMes);

  const { data: rows = [], isLoading } = useBoletimConsolidado({
    ano: fAno,
    mes: mesFiltro,
    unidadeId: unidadeFiltro,
    comarcaId: comarcaFiltro,
  });

  // Meses visíveis: todos (0..11) ou apenas o selecionado.
  const mesesVisiveis = useMemo(
    () => (mesFiltro ? [mesFiltro - 1] : Array.from({ length: 12 }, (_, i) => i)),
    [mesFiltro],
  );

  const totalGeral = useMemo(() => rows.reduce((s, r) => s + r.total, 0), [rows]);

  // Cards de resumo.
  const resumo = useMemo(
    () => RELATORIO_RESUMO_CARDS.map((c, i) => ({
      label: c.label,
      total: rows.find((r) => r.item_number === c.item)?.total ?? 0,
      color: CORES_RESUMO[i % CORES_RESUMO.length],
    })),
    [rows],
  );

  // Evolução mensal dos indicadores de resumo (uma linha por indicador).
  const evolucao = useMemo(
    () => mesesVisiveis.map((mi) => {
      const ponto: Record<string, number | string> = { mes: MESES_ABREV[mi] };
      for (const c of RELATORIO_RESUMO_CARDS) {
        const row = rows.find((r) => r.item_number === c.item);
        ponto[c.label] = row?.meses[mi] ?? 0;
      }
      return ponto;
    }),
    [rows, mesesVisiveis],
  );

  // Ranking dos indicadores por quantidade (Total Ano), maior para menor.
  const ranking = useMemo(
    () => rows
      .map((r) => ({ item: r.item_number, descricao: r.descricao, total: r.total }))
      .sort((a, b) => b.total - a.total),
    [rows],
  );

  const exportarExcel = async () => {
    if (totalGeral === 0) {
      toast({ title: "Sem dados para exportar" });
      return;
    }
    const comarcaNome = comarcaFiltro
      ? comarcas.find((c) => c.id === comarcaFiltro)?.nome ?? "—"
      : "Todas";
    const unidadeNome = unidadeFiltro
      ? unidades.find((u) => u.id === unidadeFiltro)?.nome ?? "—"
      : "Todas";

    const filtrosSheet = [
      { Filtro: "Ano", Valor: fAno },
      { Filtro: "Mês", Valor: mesFiltro ? MESES[mesFiltro - 1] : "Todos" },
      { Filtro: "Comarca", Valor: comarcaNome },
      { Filtro: "Unidade", Valor: unidadeNome },
      { Filtro: "Exportado em", Valor: new Date().toLocaleString("pt-BR") },
    ];

    const resumoSheet = resumo.map((r) => ({ Indicador: r.label, Total: r.total }));

    const consolidadoSheet = rows.map((r) => {
      const linha: Record<string, unknown> = {
        Item: String(r.item_number).padStart(2, "0"),
        Indicador: r.descricao,
      };
      for (const mi of mesesVisiveis) linha[MESES_ABREV[mi]] = r.meses[mi];
      linha["Total Ano"] = r.total;
      return linha;
    });

    await exportExcelMulti(
      [
        { name: "Filtros", rows: filtrosSheet },
        { name: "Resumo", rows: resumoSheet },
        { name: "Consolidado", rows: consolidadoSheet },
      ],
      "boletim-relatorio-geral",
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
            <Button variant="outline" size="sm" onClick={exportarExcel}>
              <Download className="mr-1.5 h-4 w-4" />Exportar Excel
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Select value={String(fAno)} onValueChange={(v) => setFAno(Number(v))}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fMes} onValueChange={setFMes}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MESES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            {!isOperador && (
              <>
                <Select value={fComarca} onValueChange={(v) => { setFComarca(v); setFUnidade("all"); }}>
                  <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Comarca" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as comarcas</SelectItem>
                    {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={fUnidade} onValueChange={setFUnidade}>
                  <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="Unidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unidades
                      .filter((u) => fComarca === "all" || u.comarca_id === fComarca)
                      .map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <p className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando...</p>
      ) : totalGeral === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Nenhum lançamento no período"
              description="Ajuste os filtros para visualizar a consolidação dos indicadores."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cards resumo */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {resumo.map((c) => (
              <Card key={c.label} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                    <p className="text-[11px] font-medium leading-tight text-muted-foreground">{c.label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{c.total.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold">Evolução mensal dos indicadores</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={evolucao} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {RELATORIO_RESUMO_CARDS.map((c, i) => (
                      <Line
                        key={c.item}
                        type="monotone"
                        dataKey={c.label}
                        stroke={CORES_RESUMO[i % CORES_RESUMO.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold">Ranking dos indicadores por quantidade</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ResponsiveContainer width="100%" height={Math.max(260, ranking.length * 22)}>
                  <BarChart data={ranking} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="item"
                      width={28}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => String(v).padStart(2, "0")}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP}
                      formatter={(value) => [value, "Total"]}
                      labelFormatter={(item) => {
                        const r = ranking.find((x) => x.item === item);
                        return `${String(item).padStart(2, "0")} — ${r?.descricao ?? ""}`;
                      }}
                    />
                    <Bar dataKey="total" radius={[0, 3, 3, 0]}>
                      {ranking.map((r) => (
                        <Cell key={r.item} fill="hsl(217 91% 55%)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela consolidada */}
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm font-semibold">
                Consolidado dos indicadores — {fAno}
                {mesFiltro ? ` · ${MESES[mesFiltro - 1]}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Item</TableHead>
                      <TableHead className="min-w-[260px]">Pergunta / Indicador</TableHead>
                      {mesesVisiveis.map((mi) => (
                        <TableHead key={mi} className="text-right">{MESES_ABREV[mi]}</TableHead>
                      ))}
                      <TableHead className="text-right font-semibold">Total Ano</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.item_number}>
                        <TableCell className="text-center font-mono text-xs">
                          {String(r.item_number).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="text-xs leading-snug">{r.descricao}</TableCell>
                        {mesesVisiveis.map((mi) => (
                          <TableCell key={mi} className="text-right tabular-nums text-xs">
                            {r.meses[mi]}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold tabular-nums">{r.total}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-border bg-muted/40 font-semibold">
                      <TableCell />
                      <TableCell className="text-xs">Total geral</TableCell>
                      {mesesVisiveis.map((mi) => (
                        <TableCell key={mi} className="text-right tabular-nums text-xs">
                          {rows.reduce((s, r) => s + r.meses[mi], 0)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right tabular-nums">{totalGeral}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
