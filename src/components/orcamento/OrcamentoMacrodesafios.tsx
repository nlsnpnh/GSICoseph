import { useMemo } from "react";
import { Wallet, FileSignature, CheckCircle2, PiggyBank } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FioAcento } from "@/components/admin/FioAcento";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  resumoPorAcao, totalGeral, fmtBRL, fmtBRL0, fmtPct,
  type OrcamentoAcao,
} from "@/data/orcamento";

const ACAO_COR: Record<string, string> = {
  "4078": "hsl(217 91% 55%)",
  "4080": "hsl(42 95% 50%)",
  "4079": "hsl(160 60% 42%)",
};

type Props = { itens: OrcamentoAcao[] };

export function OrcamentoMacrodesafios({ itens }: Props) {
  const resumo = useMemo(() => resumoPorAcao(itens), [itens]);
  const total = useMemo(() => totalGeral(resumo), [resumo]);

  const execData = resumo.map((r) => ({
    acao: r.label,
    key: r.acao,
    Dotação: r.dotacao,
    Empenho: r.empenho,
    Liquidado: r.liquidado,
  }));

  const saldoData = resumo
    .filter((r) => r.saldo > 0)
    .map((r) => ({ name: r.label, value: r.saldo, cor: ACAO_COR[r.acao] }));

  return (
    <div className="space-y-5">
      {/* Cards de resumo geral */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dotação Total" value={fmtBRL0(total.dotacao)} icon={Wallet} tone="primary" />
        <StatCard label={`Empenhado (${fmtPct(total.pctEmpenho)})`} value={fmtBRL0(total.empenho)} icon={FileSignature} tone="info" />
        <StatCard label={`Liquidado (${fmtPct(total.pctLiquidacao)})`} value={fmtBRL0(total.liquidado)} icon={CheckCircle2} tone="success" />
        <StatCard label={`Saldo da Dotação (${fmtPct(total.pctSaldo)})`} value={fmtBRL0(total.saldo)} icon={PiggyBank} tone="warning" />
      </div>

      {/* Tabela consolidada por ação */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Consolidado por Ação Orçamentária</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação / Projeto</TableHead>
                  <TableHead className="text-right">Dotação</TableHead>
                  <TableHead className="text-right">Empenho</TableHead>
                  <TableHead className="text-center">% Emp.</TableHead>
                  <TableHead className="text-right">Liquidação</TableHead>
                  <TableHead className="text-center">% Liq.</TableHead>
                  <TableHead className="text-right">Saldo da Dotação</TableHead>
                  <TableHead className="text-center">% Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumo.map((r) => (
                  <TableRow key={r.acao}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtBRL(r.dotacao)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtBRL(r.empenho)}</TableCell>
                    <TableCell className="text-center tabular-nums text-blue-600">{fmtPct(r.pctEmpenho)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtBRL(r.liquidado)}</TableCell>
                    <TableCell className="text-center tabular-nums text-adequate">{fmtPct(r.pctLiquidacao)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtBRL(r.saldo)}</TableCell>
                    <TableCell className="text-center tabular-nums text-partial">{fmtPct(r.pctSaldo)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 bg-muted/40 font-semibold">
                  <TableCell>TOTAL GERAL</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtBRL(total.dotacao)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtBRL(total.empenho)}</TableCell>
                  <TableCell className="text-center tabular-nums">{fmtPct(total.pctEmpenho)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtBRL(total.liquidado)}</TableCell>
                  <TableCell className="text-center tabular-nums">{fmtPct(total.pctLiquidacao)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtBRL(total.saldo)}</TableCell>
                  <TableCell className="text-center tabular-nums">{fmtPct(total.pctSaldo)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Dotação x Empenho x Liquidado por ação */}
        <Card className="overflow-hidden lg:col-span-3 border-border/80 shadow-sm">
          <FioAcento />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Execução por Ação (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={execData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="acao" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Dotação" fill="hsl(217 91% 55%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Empenho" fill="hsl(270 65% 55%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Liquidado" fill="hsl(160 60% 42%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição do saldo por ação */}
        <Card className="overflow-hidden lg:col-span-2 border-border/80 shadow-sm">
          <FioAcento />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saldo da Dotação por Ação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={saldoData.length ? saldoData : [{ name: "Sem saldo", value: 1, cor: "hsl(215 16% 80%)" }]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {(saldoData.length ? saldoData : [{ name: "Sem saldo", value: 1, cor: "hsl(215 16% 80%)" }]).map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, nm: string) => [fmtBRL(v), nm]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
