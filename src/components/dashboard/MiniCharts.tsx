import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServidoresMock } from "@/data/servidoresMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";
import { useContratosMock, statusFromVigencia } from "@/data/contratosMock";

const CORES_EQUIP: Record<string, string> = {
  "Câmera":                   "hsl(217 91% 55%)",
  "Catraca":                  "hsl(142 65% 45%)",
  "Portão":                   "hsl(42 95% 55%)",
  "Sensor":                   "hsl(0 75% 55%)",
  "Alarme":                   "hsl(270 65% 55%)",
  "DVR/NVR":                  "hsl(190 70% 50%)",
  "Porta giratória":          "hsl(30 80% 55%)",
  "Detector de metais":       "hsl(160 60% 45%)",
  "Scanner Raio-X":           "hsl(340 70% 55%)",
  "Botão de pânico":          "hsl(0 90% 45%)",
  "Controle facial/biométrico": "hsl(250 60% 55%)",
  "Nobreak":                  "hsl(60 70% 50%)",
  "Rack":                     "hsl(215 15% 55%)",
  "Monitor":                  "hsl(200 60% 50%)",
};

export function ServidoresPorComarca() {
  const servidores = useServidoresMock();

  const data = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const s of servidores) {
      if (s.situacao !== "Ativo") continue;
      contagem.set(s.comarca, (contagem.get(s.comarca) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .map(([comarca, total]) => ({ comarca, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [servidores]);

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
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="total" fill="hsl(217 91% 55%)" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function EquipamentosDonut() {
  const equipamentos = useEquipamentosMock();

  const data = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const e of equipamentos) {
      contagem.set(e.tipo, (contagem.get(e.tipo) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .map(([tipo, total]) => ({ tipo, total, color: CORES_EQUIP[tipo] ?? "hsl(215 15% 60%)" }))
      .sort((a, b) => b.total - a.total);
  }, [equipamentos]);

  const total = data.reduce((s, e) => s + e.total, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold">Equipamentos por Tipo</CardTitle>
        <p className="text-[11px] text-muted-foreground">Total: {total.toLocaleString("pt-BR")}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-[110px_1fr] items-center gap-3 p-3">
        {data.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">Sem dados cadastrados.</p>
        ) : (
          <>
            <div className="h-[140px] w-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="total" nameKey="tipo" innerRadius={32} outerRadius={55} paddingAngle={2}>
                    {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-xs leading-tight">
              {data.map((e) => (
                <li key={e.tipo} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: e.color }} />
                  <span className="truncate text-foreground">
                    {e.tipo} <span className="text-muted-foreground">({e.total})</span>
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
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
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
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
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
