// Filtros combinaveis da Central de Chamados e dos Relatorios.
// Funcao pura: as telas so guardam o estado e chamam `aplicarFiltros`.
import { addDiasISO, hojeISO, toISODate } from "@/lib/dates";
import type { Chamado } from "@/data/chamados";
import { calcVencimento, isPendente } from "@/data/chamados";

export const PERIODOS = [
  { id: "todos",       rotulo: "Todo o período" },
  { id: "hoje",        rotulo: "Hoje" },
  { id: "7dias",       rotulo: "Últimos 7 dias" },
  { id: "30dias",      rotulo: "Últimos 30 dias" },
  { id: "mes",         rotulo: "Mês atual" },
  { id: "mesAnterior", rotulo: "Mês anterior" },
  { id: "ano",         rotulo: "Ano atual" },
  { id: "custom",      rotulo: "Período personalizado" },
] as const;
export type PeriodoId = (typeof PERIODOS)[number]["id"];

export type FiltrosChamado = {
  busca: string;
  unidade: string;
  contrato: string;
  categoria: string;
  servico: string;
  status: string;
  prioridade: string;
  responsavel: string;
  periodo: PeriodoId;
  de: string;
  ate: string;
  /** "vencidos" e "parados" respondem "quais precisam de atenção?". */
  destaque: "todos" | "vencidos" | "parados";
};

export const FILTROS_VAZIOS: FiltrosChamado = {
  busca: "", unidade: "all", contrato: "all", categoria: "all", servico: "all",
  status: "all", prioridade: "all", responsavel: "all",
  periodo: "todos", de: "", ate: "", destaque: "todos",
};

/** Intervalo [de, ate] em YYYY-MM-DD para um preset de periodo. */
export function intervaloDoPeriodo(
  periodo: PeriodoId,
  de: string,
  ate: string,
): { de: string; ate: string } {
  const hoje = hojeISO();
  const [ano, mes] = hoje.split("-").map(Number);
  const primeiroDoMes = (a: number, m: number) =>
    `${a}-${String(m).padStart(2, "0")}-01`;

  switch (periodo) {
    case "hoje":   return { de: hoje, ate: hoje };
    case "7dias":  return { de: addDiasISO(hoje, -6), ate: hoje };
    case "30dias": return { de: addDiasISO(hoje, -29), ate: hoje };
    case "mes":    return { de: primeiroDoMes(ano, mes), ate: hoje };
    case "mesAnterior": {
      const anoAnt = mes === 1 ? ano - 1 : ano;
      const mesAnt = mes === 1 ? 12 : mes - 1;
      const inicio = primeiroDoMes(anoAnt, mesAnt);
      // Ultimo dia do mes anterior = dia anterior ao primeiro do mes atual.
      return { de: inicio, ate: addDiasISO(primeiroDoMes(ano, mes), -1) };
    }
    case "ano":    return { de: `${ano}-01-01`, ate: hoje };
    case "custom": return { de, ate };
    default:       return { de: "", ate: "" };
  }
}

/** Dia (Rondonia) da abertura de um chamado, para comparar com o periodo. */
const diaDaAbertura = (c: Chamado) =>
  (c.aberto_em ? toISODate(new Date(c.aberto_em)) : "");

export function aplicarFiltros(
  chamados: Chamado[],
  f: FiltrosChamado,
  nomeUnidade: (id: string) => string,
  rotuloContrato: (id: string) => string,
): Chamado[] {
  const periodo = intervaloDoPeriodo(f.periodo, f.de, f.ate);
  const q = f.busca.trim().toLowerCase();

  return chamados.filter((c) => {
    if (f.unidade    !== "all" && c.unidade_id  !== f.unidade)    return false;
    if (f.contrato   !== "all" && c.contrato_id !== f.contrato)   return false;
    if (f.categoria  !== "all" && c.categoria   !== f.categoria)  return false;
    if (f.servico    !== "all" && c.servico     !== f.servico)    return false;
    if (f.status     !== "all" && c.status      !== f.status)     return false;
    if (f.prioridade !== "all" && c.prioridade  !== f.prioridade) return false;
    if (f.responsavel !== "all" && (c.responsavel_nome || "—") !== f.responsavel) return false;

    if (f.destaque === "vencidos" && !(isPendente(c.status) && calcVencimento(c).vencido)) return false;
    if (f.destaque === "parados") {
      // Parado = pendente e sem nenhuma movimentacao ha mais de 7 dias.
      if (!isPendente(c.status)) return false;
      const mov = c.ultima_movimentacao ? toISODate(new Date(c.ultima_movimentacao)) : "";
      if (!mov || mov > addDiasISO(hojeISO(), -7)) return false;
    }

    const dia = diaDaAbertura(c);
    if (periodo.de  && dia && dia < periodo.de)  return false;
    if (periodo.ate && dia && dia > periodo.ate) return false;

    if (!q) return true;
    return [
      c.numero, c.assunto, c.descricao, c.categoria, c.servico,
      c.solicitante_nome, c.responsavel_nome, c.solucao,
      nomeUnidade(c.unidade_id), rotuloContrato(c.contrato_id),
      ...c.tags,
    ].some((campo) => campo?.toLowerCase().includes(q));
  });
}
