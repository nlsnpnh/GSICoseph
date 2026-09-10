// Estilos e formatadores compartilhados pela Central de Chamados.
import type { StatusChamado, VencimentoTone, Prioridade } from "@/data/chamados";
import type { TipoEvento } from "@/data/chamadoEventos";

export const statusTone: Record<StatusChamado, string> = {
  "Novo":                 "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Aberto":               "bg-partial/15 text-partial border-partial/30",
  "Encaminhado":          "bg-purple-500/10 text-purple-600 border-purple-500/30",
  "Em atendimento":       "bg-cyan-500/10 text-cyan-700 border-cyan-500/30",
  "Aguardando prestador": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Resolvido":            "bg-adequate/10 text-adequate border-adequate/30",
  "Fechado":              "bg-muted text-muted-foreground border-border",
  "Cancelado":            "bg-muted text-muted-foreground border-border line-through",
};

export const vencimentoTone: Record<VencimentoTone, string> = {
  adequate: "bg-adequate/10 text-adequate border-adequate/30",
  partial:  "bg-partial/15 text-partial border-partial/30",
  critical: "bg-critical/10 text-critical border-critical/30",
  muted:    "bg-muted text-muted-foreground border-border",
};

export const prioridadeTone: Record<Prioridade, string> = {
  "Baixa":   "bg-muted text-muted-foreground border-border",
  "Média":   "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Alta":    "bg-partial/15 text-partial border-partial/30",
  "Urgente": "bg-critical/10 text-critical border-critical/30",
};

/** Cor do marcador na linha do tempo, por tipo de evento. */
export const eventoTone: Record<TipoEvento, string> = {
  "Abertura":    "bg-blue-500",
  "Mensagem":    "bg-muted-foreground",
  "Status":      "bg-purple-500",
  "Contrato":    "bg-amber-500",
  "Anexo":       "bg-cyan-500",
  "Atendimento": "bg-cyan-600",
  "Conclusão":   "bg-adequate",
  "Fechamento":  "bg-muted-foreground",
  "Reabertura":  "bg-critical",
};

/** Data YYYY-MM-DD -> dd/mm/aaaa. Vazio vira "—". */
export const fmtData = (d: string) =>
  (d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR") : "—");

/** Agrupa e conta por chave, do maior para o menor. */
export function contar<T>(arr: T[], chave: (t: T) => string) {
  const mapa = new Map<string, number>();
  arr.forEach((it) => {
    const k = chave(it);
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  });
  return Array.from(mapa.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
