import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, CheckCircle2, Inbox, PauseCircle, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/StatCard";
import { FioAcento } from "@/components/admin/FioAcento";
import { TYPO } from "@/lib/design-tokens";
import { hojeISO, toISODate } from "@/lib/dates";
import { calcVencimento, isPendente, type Chamado } from "@/data/chamados";
import type { Contrato } from "@/data/contratos";
import type { UnidadePredial } from "@/data/unidades";
import { FiltrosChamados } from "./FiltrosChamados";
import type { FiltrosChamado } from "./filtros";

// =====================================================================
// Painel do modulo: os numeros que a gestao olha primeiro, e o recorte por
// unidade predial — que e o separador principal dos chamados.
// =====================================================================

/** Moldura padrao das tabelas do painel: fio de acento e cabecalho em caixa alta. */
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      <CardHeader className="border-b border-border bg-muted/30 px-3 py-2">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function PainelTab({
  chamados, unidades, contratos, filtros, onFiltrosChange, responsaveis, nomeUnidade,
}: {
  chamados: Chamado[];
  unidades: UnidadePredial[];
  contratos: Contrato[];
  filtros: FiltrosChamado;
  onFiltrosChange: (f: FiltrosChamado) => void;
  responsaveis: string[];
  nomeUnidade: (id: string) => string;
}) {
  const navigate = useNavigate();

  const ind = useMemo(() => {
    const mesAtual = hojeISO().slice(0, 7);
    return {
      abertos: chamados.filter((c) => isPendente(c.status)).length,
      emAtendimento: chamados.filter((c) => c.status === "Em atendimento").length,
      aguardando: chamados.filter((c) =>
        c.status === "Novo" || c.status === "Aberto" || c.status === "Encaminhado" ||
        c.status === "Aguardando prestador").length,
      vencidos: chamados.filter((c) => isPendente(c.status) && calcVencimento(c).vencido).length,
      resolvidosNoMes: chamados.filter((c) =>
        c.resolvido_em && toISODate(new Date(c.resolvido_em)).startsWith(mesAtual)).length,
    };
  }, [chamados]);

  // Uma linha por unidade que tem chamado. Unidade sem chamado nenhum nao
  // ocupa espaco na tabela — as 39 unidades deixariam o painel ilegivel.
  const porUnidade = useMemo(() => {
    const mapa = new Map<string, {
      unidadeId: string; total: number; pendentes: number;
      emAtendimento: number; vencidos: number; resolvidos: number; fechados: number;
    }>();

    chamados.forEach((c) => {
      const linha = mapa.get(c.unidade_id) ?? {
        unidadeId: c.unidade_id, total: 0, pendentes: 0,
        emAtendimento: 0, vencidos: 0, resolvidos: 0, fechados: 0,
      };
      linha.total += 1;
      if (isPendente(c.status)) linha.pendentes += 1;
      if (c.status === "Em atendimento") linha.emAtendimento += 1;
      if (isPendente(c.status) && calcVencimento(c).vencido) linha.vencidos += 1;
      if (c.status === "Resolvido") linha.resolvidos += 1;
      if (c.status === "Fechado") linha.fechados += 1;
      mapa.set(c.unidade_id, linha);
    });

    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [chamados]);

  const vencidos = useMemo(
    () => chamados
      .filter((c) => isPendente(c.status) && calcVencimento(c).vencido)
      .sort((a, b) => (a.prazo || "").localeCompare(b.prazo || "")),
    [chamados],
  );

  const numCol = `${TYPO.num} text-right`;

  return (
    <div className="space-y-4">
      <FiltrosChamados
        filtros={filtros} onChange={onFiltrosChange}
        unidades={unidades} contratos={contratos} responsaveis={responsaveis}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Chamados abertos" value={ind.abertos} icon={Inbox} iconeTom="azul" />
        <StatCard label="Em atendimento" value={ind.emAtendimento} icon={Wrench} iconeTom="ciano" />
        <StatCard label="Aguardando atendimento" value={ind.aguardando} icon={PauseCircle} iconeTom="dourado" />
        <StatCard
          label="Vencidos" value={ind.vencidos} icon={AlarmClock} iconeTom="vermelho"
          tone={ind.vencidos > 0 ? "destructive" : "default"}
        />
        <StatCard label="Resolvidos no mês" value={ind.resolvidosNoMes} icon={CheckCircle2} iconeTom="verde" />
      </div>

      <Bloco titulo="Chamados por unidade predial">
        {porUnidade.length === 0 ? (
          <p className="px-3 py-6 text-[13px] text-muted-foreground">
            Nenhum chamado no recorte selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade predial</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pendentes</TableHead>
                  <TableHead className="text-right">Em atendimento</TableHead>
                  <TableHead className="text-right">Vencidos</TableHead>
                  <TableHead className="text-right">Resolvidos</TableHead>
                  <TableHead className="text-right">Fechados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porUnidade.map((u) => (
                  <TableRow
                    key={u.unidadeId}
                    className="cursor-pointer"
                    // Clicar na unidade estreita o filtro global para ela.
                    onClick={() => onFiltrosChange({ ...filtros, unidade: u.unidadeId })}
                  >
                    <TableCell className={`${TYPO.cell} font-medium`}>{nomeUnidade(u.unidadeId)}</TableCell>
                    <TableCell className={numCol}>{u.total}</TableCell>
                    <TableCell className={numCol}>{u.pendentes}</TableCell>
                    <TableCell className={numCol}>{u.emAtendimento}</TableCell>
                    <TableCell className={`${numCol} ${u.vencidos > 0 ? "font-medium text-critical" : ""}`}>
                      {u.vencidos}
                    </TableCell>
                    <TableCell className={numCol}>{u.resolvidos}</TableCell>
                    <TableCell className={numCol}>{u.fechados}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Bloco>

      {vencidos.length > 0 && (
        <Bloco titulo="Chamados vencidos">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[92px]">Número</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="text-right">Dias em atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vencidos.map((c) => (
                  <TableRow
                    key={c.id} className="cursor-pointer"
                    onClick={() => navigate(`/chamados/${c.id}`)}
                  >
                    <TableCell className={`${TYPO.num} font-medium`}>{c.numero}</TableCell>
                    <TableCell className={TYPO.cell}>{nomeUnidade(c.unidade_id)}</TableCell>
                    <TableCell className={TYPO.cell}>{c.assunto}</TableCell>
                    <TableCell className={`${numCol} font-medium text-critical`}>
                      {Math.abs(calcVencimento(c).diasRestantes ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Bloco>
      )}
    </div>
  );
}
