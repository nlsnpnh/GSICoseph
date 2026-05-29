import { useEffect, useMemo, useState } from "react";
import {
  Download, Building2, Cpu, Users, UserCog, KeyRound, FileText, AlertTriangle, ShieldCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosCatalogo, useUnidadeEquipamentos } from "@/data/equipamentos";
import { useServidoresMock, calcIdade, faixaEtaria, tempoServicoAnos } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useContratosMock, statusFromVigencia } from "@/data/contratosMock";
import { useOcorrenciasMock, calcSla } from "@/data/ocorrenciasMock";

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

// Categorias do contrato 115/2023 — mesmo mapeamento do MiniCharts
const CATEGORIAS_CONTRATO: { nome: string; itens: number[] }[] = [
  { nome: "Câmeras CFTV",         itens: [1, 2, 3, 4] },
  { nome: "Gravadores IP",        itens: [31, 32, 33, 34] },
  { nome: "Controle de acesso",   itens: [21, 22, 23, 24, 25, 27] },
  { nome: "Rede e infra",         itens: [11, 12, 44, 45] },
  { nome: "Servidores e storage", itens: [29, 30, 35, 39, 40, 41] },
  { nome: "Software e licenças",  itens: [28, 36, 37, 38, 42, 43] },
  { nome: "Estações e monitores", itens: [7, 8, 9, 10, 15] },
  { nome: "Comunicação",          itens: [5, 6, 13, 14, 26] },
  { nome: "Alarmes e emergência", itens: [19, 20] },
  { nome: "Acessórios câmera",    itens: [16, 17, 18] },
];

function categoriaDoItem(itemNum: number): string {
  return CATEGORIAS_CONTRATO.find((c) => c.itens.includes(itemNum))?.nome ?? "Outros";
}

