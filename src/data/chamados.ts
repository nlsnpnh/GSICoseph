import { useQuery } from "@tanstack/react-query";
import { addDiasISO, diffDiasISO, hojeISO, toISODate } from "@/lib/dates";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { queryClient } from "@/lib/queryClient";
import type { Contrato } from "./contratos";
import type { TipoEvento } from "./chamadoEventos";

// =====================================================================
// Central de Chamados de prestacao de servicos (public.chamados).
//
// Regra central do modulo: nenhum chamado existe sem UNIDADE PREDIAL e sem
// CONTRATO. O fluxo e unidade -> contrato -> chamado -> atendimento ->
// historico -> conclusao, e cada passo vira um evento em `chamado_eventos`.
// =====================================================================

// ── Fluxo de status ──────────────────────────────────────────────────
export const STATUS_CHAMADO = [
  "Novo",
  "Aberto",
  "Encaminhado",
  "Em atendimento",
  "Aguardando prestador",
  "Resolvido",
  "Fechado",
  "Cancelado",
] as const;
export type StatusChamado = (typeof STATUS_CHAMADO)[number];

/** Encerrados saem da fila de pendentes; juntos os dois grupos cobrem tudo. */
export const STATUS_ENCERRADOS: StatusChamado[] = ["Fechado", "Cancelado"];

export const isPendente = (s: StatusChamado) => !STATUS_ENCERRADOS.includes(s);

/**
 * Transicoes validas. Impede saltos incoerentes (de "Novo" direto para
 * "Fechado", por exemplo) sem engessar o atendimento real.
 */
export const TRANSICOES: Record<StatusChamado, StatusChamado[]> = {
  "Novo":                 ["Aberto", "Encaminhado", "Em atendimento", "Cancelado"],
  "Aberto":               ["Encaminhado", "Em atendimento", "Aguardando prestador", "Resolvido", "Cancelado"],
  "Encaminhado":          ["Em atendimento", "Aguardando prestador", "Resolvido", "Cancelado"],
  "Em atendimento":       ["Aguardando prestador", "Resolvido", "Cancelado"],
  "Aguardando prestador": ["Em atendimento", "Resolvido", "Cancelado"],
  "Resolvido":            ["Fechado", "Em atendimento"],
  "Fechado":              ["Aberto"],   // reabertura
  "Cancelado":            ["Aberto"],   // reabertura
};

export const podeTransicionar = (de: StatusChamado, para: StatusChamado) =>
  TRANSICOES[de].includes(para);

// ── Catalogos do chamado ─────────────────────────────────────────────
export const SERVICOS = [
  "Manutenção corretiva",
  "Manutenção preventiva",
  "Instalação",
  "Remanejamento",
  "Retirada",
  "Vistoria",
  "Ajuste",
  "Suporte técnico",
] as const;

export const CATEGORIAS = [
  "Alarme",
  "Botão de Pânico",
  "Catraca",
  "Câmera",
  "Computador Cadastramento",
  "Computador Monitoramento",
  "Controle de Acesso",
  "Corneta",
  "Portão",
  "Preventiva",
  "Reconhecimento Facial",
  "Rede",
  "RFID",
  "Sirene",
  "Videowall",
  "Vídeo Porteiro",
  "Outros",
] as const;

export const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

// ── Modelo ───────────────────────────────────────────────────────────
export type Chamado = {
  id: string;
  numero: string;
  unidade_id: string;
  contrato_id: string;
  solicitante_id: string | null;
  solicitante_nome: string;
  responsavel_nome: string;
  servico: string;
  categoria: string;
  assunto: string;
  descricao: string;
  status: StatusChamado;
  prioridade: Prioridade;
  aberto_em: string;             // instante ISO
  ultima_movimentacao: string;   // instante ISO
  prazo: string;                 // YYYY-MM-DD (vencimento) ou ""
  resolvido_em: string;
  fechado_em: string;
  solucao: string;
  tags: string[];
  cc: string[];
};

// ── Prazo e vencimento ───────────────────────────────────────────────
/**
 * Vencimento = dia da abertura + SLA do contrato. Sem `sla_dias` no contrato
 * nao ha prazo a cobrar: o chamado fica sem vencimento em vez de herdar um
 * numero inventado.
 */
export function calcPrazo(abertoEm: string, slaDias: number | null): string {
  if (!abertoEm || !slaDias || slaDias <= 0) return "";
  return addDiasISO(toISODate(new Date(abertoEm)), slaDias);
}

export type VencimentoTone = "adequate" | "partial" | "critical" | "muted";
export type Vencimento = {
  rotulo: string;
  tone: VencimentoTone;
  vencido: boolean;
  diasRestantes: number | null;
};

