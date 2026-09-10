import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlarmClock, CheckCircle2, Download, FileSpreadsheet, Inbox, Ticket, Wrench,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { EmptyState } from "@/components/EmptyState";
import { FioAcento } from "@/components/admin/FioAcento";
import { BarHorizontal, ChartCard, Donut, Empty, Kpi } from "@/components/relatorios/ui";
import { CHART, TYPO } from "@/lib/design-tokens";
import { formatarDataHora, toISODate } from "@/lib/dates";
import {
  STATUS_CHAMADO, calcVencimento, diasSemMovimentacao,
  isPendente, tempoAtendimentoDias, type Chamado,
} from "@/data/chamados";
import type { Contrato } from "@/data/contratos";
import type { UnidadePredial } from "@/data/unidades";
import { exportExcelMulti, exportPdfTable, type Column } from "@/lib/exporters";
import { toast } from "@/hooks/use-toast";
import { FiltrosChamados } from "./FiltrosChamados";
import { TabelaChamados, type ColunaId } from "./TabelaChamados";
import type { FiltrosChamado } from "./filtros";
import { contar, fmtData } from "./formatacao";

// =====================================================================
// Relatorios do modulo — exclusivamente sobre os chamados. Todos os
// numeros e graficos respeitam os mesmos filtros da central, e a
// apresentacao reusa os blocos de `components/relatorios/ui.tsx`.
// =====================================================================

const COLUNAS_RELATORIO: ColunaId[] = [
  "numero", "unidade", "contrato", "assunto", "categoria", "responsavel",
  "aberto_em", "ultima_movimentacao", "prazo", "status", "resolvido_em",
];

/**
 * Indicador secundario: o mesmo card, com o numero em corpo menor. Existe
 * para nao competir com os tres protagonistas da linha de cima — quando
 * tudo tem o mesmo peso, nada se destaca.
 */
