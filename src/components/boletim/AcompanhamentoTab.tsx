import { useMemo, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { useBoletimList } from "@/data/boletim";
import { ANOS, ANO_VIGENTE, MES_VIGENTE, MESES } from "./constantes";
import { FioAcento } from "@/components/admin/FioAcento";

export function AcompanhamentoTab({
  unidades, comarcas,
}: {
  unidades: { id: string; nome: string; comarca_id: string | null }[];
  comarcas: { id: string; nome: string }[];
}) {

  const [fAno, setFAno] = useState<number>(ANO_VIGENTE);
  const [fMes, setFMes] = useState<number>(MES_VIGENTE);
  const [fComarca, setFComarca] = useState<string>("all");

  const { data: rows = [], isLoading } = useBoletimList({
    ano: fAno,
    mes: fMes,
    comarcaId: fComarca === "all" ? null : fComarca,
  });

  const comarcaNomeMap = useMemo(
    () => Object.fromEntries(comarcas.map((c) => [c.id, c.nome])),
    [comarcas],
  );

  // unidade_id -> data do lançamento mais recente naquele mês
  const lancadasMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      const prev = map.get(r.unidade_id);
      if (!prev || r.updated_at > prev) map.set(r.unidade_id, r.updated_at);
    }
    return map;
  }, [rows]);

  const unidadesAlvo = useMemo(
    () => unidades.filter((u) => fComarca === "all" || u.comarca_id === fComarca),
    [unidades, fComarca],
  );

  const linhas = useMemo(
    () =>
      unidadesAlvo
        .map((u) => ({
          id: u.id,
          nome: u.nome,
          comarca: u.comarca_id ? (comarcaNomeMap[u.comarca_id] ?? "—") : "—",
          lancou: lancadasMap.has(u.id),
          data: lancadasMap.get(u.id) ?? null,
        }))
        // Fórum Digital sempre embaixo; depois pendentes primeiro, comarca e nome
        .sort((a, b) => {
          const ehDigital = (n: string) => /f[óo]rum\s+digital/i.test(n);
          return (
            Number(ehDigital(a.nome)) - Number(ehDigital(b.nome)) ||
            Number(a.lancou) - Number(b.lancou) ||
            a.comarca.localeCompare(b.comarca, "pt-BR") ||
            a.nome.localeCompare(b.nome, "pt-BR")
          );
        }),
    [unidadesAlvo, lancadasMap, comarcaNomeMap],
  );

  const total = unidadesAlvo.length;
  const lancaram = useMemo(() => linhas.filter((l) => l.lancou).length, [linhas]);
  const pendentes = total - lancaram;
  const pct = total > 0 ? Math.round((lancaram / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <CardHeader className="border-b border-border">
          <CardTitle className="text-sm font-semibold">Período</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <Select value={String(fMes)} onValueChange={(v) => setFMes(Number(v))}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(fAno)} onValueChange={(v) => setFAno(Number(v))}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fComarca} onValueChange={setFComarca}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Comarca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as comarcas</SelectItem>
                {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Unidades no escopo" value={total} icon={ListChecks} />
        <SummaryCard label="Lançaram" value={lancaram} icon={CheckCircle2} tone="adequate" />
        <SummaryCard label="Pendentes" value={pendentes} icon={AlertCircle} tone="critical" />
        <SummaryCard label="% preenchido" value={`${pct}%`} icon={BarChart3} />
      </div>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold">
            Status por unidade — {MESES[fMes - 1]}/{fAno}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando...</p>
          ) : total === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Nenhuma unidade no escopo"
              description="Ajuste o filtro de comarca."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade predial</TableHead>
                  <TableHead>Comarca</TableHead>
                  <TableHead className="w-32 text-center">Situação</TableHead>
                  <TableHead className="w-40">Lançado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{l.comarca}</TableCell>
                    <TableCell className="text-center">
                      {l.lancou ? (
                        <Badge variant="outline" className="bg-adequate/10 text-adequate border-adequate/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />Lançado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-critical/10 text-critical border-critical/30">
                          <AlertCircle className="mr-1 h-3 w-3" />Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.data ? new Date(l.data).toLocaleDateString("pt-BR") : "—"}
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

function SummaryCard({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: number | string;
  icon: typeof ListChecks;
  tone?: "adequate" | "critical";
}) {
  const toneClass =
    tone === "adequate" ? "text-adequate"
      : tone === "critical" ? "text-critical"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />{label}
      </div>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