export function calcVencimento(c: Pick<Chamado, "prazo" | "status" | "resolvido_em">): Vencimento {
  if (!c.prazo || c.status === "Cancelado") {
    return { rotulo: "—", tone: "muted", vencido: false, diasRestantes: null };
  }

  // Ja resolvido: o que importa e se cumpriu o prazo, nao quanto falta.
  if (c.resolvido_em) {
    const noPrazo = toISODate(new Date(c.resolvido_em)) <= c.prazo;
    return noPrazo
      ? { rotulo: "No prazo",      tone: "adequate", vencido: false, diasRestantes: null }
      : { rotulo: "Fora do prazo", tone: "critical", vencido: true,  diasRestantes: null };
  }

  if (STATUS_ENCERRADOS.includes(c.status)) {
    return { rotulo: "—", tone: "muted", vencido: false, diasRestantes: null };
  }

  const diasRestantes = diffDiasISO(hojeISO(), c.prazo);
  if (diasRestantes < 0)  return { rotulo: "Vencido",  tone: "critical", vencido: true,  diasRestantes };
  if (diasRestantes <= 1) return { rotulo: "Em risco", tone: "partial",  vencido: false, diasRestantes };
  return { rotulo: "No prazo", tone: "adequate", vencido: false, diasRestantes };
}

export const isVencido = (c: Chamado) => calcVencimento(c).vencido && isPendente(c.status);

/** Dias corridos entre abertura e resolucao; null enquanto nao resolvido. */
export function tempoAtendimentoDias(c: Pick<Chamado, "aberto_em" | "resolvido_em">): number | null {
  if (!c.aberto_em || !c.resolvido_em) return null;
  const dias = diffDiasISO(toISODate(new Date(c.aberto_em)), toISODate(new Date(c.resolvido_em)));
  return dias < 0 ? 0 : dias;
}

/** Dias sem nenhuma movimentacao — alimenta "chamados parados". */
export function diasSemMovimentacao(c: Pick<Chamado, "ultima_movimentacao">): number {
  if (!c.ultima_movimentacao) return 0;
  return Math.max(0, diffDiasISO(toISODate(new Date(c.ultima_movimentacao)), hojeISO()));
}

// ── Vinculo unidade -> contrato ──────────────────────────────────────
/** Contratos aplicaveis a uma unidade. Sem unidade escolhida, lista vazia. */
export function contratosDaUnidade(contratos: Contrato[], unidadeId: string): Contrato[] {
  if (!unidadeId) return [];
  return contratos.filter((c) => c.unidade_ids.includes(unidadeId));
}

/** "V2 INTEGRADORA DE SOLUÇÕES..." -> "V2 INTEGRADORA" (item 10 do modulo). */
export function empresaCurta(empresa: string): string {
  return empresa.trim().split(/\s+/).slice(0, 2).join(" ");
}

// ── Acesso a dados ───────────────────────────────────────────────────
const KEY = ["chamados"];

const mapRow = (r: Tables<"chamados">): Chamado => ({
  id: r.id,
  numero: r.numero ?? "",
  unidade_id: r.unidade_id ?? "",
  contrato_id: r.contrato_id ?? "",
  solicitante_id: r.solicitante_id ?? null,
  solicitante_nome: r.solicitante_nome ?? "",
  responsavel_nome: r.responsavel_nome ?? "",
  servico: r.servico ?? "",
  categoria: r.categoria ?? "",
  assunto: r.assunto ?? "",
  descricao: r.descricao ?? "",
  status: (r.status ?? "Novo") as StatusChamado,
  prioridade: (r.prioridade ?? "Média") as Prioridade,
  aberto_em: r.aberto_em ?? "",
  ultima_movimentacao: r.ultima_movimentacao ?? "",
  prazo: r.prazo ?? "",
  resolvido_em: r.resolvido_em ?? "",
  fechado_em: r.fechado_em ?? "",
  solucao: r.solucao ?? "",
  tags: r.tags ?? [],
  cc: r.cc ?? [],
});

export function useChamados(): Chamado[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .order("aberto_em", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

export function useChamado(id: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: [...KEY, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("chamados").select("*").eq("id", id).single();
      if (error) throw error;
      return mapRow(data);
    },
  });
  return { chamado: data ?? null, carregando: isLoading };
}

const invalidate = (id?: string) => {
  queryClient.invalidateQueries({ queryKey: KEY });
  if (id) queryClient.invalidateQueries({ queryKey: ["chamado-eventos", id] });
};

// ── Escrita ──────────────────────────────────────────────────────────
export type ChamadoInput = {
  numero?: string;               // vazio = sequencia do banco
  unidade_id: string;
  contrato_id: string;
  solicitante_id: string | null;
  solicitante_nome: string;
  responsavel_nome: string;
  servico: string;
  categoria: string;
  assunto: string;
  descricao: string;
  prioridade: Prioridade;
  prazo: string;
  tags: string[];
  cc: string[];
};

type Autor = { id: string | null; nome: string };

