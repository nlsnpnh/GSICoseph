import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServidoresMock } from "@/data/servidoresMock";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosCatalogo, useUnidadeEquipamentos } from "@/data/equipamentos";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";
import { useContratosMock, statusFromVigencia } from "@/data/contratosMock";
import { useResultadosOperacionais } from "@/data/boletim";
import { usePeriod } from "@/contexts/PeriodContext";

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.15)",
} as const;
const TOOLTIP_ITEM = { color: "hsl(var(--popover-foreground))" } as const;
const TOOLTIP_LABEL = { color: "hsl(var(--popover-foreground))", fontWeight: 600 } as const;

export function ServidoresPorComarca() {
  const servidores = useServidoresMock();
  const unidades   = useUnidadesMock();

  const data = useMemo(() => {
    const unidadeMap = Object.fromEntries(unidades.map((u) => [u.id, u]));
    const contagem = new Map<string, number>();
    for (const s of servidores) {
      if (s.situacao !== "Ativo") continue;
      const comarca = s.unidade_id ? (unidadeMap[s.unidade_id]?.comarca_nome || "Sem comarca") : "Sem comarca";
      contagem.set(comarca, (contagem.get(comarca) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .map(([comarca, total]) => ({ comarca, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [servidores, unidades]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold">Servidores por Comarca</CardTitle>
        <p className="text-[11px] text-muted-foreground">Top 5 — ativos</p>
      </CardHeader>
      <CardContent className="p-3">
        {data.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">Sem dados cadastrados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="comarca" stroke="hsl(var(--muted-foreground))" fontSize={11} width={75} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
              <Bar dataKey="total" fill="hsl(217 91% 55%)" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Itens em destaque do contrato 115/2023 — exibidos no card "Principais Equipamentos"
const ITENS_DESTAQUE: { label: string; pattern: RegExp; cor: string }[] = [
  { label: "Câmera Fixa Modelo Dome",          pattern: /dome/i,                                  cor: "hsl(217 91% 55%)" },
  { label: "Câmera Fixa Modelo Bullet",        pattern: /bullet/i,                                cor: "hsl(200 80% 50%)" },
  { label: "Câmera Tipo 3 – Câmera Fisheye",   pattern: /fisheye|fish.?eye/i,                     cor: "hsl(190 70% 50%)" },
  { label: "Câmera Tipo 4 – Câmera PTZ",       pattern: /\bptz\b/i,                               cor: "hsl(170 65% 45%)" },
  { label: "Estação de Monitoramento - Local", pattern: /esta(ç|c)[aã]o.*monitora/i,              cor: "hsl(270 65% 55%)" },
  { label: "Estação de Cadastramento",         pattern: /esta(ç|c)[aã]o.*cadastra/i,              cor: "hsl(280 60% 60%)" },
  { label: "Catraca Bidirecional",             pattern: /catraca.*bidire|bidire.*catraca/i,       cor: "hsl(142 65% 45%)" },
  { label: "Kit Automatizador de Portão",      pattern: /(kit.*automati|automatizad.*port[aã]o)/i, cor: "hsl(30 80% 55%)" },
];

export function EquipamentosDonut() {
  const distribuicao = useUnidadeEquipamentos();
  const catalogo     = useEquipamentosCatalogo();

  const data = useMemo(() => {
    const totaisPorItem = new Map<number, number>();
    for (const d of distribuicao) {
      totaisPorItem.set(d.item_num, (totaisPorItem.get(d.item_num) ?? 0) + d.quantidade);
    }
    return ITENS_DESTAQUE.map((it) => {
      const match = catalogo.find((c) => it.pattern.test(c.descricao));
      const total = match ? (totaisPorItem.get(match.item_num) ?? 0) : 0;
      return { label: it.label, total, color: it.cor };
    });
  }, [distribuicao, catalogo]);

  const total = data.reduce((s, e) => s + e.total, 0);
  const dataPie = data.filter((e) => e.total > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold">Principais Equipamentos</CardTitle>
        <p className="text-[11px] text-muted-foreground">Total: {total.toLocaleString("pt-BR")}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-[110px_1fr] items-center gap-3 p-3">
        {total === 0 ? (
          <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">Sem dados cadastrados.</p>
        ) : (
          <>
            <div className="h-[160px] w-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} dataKey="total" nameKey="label" innerRadius={32} outerRadius={55} paddingAngle={2}>
                    {dataPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-[11px] leading-tight">
              {data.map((e) => (
                <li key={e.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: e.color }} />
                  <span className="truncate text-foreground" title={e.label}>
                    {e.label} <span className="text-muted-foreground">({e.total.toLocaleString("pt-BR")})</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ResultadosOperacionaisPie({
  unidadeId, comarcaId,
}: { unidadeId?: string | null; comarcaId?: string | null }) {
  const { ano, period } = usePeriod();
  // "mes" => filtra somente o mês corrente; "ano"/"todos" => ano inteiro
  const mes = period === "mes" ? new Date().getMonth() + 1 : null;
  const { data: rows = [] } = useResultadosOperacionais({ ano, mes, unidadeId, comarcaId });
  const total = rows.reduce((s, r) => s + r.total, 0);
  const data = rows.filter((r) => r.total > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold">Resultados Operacionais</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {period === "mes" ? `Mês ${String(mes).padStart(2, "0")}/${ano}` : `Ano ${ano}`}
          {" · "}Total: {total.toLocaleString("pt-BR")}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-[100px_1fr] items-center gap-3 p-3">
        {data.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">
            Sem lançamentos no período.
          </p>
        ) : (
          <>
            <div className="h-[140px] w-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="total" nameKey="label" innerRadius={28} outerRadius={48} paddingAngle={2}>
                    {data.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-xs leading-tight">
              {rows.map((c) => (
                <li key={c.item} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                  <span className="truncate text-foreground">
                    {c.label} <span className="text-muted-foreground">({c.total.toLocaleString("pt-BR")})</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function OcorrenciasPorMes() {
  const ocorrencias = useOcorrenciasMock();

  const data = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const mes = d.getMonth();
      const ano = d.getFullYear();
      const total = ocorrencias.filter((o) => {
        if (!o.data_abertura) return false;
        const dt = new Date(o.data_abertura);
        return dt.getMonth() === mes && dt.getFullYear() === ano;
      }).length;
      return { mes: MESES_ABREV[mes], total };
    });
  }, [ocorrencias]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold">Ocorrências por Mês</CardTitle>
        <p className="text-[11px] text-muted-foreground">Últimos 6 meses</p>
      </CardHeader>
      <CardContent className="p-3">
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
            <Line type="monotone" dataKey="total" stroke="hsl(217 91% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(217 91% 55%)" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const CORES_VIGENCIA: Record<string, string> = {
  Vigente:   "hsl(142 65% 45%)",
  "A vencer": "hsl(42 95% 55%)",
  Vencido:   "hsl(0 75% 55%)",
  Encerrado: "hsl(215 15% 60%)",
  Suspenso:  "hsl(270 65% 55%)",
};

export function ContratosVigencia() {
  const contratos = useContratosMock();

  const data = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of contratos) {
      const s = statusFromVigencia(c.data_fim);
      contagem.set(s, (contagem.get(s) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .map(([status, total]) => ({ status, total, color: CORES_VIGENCIA[status] ?? "hsl(215 15% 60%)" }))
      .sort((a, b) => b.total - a.total);
  }, [contratos]);

  const total = data.reduce((s, c) => s + c.total, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold">Contratos por Vigência</CardTitle>
        <p className="text-[11px] text-muted-foreground">Total: {total}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-[100px_1fr] items-center gap-3 p-3">
        {data.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">Sem dados cadastrados.</p>
        ) : (
          <>
            <div className="h-[140px] w-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="total" nameKey="status" innerRadius={28} outerRadius={48} paddingAngle={2}>
                    {data.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} labelStyle={TOOLTIP_LABEL} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-xs leading-tight">
              {data.map((c) => (
                <li key={c.status} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                  <span className="truncate text-foreground">
                    {c.status} <span className="text-muted-foreground">({c.total})</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
