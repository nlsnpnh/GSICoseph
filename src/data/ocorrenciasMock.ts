import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

// =====================================================================
// Módulo de MANUTENÇÃO (chamados técnicos / manutenção predial).
// Persiste na tabela public.ocorrencias (reaproveitada).
// Mantém campos legados para retrocompatibilidade dos painéis antigos
// (Dashboard, Consultas, Relatórios, MiniCharts, Alertas).
// =====================================================================

// ── Status do chamado (enum status_oco do banco) ─────────────────────
export const STATUS_MANUT = [
  "Aberto", "Em andamento", "Aguardando peça", "Concluído", "Cancelado",
] as const;
export type StatusManut = (typeof STATUS_MANUT)[number];

const STATUS_ABERTOS: StatusManut[] = ["Aberto", "Em andamento", "Aguardando peça"];

// ── Categorias de manutenção + prazo de SLA (dias) por categoria ─────
export const CATEGORIAS_MANUT = [
  { nome: "Elétrica",                       slaDias: 3 },
  { nome: "Hidráulica",                     slaDias: 3 },
  { nome: "Civil / Alvenaria",              slaDias: 7 },
  { nome: "Climatização / Ar-condicionado", slaDias: 5 },
  { nome: "Refrigeração",                   slaDias: 5 },
  { nome: "Marcenaria / Mobiliário",        slaDias: 7 },
  { nome: "Pintura",                        slaDias: 10 },
  { nome: "Serralheria / Esquadrias",       slaDias: 7 },
  { nome: "Rede / Cabeamento / TI",         slaDias: 3 },
  { nome: "Elevadores",                     slaDias: 2 },
  { nome: "Combate a incêndio",             slaDias: 2 },
  { nome: "Gerador / Nobreak",              slaDias: 3 },
  { nome: "Limpeza / Conservação",          slaDias: 5 },
  { nome: "Dedetização / Pragas",           slaDias: 7 },
  { nome: "Outros",                         slaDias: 5 },
] as const;

export const CATEGORIAS_NOMES = CATEGORIAS_MANUT.map((c) => c.nome);
export const SLA_PADRAO_DIAS = 5;

export function slaDiasDaCategoria(categoria: string): number {
  return CATEGORIAS_MANUT.find((c) => c.nome === categoria)?.slaDias ?? SLA_PADRAO_DIAS;
}

// ── Modelo ───────────────────────────────────────────────────────────
export type OcorrenciaManut = {
  id: string;
  protocolo: string;             // Número
  // modelo de manutenção
  servico: string;               // Serviço (Completo)
  categoria: string;             // Categoria
  unidade_id: string;            // Cliente (Completo) = unidade predial
  servidor_solicitante: string;  // Servidor Solicitante TJ RO
  responsavel_nome: string;      // Responsável
  data_abertura: string;         // Aberto em (YYYY-MM-DD)
  data_conclusao: string;        // Data Final (YYYY-MM-DD)
  status: StatusManut;           // Status
  // ── legado (compat com painéis existentes) ──
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: "Baixa" | "Média" | "Alta" | "Urgente";
  equipamento: string;
  empresa_responsavel: string;
  prazo: string;
  observacoes: string;
};

// ── Indicador de SLA (derivado da categoria) ─────────────────────────
export type SlaIndicador = "No prazo" | "Em risco" | "Atrasado" | "Fora do prazo" | "—";
export type SlaTone = "adequate" | "partial" | "critical" | "muted";
export type SlaInfo = {
  indicador: SlaIndicador;
  tone: SlaTone;
  dataLimite: string | null;     // YYYY-MM-DD
  diasRestantes: number | null;  // >0 faltam, <0 atrasado (somente em aberto)
};