function Secundario({ rotulo, valor, alerta }: { rotulo: string; valor: number; alerta?: boolean }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      <CardContent className="px-3 py-2.5">
        <p className={`${TYPO.eyebrow} text-muted-foreground`}>{rotulo}</p>
        <p className={`mt-1.5 text-[20px] font-light tabular-nums leading-none tracking-[-0.03em] ${alerta ? "text-critical" : ""}`}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

export function RelatoriosTab({
  chamados, unidades, contratos, filtros, onFiltrosChange, responsaveis,
  nomeUnidade, rotuloContrato,
}: {
  chamados: Chamado[];
  unidades: UnidadePredial[];
  contratos: Contrato[];
  filtros: FiltrosChamado;
  onFiltrosChange: (f: FiltrosChamado) => void;
  responsaveis: string[];
  nomeUnidade: (id: string) => string;
  rotuloContrato: (id: string) => string;
}) {
  const [busca, setBusca] = useState("");

  const ind = useMemo(() => ({
    total: chamados.length,
    pendentes: chamados.filter((c) => isPendente(c.status)).length,
    emAtendimento: chamados.filter((c) => c.status === "Em atendimento").length,
    resolvidos: chamados.filter((c) => c.status === "Resolvido").length,
    fechados: chamados.filter((c) => c.status === "Fechado").length,
    cancelados: chamados.filter((c) => c.status === "Cancelado").length,
    vencidos: chamados.filter((c) => isPendente(c.status) && calcVencimento(c).vencido).length,
    parados: chamados.filter((c) => isPendente(c.status) && diasSemMovimentacao(c) > 7).length,
  }), [chamados]);

  const porStatus = useMemo(
    // Ordem do fluxo, nao a alfabetica: o grafico conta uma historia.
    () => STATUS_CHAMADO
      .map((s) => ({ name: s, value: chamados.filter((c) => c.status === s).length }))
      .filter((d) => d.value > 0),
    [chamados],
  );

  // Sem corte aqui: o gráfico dobra a cauda em "Outras (n)", o que preserva o
  // total — cortar fora esconderia parte dos chamados sem avisar.
  const porUnidade = useMemo(
    () => contar(chamados, (c) => nomeUnidade(c.unidade_id)),
    [chamados, nomeUnidade],
  );

  const porCategoria = useMemo(
    () => contar(chamados, (c) => c.categoria || "Sem categoria"),
    [chamados],
  );

  const porMes = useMemo(() => {
    const mapa = new Map<string, { abertos: number; resolvidos: number }>();
    const bucket = (chave: string) => mapa.get(chave) ?? { abertos: 0, resolvidos: 0 };

    chamados.forEach((c) => {
      if (c.aberto_em) {
        const m = toISODate(new Date(c.aberto_em)).slice(0, 7);
        mapa.set(m, { ...bucket(m), abertos: bucket(m).abertos + 1 });
      }
      if (c.resolvido_em) {
        const m = toISODate(new Date(c.resolvido_em)).slice(0, 7);
        mapa.set(m, { ...bucket(m), resolvidos: bucket(m).resolvidos + 1 });
      }
    });

    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => {
        const [ano, m] = mes.split("-");
        return { name: `${m}/${ano.slice(2)}`, ...v };
      });
  }, [chamados]);

  const maisAntigos = useMemo(
    () => chamados
      .filter((c) => isPendente(c.status))
      .sort((a, b) => (a.aberto_em || "").localeCompare(b.aberto_em || ""))
      .slice(0, 10),
    [chamados],
  );

  const tempos = chamados.map(tempoAtendimentoDias).filter((t): t is number => t != null);
  const tempoMedio = tempos.length
    ? Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10
    : 0;

  const filtradosPorBusca = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return chamados;
    return chamados.filter((c) =>
      [c.numero, c.assunto, c.categoria, c.responsavel_nome, nomeUnidade(c.unidade_id)]
        .some((campo) => campo?.toLowerCase().includes(q)));
  }, [chamados, busca, nomeUnidade]);

  // ── Exportacao ────────────────────────────────────────────────────
  const linhasExport = () => chamados.map((c) => ({
    "Número": c.numero,
    "Unidade predial": nomeUnidade(c.unidade_id),
    "Contrato": rotuloContrato(c.contrato_id),
    "Assunto": c.assunto,
    "Serviço": c.servico,
    "Categoria": c.categoria,
    "Solicitante": c.solicitante_nome,
    "Responsável": c.responsavel_nome,
    "Prioridade": c.prioridade,
    "Abertura": formatarDataHora(c.aberto_em),
    "Última movimentação": formatarDataHora(c.ultima_movimentacao),
    "Prazo": fmtData(c.prazo),
    "Status": c.status,
    "Resolvido em": formatarDataHora(c.resolvido_em),
    "Fechado em": formatarDataHora(c.fechado_em),
  }));

  const colunasPdf: Column[] = [
    { header: "Nº", key: "Número" },
    { header: "Unidade", key: "Unidade predial" },
    { header: "Contrato", key: "Contrato" },
    { header: "Assunto", key: "Assunto" },
    { header: "Categoria", key: "Categoria" },
    { header: "Responsável", key: "Responsável" },
    { header: "Abertura", key: "Abertura" },
    { header: "Prazo", key: "Prazo" },
    { header: "Status", key: "Status" },
  ];

  const exportarExcel = async () => {
    try {
      await exportExcelMulti([
        { name: "Chamados", rows: linhasExport() },
        { name: "Por status", rows: porStatus.map((d) => ({ Status: d.name, Chamados: d.value })) },
        { name: "Por unidade", rows: porUnidade.map((d) => ({ Unidade: d.name, Chamados: d.value })) },
        { name: "Por categoria", rows: porCategoria.map((d) => ({ Categoria: d.name, Chamados: d.value })) },
      ], "chamados");
      toast({ title: "Planilha gerada" });
    } catch (e) {
      toast({ title: "Erro ao exportar", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const exportarPdf = async () => {
    try {
      await exportPdfTable({
        title: "Relatório de chamados — COSEPH/TJRO",
        subtitle: `${ind.total} chamado(s) · ${ind.pendentes} pendente(s) · ${ind.vencidos} vencido(s)`,
        columns: colunasPdf,
        rows: linhasExport(),
        fileName: "chamados",
      });
      toast({ title: "PDF gerado" });
    } catch (e) {
      toast({ title: "Erro ao exportar", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <FiltrosChamados
        filtros={filtros} onChange={onFiltrosChange}
        unidades={unidades} contratos={contratos} responsaveis={responsaveis}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={exportarExcel} disabled={chamados.length === 0}>
          <FileSpreadsheet className="mr-1 h-4 w-4" />Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportarPdf} disabled={chamados.length === 0}>
          <Download className="mr-1 h-4 w-4" />PDF
        </Button>
      </div>

      {chamados.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nenhum chamado encontrado."
          description="Não há chamados no recorte selecionado — ajuste os filtros ou o período."
        />
      ) : (
        <>
          {/* Três protagonistas: o volume, o que está em curso e o que já
              saiu. O resto do fluxo fica na linha secundária abaixo. */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi icon={Ticket}        label="Total de chamados" value={ind.total} />
            <Kpi icon={Inbox}         label="Pendentes"         value={ind.pendentes} />
            <Kpi icon={CheckCircle2}  label="Resolvidos"        value={ind.resolvidos} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Secundario rotulo="Em atendimento" valor={ind.emAtendimento} />
            <Secundario rotulo="Fechados"       valor={ind.fechados} />
            <Secundario rotulo="Cancelados"     valor={ind.cancelados} />
            <Secundario rotulo="Vencidos"       valor={ind.vencidos} alerta={ind.vencidos > 0} />
            <Secundario rotulo="Sem movimentação" valor={ind.parados} alerta={ind.parados > 0} />
          </div>

          <Card className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
            <CardContent className="flex flex-wrap items-baseline gap-x-2 px-3 py-2.5">
              <span className={`${TYPO.eyebrow} text-muted-foreground`}>
                Tempo médio de atendimento
              </span>
              <span className="text-[20px] font-light tabular-nums leading-none tracking-[-0.03em]">
                {tempoMedio}
              </span>
              <span className="text-[11px] text-muted-foreground">
                dias, sobre {tempos.length} chamado(s) resolvido(s)
              </span>
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title="Chamados por status">
              <Donut data={porStatus} />
            </ChartCard>

            <ChartCard title="Chamados por categoria">
              <BarHorizontal data={porCategoria} />
            </ChartCard>

            <ChartCard title="Chamados por unidade predial">
              <BarHorizontal data={porUnidade} />
            </ChartCard>

            {/* Abertos e resolvidos no mesmo eixo: dois gráficos separados do
                mesmo período obrigariam o olho a comparar de longe. */}
            <ChartCard title="Abertos x resolvidos por mês">
              {porMes.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={porMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="name" {...CHART.axisStyle} />
                    <YAxis allowDecimals={false} {...CHART.axisStyle} />
                    <Tooltip {...CHART.tooltip} cursor={{ fill: "hsl(var(--muted))" }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="abertos"    name="Abertos"    fill={CHART.primary}  radius={[3, 3, 0, 0]} />
                    <Bar dataKey="resolvidos" name="Resolvidos" fill={CHART.adequate} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {maisAntigos.length > 0 && (
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <FioAcento />
              <CardHeader className="border-b border-border bg-muted/30 px-3 py-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">
                  Pendentes há mais tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TabelaChamados
                  chamados={maisAntigos}
                  colunas={["numero", "unidade", "assunto", "aberto_em", "status", "prazo"]}
                  nomeUnidade={nomeUnidade} rotuloContrato={rotuloContrato}
                  ordemInicial="aberto_em"
                />
              </CardContent>
            </Card>
          )}

          <CrudTableLayout
            search={busca} onSearchChange={setBusca}
            placeholder="Buscar no relatório..."
            count={filtradosPorBusca.length}
            filters={
              ind.vencidos > 0 ? (
                <span className="flex items-center gap-1 text-[11px] text-critical">
                  <AlarmClock className="h-3.5 w-3.5" />{ind.vencidos} vencido(s)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />nenhum vencido
                </span>
              )
            }
          >
            <TabelaChamados
              chamados={filtradosPorBusca} colunas={COLUNAS_RELATORIO}
              nomeUnidade={nomeUnidade} rotuloContrato={rotuloContrato}
              ordemInicial="aberto_em"
            />
          </CrudTableLayout>
        </>
      )}
    </div>
  );
}
