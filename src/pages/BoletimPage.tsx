import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, Download, Filter, Save } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useComarcas } from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BOLETIM_ITENS_FIXOS, RELATORIO_RESUMO_CARDS,
  useBoletimMes, useBoletimList, useBoletimConsolidado, useUpsertBoletim,
} from "@/data/boletim";
import { exportExcelMulti } from "@/lib/exporters";
import { toast } from "@/hooks/use-toast";

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Sistema começou a operar em 2026 — não exibir anos anteriores.
const ANO_INICIAL = 2026;
const ANOS = (() => {
  const atual = new Date().getFullYear();
  const fim = Math.max(atual + 1, ANO_INICIAL + 4);
  const arr: number[] = [];
  for (let a = ANO_INICIAL; a <= fim; a++) arr.push(a);
  return arr.reverse();
})();

type LinhaForm = { quantidade: number; observacoes: string };

const ITENS = BOLETIM_ITENS_FIXOS;

const linhasZeradas = (): Record<number, LinhaForm> =>
  Object.fromEntries(ITENS.map((it) => [it.item_number, { quantidade: 0, observacoes: "" }]));

export default function BoletimPage() {
  useEffect(() => { document.title = "Boletim Operacional | COSEPH TJRO"; }, []);
  const { isOperador, unidadeId } = useAuth();
  const unidades = useUnidadesMock();
  const { data: comarcas = [] } = useComarcas();

  const hoje = new Date();
  const [unidade, setUnidade] = useState<string>("");
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1);
  const [ano, setAno] = useState<number>(hoje.getFullYear());

  // Operador: trava na própria unidade
  useEffect(() => {
    if (isOperador && unidadeId) setUnidade(unidadeId);
    else if (!unidade && unidades[0]) setUnidade(unidades[0].id);
  }, [isOperador, unidadeId, unidades, unidade]);

  const { data: lancamentos = [] } = useBoletimMes(unidade || null, ano, mes);
  const upsert = useUpsertBoletim();

  const [form, setForm] = useState<Record<number, LinhaForm>>(() => linhasZeradas());

  // Hidrata o form sempre que lançamentos chegam (ou troca de unidade/mês/ano).
  useEffect(() => {
    const next = linhasZeradas();
    for (const l of lancamentos) {
      next[l.item_number] = {
        quantidade: l.quantidade ?? 0,
        observacoes: l.observacoes ?? "",
      };
    }
    setForm(next);
  }, [lancamentos]);

  const handleQuantidade = (item: number, value: string) => {
    const n = value === "" ? 0 : Number(value);
    setForm((prev) => ({
      ...prev,
      [item]: { ...prev[item], quantidade: Number.isFinite(n) && n >= 0 ? n : 0 },
    }));
  };

  const handleObservacoes = (item: number, value: string) => {
    setForm((prev) => ({ ...prev, [item]: { ...prev[item], observacoes: value } }));
  };

  const onSalvar = async () => {
    if (!unidade) {
      toast({ title: "Selecione a unidade", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync({
        unidade_id: unidade,
        ano, mes,
        itens: ITENS.map((it) => ({
          item_number: it.item_number,
          quantidade: form[it.item_number]?.quantidade ?? 0,
          observacoes: form[it.item_number]?.observacoes ?? "",
        })),
      });
      toast({ title: "Boletim salvo", description: `${MESES[mes - 1]}/${ano}` });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Boletim Operacional"
        description="Indicadores mensais por unidade — preenchimento e histórico."
      />

      <Tabs defaultValue="lancamento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lancamento">
            <ClipboardList className="mr-2 h-4 w-4" />Lançamento Mensal
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Filter className="mr-2 h-4 w-4" />Histórico
          </TabsTrigger>
          <TabsTrigger value="relatorio">
            <BarChart3 className="mr-2 h-4 w-4" />Relatório Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-semibold">Período e unidade</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade</Label>
                {isOperador ? (
                  <Input
                    value={unidades.find((u) => u.id === unidade)?.nome ?? ""}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mês</Label>
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ano</Label>
                <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ANOS.map((a) => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
              <CardTitle className="text-sm font-semibold">
                Indicadores — {MESES[mes - 1]}/{ano}
              </CardTitle>
              <Button onClick={onSalvar} disabled={upsert.isPending || !unidade}>
                <Save className="mr-1.5 h-4 w-4" />
                {upsert.isPending ? "Salvando..." : "Salvar Boletim Mensal"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-32 text-right">Quantidade</TableHead>
                    <TableHead className="w-[28%]">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ITENS.map((it) => (
                    <TableRow key={it.item_number}>
                      <TableCell className="text-center font-mono text-xs">
                        {String(it.item_number).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="text-xs leading-snug">{it.descricao}</TableCell>
                      <TableCell>
                        <Input
                          type="number" min={0}
                          className="text-right"
                          value={form[it.item_number]?.quantidade ?? 0}
                          onChange={(e) => handleQuantidade(it.item_number, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={1}
                          className="min-h-[36px] resize-y text-xs"
                          value={form[it.item_number]?.observacoes ?? ""}
                          onChange={(e) => handleObservacoes(it.item_number, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoTab
            unidades={unidades}
            comarcas={comarcas}
            isOperador={isOperador}
            operadorUnidadeId={unidadeId}
          />
        </TabsContent>

        <TabsContent value="relatorio">
          <RelatorioGeralTab
            unidades={unidades}
            comarcas={comarcas}
            isOperador={isOperador}
            operadorUnidadeId={unidadeId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function HistoricoTab({
  unidades, comarcas, isOperador, operadorUnidadeId,
}: {
  unidades: { id: string; nome: string; comarca_id: string | null }[];
  comarcas: { id: string; nome: string }[];
  isOperador: boolean;
  operadorUnidadeId: string | null;
}) {
  const itens = ITENS;
  const [fAno, setFAno] = useState<string>("all");
  const [fMes, setFMes] = useState<string>("all");
  const [fUnidade, setFUnidade] = useState<string>(
    isOperador && operadorUnidadeId ? operadorUnidadeId : "all",
  );
  const [fComarca, setFComarca] = useState<string>("all");
  const [fItem, setFItem] = useState<string>("all");

  const filtros = useMemo(() => ({
    ano: fAno === "all" ? null : Number(fAno),
    mes: fMes === "all" ? null : Number(fMes),
    unidadeId: fUnidade === "all" ? null : fUnidade,
    comarcaId: fComarca === "all" ? null : fComarca,
    itemNumber: fItem === "all" ? null : Number(fItem),
  }), [fAno, fMes, fUnidade, fComarca, fItem]);

  const { data: rows = [], isLoading } = useBoletimList(filtros);

  const itemMap = useMemo(
    () => Object.fromEntries(itens.map((i) => [i.item_number, i.descricao])),
    [itens],
  );

  const exportarCSV = () => {
    if (rows.length === 0) {
      toast({ title: "Sem dados para exportar" });
      return;
    }
    const header = ["Ano", "Mês", "Comarca", "Unidade", "Item", "Descrição", "Quantidade", "Observações"];
    const csv = [
      header.join(";"),
      ...rows.map((r) => [
        r.ano,
        String(r.mes).padStart(2, "0"),
        r.comarca_nome,
        r.unidade_nome,
        r.item_number,
        `"${(itemMap[r.item_number] ?? "").replace(/"/g, '""')}"`,
        r.quantidade,
        `"${(r.observacoes ?? "").replace(/"/g, '""')}"`,
      ].join(";")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boletim_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold">Lançamentos registrados</CardTitle>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="mr-1.5 h-4 w-4" />Exportar CSV
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Select value={fAno} onValueChange={setFAno}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
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
          <Select value={fItem} onValueChange={setFItem}>
            <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue placeholder="Item" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os itens</SelectItem>
              {itens.map((i) => (
                <SelectItem key={i.item_number} value={String(i.item_number)}>
                  {String(i.item_number).padStart(2, "0")} — {i.descricao.slice(0, 50)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum lançamento encontrado"
            description="Ajuste os filtros ou registre um novo boletim mensal."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Período</TableHead>
                <TableHead>Unidade / Comarca</TableHead>
                <TableHead className="w-12">Item</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24 text-right">Qtd.</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    {String(r.mes).padStart(2, "0")}/{r.ano}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{r.unidade_nome}</div>
                    <div className="text-muted-foreground">{r.comarca_nome}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {String(r.item_number).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="text-xs leading-snug">
                    {itemMap[r.item_number] ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{r.quantidade}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.observacoes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
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

function RelatorioGeralTab({
  unidades, comarcas, isOperador, operadorUnidadeId,
}: {
  unidades: { id: string; nome: string; comarca_id: string | null }[];
  comarcas: { id: string; nome: string }[];
  isOperador: boolean;
  operadorUnidadeId: string | null;
}) {
  const [fAno, setFAno] = useState<number>(ANOS[0]);
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

  const exportarExcel = () => {
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

    exportExcelMulti(
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
