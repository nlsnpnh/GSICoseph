import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatarDataHora } from "@/lib/dates";
import { calcVencimento, type Chamado } from "@/data/chamados";
import { fmtData, statusTone, vencimentoTone, prioridadeTone } from "./formatacao";

// =====================================================================
// Tabela de chamados. As visualizacoes (pendentes, fechados, todos,
// relatorio) mudam so a lista de colunas — ordenacao, paginacao e o
// clique que abre o chamado sao os mesmos em todas.
// =====================================================================

export type ColunaId =
  | "numero" | "unidade" | "assunto" | "contrato" | "categoria" | "servico"
  | "solicitante" | "responsavel" | "prioridade" | "aberto_em"
  | "ultima_movimentacao" | "prazo" | "status" | "resolvido_em" | "fechado_em";

type Ctx = {
  nomeUnidade: (id: string) => string;
  rotuloContrato: (id: string) => string;
};

type Coluna = {
  rotulo: string;
  /** Valor usado para ordenar (texto ou numero). */
  ordenar: (c: Chamado, ctx: Ctx) => string | number;
  render: (c: Chamado, ctx: Ctx) => ReactNode;
  className?: string;
};

const COLUNAS: Record<ColunaId, Coluna> = {
  numero: {
    rotulo: "Número",
    // Numero e texto no banco (aceita valor vindo de outro sistema), mas
    // ordena melhor como numero quando for numerico.
    ordenar: (c) => (/^\d+$/.test(c.numero) ? Number(c.numero) : c.numero),
    render: (c) => <span className="font-medium tabular-nums">{c.numero}</span>,
    className: "w-[92px]",
  },
  unidade: {
    rotulo: "Unidade",
    ordenar: (c, x) => x.nomeUnidade(c.unidade_id),
    render: (c, x) => <span className="block max-w-[220px] truncate">{x.nomeUnidade(c.unidade_id)}</span>,
  },
  assunto: {
    rotulo: "Assunto",
    ordenar: (c) => c.assunto,
    render: (c) => <span className="block max-w-[260px] truncate font-medium">{c.assunto}</span>,
  },
  contrato: {
    rotulo: "Contrato",
    ordenar: (c, x) => x.rotuloContrato(c.contrato_id),
    render: (c, x) => <span className="block max-w-[180px] truncate">{x.rotuloContrato(c.contrato_id)}</span>,
  },
  categoria: {
    rotulo: "Categoria",
    ordenar: (c) => c.categoria,
    render: (c) => c.categoria,
  },
  servico: {
    rotulo: "Serviço",
    ordenar: (c) => c.servico,
    render: (c) => c.servico,
  },
  solicitante: {
    rotulo: "Solicitante",
    ordenar: (c) => c.solicitante_nome,
    render: (c) => <span className="block max-w-[160px] truncate">{c.solicitante_nome || "—"}</span>,
  },
  responsavel: {
    rotulo: "Responsável",
    ordenar: (c) => c.responsavel_nome,
    render: (c) => <span className="block max-w-[160px] truncate">{c.responsavel_nome || "—"}</span>,
  },
  prioridade: {
    rotulo: "Prioridade",
    ordenar: (c) => c.prioridade,
    render: (c) => (
      <Badge variant="outline" className={`${prioridadeTone[c.prioridade]} text-[11px]`}>
        {c.prioridade}
      </Badge>
    ),
  },
  aberto_em: {
    rotulo: "Data",
    ordenar: (c) => c.aberto_em,
    render: (c) => <span className="whitespace-nowrap tabular-nums">{formatarDataHora(c.aberto_em)}</span>,
  },
  ultima_movimentacao: {
    rotulo: "Última ação",
    ordenar: (c) => c.ultima_movimentacao,
    render: (c) => <span className="whitespace-nowrap tabular-nums">{formatarDataHora(c.ultima_movimentacao)}</span>,
  },
  prazo: {
    rotulo: "Prazo",
    ordenar: (c) => c.prazo || "9999-12-31",
    render: (c) => {
      const v = calcVencimento(c);
      if (!c.prazo) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="tabular-nums">{fmtData(c.prazo)}</span>
          <Badge variant="outline" className={`${vencimentoTone[v.tone]} text-[11px]`}>{v.rotulo}</Badge>
        </div>
      );
    },
  },
  status: {
    rotulo: "Status",
    ordenar: (c) => c.status,
    render: (c) => (
      <Badge variant="outline" className={`${statusTone[c.status]} text-[11px]`}>{c.status}</Badge>
    ),
  },
  resolvido_em: {
    rotulo: "Resolvido em",
    ordenar: (c) => c.resolvido_em || "",
    render: (c) => <span className="whitespace-nowrap tabular-nums">{formatarDataHora(c.resolvido_em)}</span>,
  },
  fechado_em: {
    rotulo: "Fechado em",
    ordenar: (c) => c.fechado_em || "",
    render: (c) => <span className="whitespace-nowrap tabular-nums">{formatarDataHora(c.fechado_em)}</span>,
  },
};

const TAMANHO_PAGINA = 15;

export function TabelaChamados({
  chamados, colunas, nomeUnidade, rotuloContrato, ordemInicial = "aberto_em",
}: {
  chamados: Chamado[];
  colunas: ColunaId[];
  nomeUnidade: (id: string) => string;
  rotuloContrato: (id: string) => string;
  ordemInicial?: ColunaId;
}) {
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<ColunaId>(ordemInicial);
  const [direcao, setDirecao] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);

  const ctx = { nomeUnidade, rotuloContrato };

  const ordenados = useMemo(() => {
    const col = COLUNAS[ordem];
    return [...chamados].sort((a, b) => {
      const va = col.ordenar(a, ctx);
      const vb = col.ordenar(b, ctx);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "pt-BR");
      return direcao === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamados, ordem, direcao, nomeUnidade, rotuloContrato]);

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = ordenados.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  const alternarOrdem = (id: ColunaId) => {
    if (id === ordem) {
      setDirecao((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdem(id);
      setDirecao("asc");
    }
    setPagina(1);
  };

  return (
    <>
      {/* A tabela rola sozinha no horizontal: em celular a página não desloca. */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {colunas.map((id) => (
                <TableHead key={id} className={COLUNAS[id].className}>
                  <button
                    type="button"
                    onClick={() => alternarOrdem(id)}
                    className="flex items-center gap-1 whitespace-nowrap hover:text-foreground"
                  >
                    {COLUNAS[id].rotulo}
                    <ArrowUpDown className={`h-3 w-3 ${id === ordem ? "text-foreground" : "opacity-40"}`} />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => navigate(`/chamados/${c.id}`)}
                className="cursor-pointer"
              >
                {colunas.map((id) => (
                  <TableCell key={id} className="text-[13px]">
                    {COLUNAS[id].render(c, ctx)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            {(paginaAtual - 1) * TAMANHO_PAGINA + 1}–
            {Math.min(paginaAtual * TAMANHO_PAGINA, ordenados.length)} de {ordenados.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2">{paginaAtual} / {totalPaginas}</span>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