export function calcSla(
  o: Pick<OcorrenciaManut, "data_abertura" | "categoria" | "status" | "data_conclusao">,
): SlaInfo {
  if (o.status === "Cancelado" || !o.data_abertura) {
    return { indicador: "—", tone: "muted", dataLimite: null, diasRestantes: null };
  }
  const dias = slaDiasDaCategoria(o.categoria);
  const limite = new Date(o.data_abertura + "T00:00:00");
  limite.setDate(limite.getDate() + dias);
  const dataLimite = limite.toISOString().slice(0, 10);

  if (o.status === "Concluído") {
    if (!o.data_conclusao) return { indicador: "No prazo", tone: "adequate", dataLimite, diasRestantes: null };
    const fim = new Date(o.data_conclusao + "T00:00:00");
    return fim.getTime() <= limite.getTime()
      ? { indicador: "No prazo", tone: "adequate", dataLimite, diasRestantes: null }
      : { indicador: "Fora do prazo", tone: "critical", dataLimite, diasRestantes: null };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasRestantes = Math.round((limite.getTime() - hoje.getTime()) / 86_400_000);
  if (diasRestantes < 0)  return { indicador: "Atrasado", tone: "critical",  dataLimite, diasRestantes };
  if (diasRestantes <= 1) return { indicador: "Em risco", tone: "partial",   dataLimite, diasRestantes };
  return { indicador: "No prazo", tone: "adequate", dataLimite, diasRestantes };
}

/** True quando o chamado está em aberto (não concluído/cancelado). */
export const isAberto = (status: StatusManut) => STATUS_ABERTOS.includes(status);

/** Dias úteis de atendimento (abertura → conclusão), null se ainda aberto. */
export function tempoAtendimentoDias(o: Pick<OcorrenciaManut, "data_abertura" | "data_conclusao" | "status">): number | null {
  if (o.status !== "Concluído" || !o.data_abertura || !o.data_conclusao) return null;
  const ini = new Date(o.data_abertura + "T00:00:00").getTime();
  const fim = new Date(o.data_conclusao + "T00:00:00").getTime();
  if (fim < ini) return 0;
  return Math.round((fim - ini) / 86_400_000);
}

// ── Acesso a dados ───────────────────────────────────────────────────
const KEY = ["ocorrencias"];

const mapRow = (r: any): OcorrenciaManut => ({
  id: r.id,
  protocolo: r.protocolo ?? "",
  servico: r.servico ?? r.titulo ?? "",
  categoria: r.categoria ?? "",
  unidade_id: r.unidade_id ?? "",
  servidor_solicitante: r.servidor_solicitante ?? "",
  responsavel_nome: r.responsavel_nome ?? r.empresa_responsavel ?? "",
  data_abertura: r.data_abertura ?? "",
  data_conclusao: r.data_conclusao ?? "",
  status: (r.status ?? "Aberto") as StatusManut,
  // legado
  titulo: r.titulo ?? "",
  descricao: r.descricao ?? "",
  tipo: r.tipo ?? "",
  prioridade: r.prioridade ?? "Média",
  equipamento: r.equipamento ?? "",
  empresa_responsavel: r.empresa_responsavel ?? "",
  prazo: r.prazo ?? "",
  observacoes: r.observacoes ?? "",
});

export function useOcorrenciasMock(): OcorrenciaManut[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocorrencias")
        .select("*")
        .order("data_abertura", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

// Campos editáveis no formulário de manutenção.
export type ManutInput = {
  servico: string;
  categoria: string;
  unidade_id: string;
  servidor_solicitante: string;
  responsavel_nome: string;
  data_abertura: string;
  data_conclusao: string;
  status: StatusManut;
};

const toPayload = (d: ManutInput) => ({
  servico: d.servico,
  categoria: d.categoria,
  unidade_id: d.unidade_id || null,
  servidor_solicitante: d.servidor_solicitante || null,
  responsavel_nome: d.responsavel_nome || null,
  data_abertura: d.data_abertura || null,
  data_conclusao: d.data_conclusao || null,
  status: d.status,
  // retrocompat: mantém os painéis legados funcionando
  titulo: d.servico,
  tipo: "Manutenção corretiva",
});

export async function addOcorrenciaMock(d: ManutInput) {
  const { error } = await supabase.from("ocorrencias").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateOcorrenciaMock(id: string, d: ManutInput) {
  const { error } = await supabase.from("ocorrencias").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeOcorrenciaMock(id: string) {
  const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