export default function RelatoriosPage() {
  const unidades = useUnidadesMock();
  const catalogo = useEquipamentosCatalogo();
  const distribuicao = useUnidadeEquipamentos();
  const servidores = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const contratos = useContratosMock();
  const ocorrencias = useOcorrenciasMock();

  useEffect(() => { document.title = "Relatórios | COSEPH TJRO"; }, []);

  const unidadeNome = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u.nome])),
    [unidades],
  );
  const unidadeMap = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u])),
    [unidades],
  );

  // Soma quantitativa de equipamentos distribuídos
  const equipamentosQtd = useMemo(
    () => distribuicao.reduce((s, d) => s + d.quantidade, 0),
    [distribuicao],
  );
  const valorMensalTotal = useMemo(
    () => distribuicao.reduce((s, d) => s + d.quantidade * d.valor_unitario, 0),
    [distribuicao],
  );

  // Unidades com Kit Abertura de Portão por RFID (item #27)
  const kitRfidStats = useMemo(() => {
    const filtrados = distribuicao.filter((d) => d.item_num === 27 && d.quantidade > 0);
    const totalKits = filtrados.reduce((s, d) => s + d.quantidade, 0);
    return { unidades: filtrados.length, kits: totalKits, distribuicao: filtrados };
  }, [distribuicao]);

  // KPIs gerais
  const totals = {
    unidades: unidades.length,
    equipamentos: equipamentosQtd,
    servidores: servidores.length,
    terceirizados: terceirizados.length,
    kitRfid: kitRfidStats.unidades,
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

  // Equipamentos por categoria do contrato (soma quantidades)
  const equipPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of distribuicao) {
      const cat = categoriaDoItem(d.item_num);
      map.set(cat, (map.get(cat) ?? 0) + d.quantidade);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [distribuicao]);

  // Distribuição vs contrato (top 10 com maior divergência)
  const divergenciaContrato = useMemo(() => {
    const distPorItem = new Map<number, number>();
    for (const d of distribuicao) {
      distPorItem.set(d.item_num, (distPorItem.get(d.item_num) ?? 0) + d.quantidade);
    }
    return catalogo
      .map((c) => ({
        name: `#${String(c.item_num).padStart(2, "0")}`,
        value: Math.abs(c.qtd_contrato - (distPorItem.get(c.item_num) ?? 0)),
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [catalogo, distribuicao]);

  // Distribuição por comarca
  const unidadesPorComarca = useMemo(() => groupBy(unidades, (u) => u.comarca_nome || "Sem comarca"), [unidades]);
  const servidoresPorComarca = useMemo(
    () => groupBy(servidores, (s) => s.unidade_id ? (unidadeMap[s.unidade_id]?.comarca_nome || "Sem comarca") : "Sem comarca"),
    [servidores, unidadeMap],
  );
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
    () => groupBy(servidores, (s) => {
      const comarca = s.unidade_id ? (unidadeMap[s.unidade_id]?.comarca_nome ?? "") : "";
      return comarca === "Porto Velho" ? "Capital" : "Interior";
    }),
    [servidores, unidadeMap],
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

  // Contratos por status
  const contratosPorStatus = useMemo(
    () => groupBy(contratos, (c) => statusFromVigencia(c.data_fim)),
    [contratos],
  );

  // Manutenções
  const ocoPorTipo = useMemo(() => groupBy(ocorrencias, (o) => o.categoria || "Sem categoria"), [ocorrencias]);
  const ocoPorStatus = useMemo(() => groupBy(ocorrencias, (o) => o.status), [ocorrencias]);
  const ocoAtrasadas = useMemo(
    () => ocorrencias.filter((o) => calcSla(o).indicador === "Atrasado"),
    [ocorrencias],
  );

  // Datasets exportáveis (com nomes de unidade resolvidos)
  const equipExport = useMemo(
    () => distribuicao.map((d) => ({
      item: `#${String(d.item_num).padStart(2, "0")}`,
      descricao: d.descricao,
      unidade: d.unidade_nome,
      comarca: d.comarca_nome,
      quantidade: d.quantidade,
      unidade_medida: d.unidade_medida,
      valor_unitario: d.valor_unitario,
      valor_total: d.quantidade * d.valor_unitario,
    })),
    [distribuicao],
  );
  const kitRfidExport = useMemo(
    () => kitRfidStats.distribuicao.map((d) => ({
      unidade: d.unidade_nome,
      comarca: d.comarca_nome,
      quantidade: d.quantidade,
      observacoes: d.observacoes,
    })),
    [kitRfidStats],
  );
  const ocoExport = useMemo(
    () => ocorrencias.map((o) => ({ ...o, unidade: unidadeNome[o.unidade_id] ?? "" })),
    [ocorrencias, unidadeNome],
  );

  // Relatório cadastral de servidores (Número, Cadastro, Nome, Localidade, Unidade Predial, Região, Grupo Unidade, Status Cadastro)
  const [cadastralAbonoFilter, setCadastralAbonoFilter] = useState<"all" | "sim" | "nao">("all");
  const servidoresCadastral = useMemo(
    () => [...servidores]
      .filter((s) => {
        if (cadastralAbonoFilter === "sim") return s.abono_permanencia;
        if (cadastralAbonoFilter === "nao") return !s.abono_permanencia;
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .map((s, i) => {
        const unid = s.unidade_id ? unidadeMap[s.unidade_id] : null;
        const localidade = unid?.comarca_nome ?? "";
        const unidadePredial = unid?.nome ?? "";
        return {
          numero: i + 1,
          cadastro: s.matricula,
          nome: s.nome,
          localidade,
          unidade_predial: unidadePredial,
          regiao: localidade,
          grupo_unidade: unidadePredial,
          abono_permanencia: s.abono_permanencia ? "Sim" : "Não",
          status_cadastro: s.situacao,
        };
      }),
    [servidores, unidadeMap, cadastralAbonoFilter],
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
            <Button variant="outline" size="sm" onClick={() => exportCsv(kitRfidExport, "kit-rfid")}><Download className="mr-1 h-4 w-4" />Kit RFID</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(contratos, "contratos")}><Download className="mr-1 h-4 w-4" />Contratos</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv(ocoExport, "manutencoes")}><Download className="mr-1 h-4 w-4" />Manutenções</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi icon={Building2}     label="Unidades"      value={totals.unidades} />
        <Kpi icon={Cpu}           label="Equipamentos"  value={totals.equipamentos} />
        <Kpi icon={Users}         label="Servidores"    value={totals.servidores} />
        <Kpi icon={UserCog}       label="Terceirizados" value={totals.terceirizados} />
        <Kpi icon={KeyRound}      label="Kit RFID"      value={totals.kitRfid} />
        <Kpi icon={FileText}      label="Contratos"     value={totals.contratos} />
        <Kpi icon={AlertTriangle} label="Manutenções"   value={totals.ocorrencias} />
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

        <ChartCard title="Equipamentos por categoria do contrato">
          <BarHorizontal data={equipPorCategoria} />
        </ChartCard>
        <ChartCard title="Divergência contrato × distribuição (top 10)">
          <BarHorizontal data={divergenciaContrato} />
        </ChartCard>

        <ChartCard title="Contratos por situação">
          <Donut data={contratosPorStatus} />
        </ChartCard>

        <ChartCard title="Manutenções por categoria">
          <BarHorizontal data={ocoPorTipo} />
        </ChartCard>
        <ChartCard title="Manutenções por status">
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

      {/* Relatório cadastral de servidores */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />Relatório cadastral de servidores
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={cadastralAbonoFilter} onValueChange={(v) => setCadastralAbonoFilter(v as "all" | "sim" | "nao")}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Abono de permanência" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (abono ou não)</SelectItem>
                <SelectItem value="sim">Apenas com abono</SelectItem>
                <SelectItem value="nao">Apenas sem abono</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(servidoresCadastral, "servidores-cadastral")}
            >
              <Download className="mr-1 h-4 w-4" />Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {servidoresCadastral.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Sem servidores cadastrados</p>
          ) : (
            <div className="max-h-[480px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Número</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Localidade</TableHead>
                    <TableHead>Unidade Predial</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead>Grupo Unidade</TableHead>
                    <TableHead>Abono Perm.</TableHead>
                    <TableHead>Status Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servidoresCadastral.map((r) => (
                    <TableRow key={`${r.cadastro}-${r.numero}`}>
                      <TableCell className="text-muted-foreground">{r.numero}</TableCell>
                      <TableCell className="font-mono text-xs">{r.cadastro}</TableCell>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{r.localidade || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.unidade_predial || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.regiao || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.grupo_unidade || "—"}</TableCell>
                      <TableCell>
                        {r.abono_permanencia === "Sim" ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400 text-xs">
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{r.status_cadastro}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
            label="Manutenções com SLA atrasado"
          />
          <PendRow
            tone="partial"
            count={unidades.length - kitRfidStats.unidades}
            label="Unidades sem Kit Abertura de Portão por RFID"
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
            tone="partial"
            count={(() => {
              const comVinculo = new Set(distribuicao.map((d) => d.unidade_id));
              return unidades.filter((u) => !comVinculo.has(u.id)).length;
            })()}
            label="Unidades sem equipamentos cadastrados"
          />
          <PendRow
            tone="partial"
            count={(() => {
              const itensComVinculo = new Set(distribuicao.map((d) => d.item_num));
              return catalogo.filter((c) => !itensComVinculo.has(c.item_num)).length;
            })()}
            label="Itens do catálogo sem distribuição"
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
