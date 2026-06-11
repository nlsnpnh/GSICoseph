import { useMemo } from "react";
import {
  ListChecks, Circle, Loader2, CheckCircle2, AlertTriangle, PauseCircle, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  SETORES, resumoPorSetor, mediaGeralExecucao, type PlanejamentoAcao, type ResumoSetor,
} from "@/data/planejamento";

const SETOR_COR: Record<string, string> = {
  assessoria_coseph: "hsl(217 91% 55%)",
  nop_adm: "hsl(270 65% 55%)",
  nop_ope: "hsl(42 95% 50%)",
  cim: "hsl(160 60% 42%)",
};

const STATUS_DEFS: { key: string; cor: string }[] = [
  { key: "Não iniciada", cor: "hsl(215 16% 60%)" },
  { key: "Em andamento", cor: "hsl(217 91% 55%)" },
  { key: "Concluída", cor: "hsl(160 60% 42%)" },
  { key: "Atrasada", cor: "hsl(0 75% 55%)" },
  { key: "Suspensa", cor: "hsl(42 95% 50%)" },
];

type Props = { acoes: PlanejamentoAcao[] };

export function PlanejamentoPainel({ acoes }: Props) {
  const resumo = useMemo(() => resumoPorSetor(acoes), [acoes]);

  const totais = useMemo(() => {
    const t = resumo.reduce(
      (acc, r) => {
        acc.total += r.total;
        acc.naoIniciadas += r.naoIniciadas;
        acc.emAndamento += r.emAndamento;
        acc.concluidas += r.concluidas;
        acc.atrasadas += r.atrasadas;
        acc.suspensas += r.suspensas;
        return acc;
      },
      { total: 0, naoIniciadas: 0, emAndamento: 0, concluidas: 0, atrasadas: 0, suspensas: 0 },
    );
    return { ...t, media: mediaGeralExecucao(resumo) };
  }, [resumo]);

  const execData = resumo.map((r) => ({ setor: r.label, pct: r.mediaExecucao, key: r.setor }));
  const statusData = resumo.map((r) => ({
    setor: r.label,
    "Não iniciada": r.naoIniciadas,
    "Em andamento": r.emAndamento,
    "Concluída": r.concluidas,
    "Atrasada": r.atrasadas,
    "Suspensa": r.suspensas,
  }));

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total de Ações" value={totais.total} icon={ListChecks} tone="primary" />
        <StatCard label="Não iniciadas" value={totais.naoIniciadas} icon={Circle} tone="default" />
        <StatCard label="Em andamento" value={totais.emAndamento} icon={Loader2} tone="info" />
        <StatCard label="Concluídas" value={totais.concluidas} icon={CheckCircle2} tone="success" />
        <StatCard label="Atrasadas" value={totais.atrasadas} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Suspensas" value={totais.suspensas} icon={PauseCircle} tone="warning" />
        <StatCard label="% Médio de Execução" value={`${totais.media}%`} icon={BarChart3} tone="accent" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Tabela consolidada por setor */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consolidado por Setor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Não inic.</TableHead>
                    <TableHead className="text-center">Em and.</TableHead>
                    <TableHead className="text-center">Concl.</TableHead>
                    <TableHead className="text-center">Atras.</TableHead>
                    <TableHead className="text-center">Susp.</TableHead>
                    <TableHead className="text-center">% Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumo.map((r) => (
                    <TableRow key={r.setor}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-center">{r.total}</TableCell>
                      <TableCell className="text-center">{r.naoIniciadas}</TableCell>
                      <TableCell className="text-center text-blue-600">{r.emAndamento}</TableCell>
                      <TableCell className="text-center text-adequate">{r.concluidas}</TableCell>
                      <TableCell className="text-center text-critical">{r.atrasadas}</TableCell>
                      <TableCell className="text-center text-partial">{r.suspensas}</TableCell>
                      <TableCell className="text-center font-semibold">{r.mediaExecucao}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/40 font-semibold">
                    <TableCell>TOTAL GERAL</TableCell>
                    <TableCell className="text-center">{totais.total}</TableCell>
                    <TableCell className="text-center">{totais.naoIniciadas}</TableCell>
                    <TableCell className="text-center">{totais.emAndamento}</TableCell>
                    <TableCell className="text-center">{totais.concluidas}</TableCell>
                    <TableCell className="text-center">{totais.atrasadas}</TableCell>
                    <TableCell className="text-center">{totais.suspensas}</TableCell>
                    <TableCell className="text-center">{totais.media}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de execução por setor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Execução por Setor (% médio)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={execData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="setor" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "% médio"]} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {execData.map((d) => (
                      <Cell key={d.key} fill={SETOR_COR[d.key] ?? "hsl(217 91% 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de status por setor (barras empilhadas) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição de Status por Setor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="setor" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {STATUS_DEFS.map((s) => (
                  <Bar key={s.key} dataKey={s.key} stackId="st" fill={s.cor} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Um gráfico (rosca) por setor */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {resumo.map((r) => (
          <SetorDonut key={r.setor} resumo={r} />
        ))}
      </div>

      {/* Objetivos das unidades/setores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Objetivos das Unidades</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {SETORES.map((s) => (
            <div key={s.key} className="rounded-md border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.objetivo}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SetorDonut({ resumo: r }: { resumo: ResumoSetor }) {
  const data = [
    { name: "Não iniciada", value: r.naoIniciadas, cor: STATUS_DEFS[0].cor },
    { name: "Em andamento", value: r.emAndamento, cor: STATUS_DEFS[1].cor },
    { name: "Concluída", value: r.concluidas, cor: STATUS_DEFS[2].cor },
    { name: "Atrasada", value: r.atrasadas, cor: STATUS_DEFS[3].cor },
    { name: "Suspensa", value: r.suspensas, cor: STATUS_DEFS[4].cor },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">{r.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.length ? data : [{ name: "Sem ações", value: 1, cor: "hsl(215 16% 80%)" }]}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={2}
                stroke="none"
              >
                {(data.length ? data : [{ name: "Sem ações", value: 1, cor: "hsl(215 16% 80%)" }]).map((d, i) => (
                  <Cell key={i} fill={d.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none">{r.mediaExecucao}%</span>
            <span className="text-[10px] text-muted-foreground">execução</span>
          </div>
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          {r.total} {r.total === 1 ? "ação" : "ações"}
        </p>
      </CardContent>
    </Card>
  );
}