async function registrarEvento(
  chamadoId: string,
  autor: Autor,
  tipo: TipoEvento,
  mensagem: string | null,
  status?: { anterior: StatusChamado | null; novo: StatusChamado | null },
) {
  const { error } = await supabase.from("chamado_eventos").insert({
    chamado_id: chamadoId,
    tipo,
    mensagem,
    status_anterior: status?.anterior ?? null,
    status_novo: status?.novo ?? null,
    autor_id: autor.id,
    autor_nome: autor.nome,
  });
  if (error) throw error;
}

export async function addChamado(d: ChamadoInput, autor: Autor): Promise<Chamado> {
  const payload: TablesInsert<"chamados"> = {
    unidade_id: d.unidade_id,
    contrato_id: d.contrato_id,
    solicitante_id: d.solicitante_id,
    solicitante_nome: d.solicitante_nome || null,
    responsavel_nome: d.responsavel_nome || null,
    servico: d.servico,
    categoria: d.categoria,
    assunto: d.assunto,
    descricao: d.descricao,
    prioridade: d.prioridade,
    prazo: d.prazo || null,
    tags: d.tags,
    cc: d.cc,
    status: "Novo",
    criado_por: autor.id,
  };
  // Numero informado a mao existe para receber chamado que nasceu em outro
  // sistema; em branco, o banco usa a sequencia.
  if (d.numero?.trim()) payload.numero = d.numero.trim();

  const { data, error } = await supabase.from("chamados").insert(payload).select("*").single();
  if (error) throw error;

  const criado = mapRow(data);
  await registrarEvento(criado.id, autor, "Abertura", `Chamado aberto por ${autor.nome}.`, {
    anterior: null,
    novo: "Novo",
  });
  invalidate(criado.id);
  return criado;
}

export async function updateChamado(id: string, d: Partial<ChamadoInput>) {
  const { error } = await supabase.from("chamados").update(d).eq("id", id);
  if (error) throw error;
  invalidate(id);
}

/** Mensagem/atualizacao no chamado, sem mexer no status. */
export async function comentarChamado(id: string, mensagem: string, autor: Autor) {
  await registrarEvento(id, autor, "Mensagem", mensagem);
  invalidate(id);
}

export async function mudarStatus(
  chamado: Chamado,
  novo: StatusChamado,
  mensagem: string,
  autor: Autor,
) {
  if (!podeTransicionar(chamado.status, novo)) {
    throw new Error(`Transição inválida: ${chamado.status} → ${novo}.`);
  }
  const { error } = await supabase
    .from("chamados")
    .update({ status: novo })
    .eq("id", chamado.id);
  if (error) throw error;

  await registrarEvento(chamado.id, autor, "Status", mensagem || null, {
    anterior: chamado.status,
    novo,
  });
  invalidate(chamado.id);
}

/** Encerramento: status final, momento da conclusao e solucao adotada. */
export async function encerrarChamado(
  chamado: Chamado,
  d: { status: Extract<StatusChamado, "Resolvido" | "Fechado" | "Cancelado">; solucao: string; justificativa: string },
  autor: Autor,
) {
  if (!podeTransicionar(chamado.status, d.status)) {
    throw new Error(`Transição inválida: ${chamado.status} → ${d.status}.`);
  }
  const agora = new Date().toISOString();
  const patch: TablesUpdate<"chamados"> = { status: d.status, solucao: d.solucao };
  if (d.status === "Resolvido") patch.resolvido_em = agora;
  if (d.status === "Fechado") {
    patch.fechado_em = agora;
    // Fechar sem ter passado por "Resolvido" ainda assim marca a resolucao,
    // senao o indicador de SLA fica sem data para comparar.
    if (!chamado.resolvido_em) patch.resolvido_em = agora;
  }

  const { error } = await supabase.from("chamados").update(patch).eq("id", chamado.id);
  if (error) throw error;

  const tipo = d.status === "Fechado" ? "Fechamento" : "Conclusão";
  const texto = [d.solucao, d.justificativa].filter(Boolean).join("\n\n");
  await registrarEvento(chamado.id, autor, tipo, texto || null, {
    anterior: chamado.status,
    novo: d.status,
  });
  invalidate(chamado.id);
}

export async function reabrirChamado(chamado: Chamado, justificativa: string, autor: Autor) {
  const { error } = await supabase
    .from("chamados")
    .update({ status: "Aberto", resolvido_em: null, fechado_em: null })
    .eq("id", chamado.id);
  if (error) throw error;

  await registrarEvento(chamado.id, autor, "Reabertura", justificativa, {
    anterior: chamado.status,
    novo: "Aberto",
  });
  invalidate(chamado.id);
}

export async function removeChamado(id: string) {
  const { error } = await supabase.from("chamados").delete().eq("id", id);
  if (error) throw error;
  invalidate(id);
}
