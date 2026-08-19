// Estilos e formatadores compartilhados pelas abas de Manutenção.
import type { StatusManut, SlaTone } from "@/data/ocorrencias";
import { hojeISO } from "@/lib/dates";

export const statusTone: Record<StatusManut, string> = {
  "Aberto":          "bg-partial/15 text-partial border-partial/30",
  "Em andamento":    "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Aguardando peça": "bg-muted text-muted-foreground border-border",
  "Concluído":       "bg-adequate/10 text-adequate border-adequate/30",
  "Cancelado":       "bg-muted text-muted-foreground border-border line-through",
};

export const slaToneClass: Record<SlaTone, string> = {
  adequate: "bg-adequate/10 text-adequate border-adequate/30",
  partial:  "bg-partial/15 text-partial border-partial/30",
  critical: "bg-critical/10 text-critical border-critical/30",
  muted:    "bg-muted text-muted-foreground border-border",
};

export const CHART_COLORS = [
  "hsl(217 91% 55%)", "hsl(142 65% 45%)", "hsl(42 95% 55%)", "hsl(0 75% 55%)",
  "hsl(262 70% 60%)", "hsl(180 65% 45%)", "hsl(215 15% 60%)", "hsl(30 80% 55%)",
];

// Data de Rondonia: com toISOString(), chamados abertos a noite (UTC-4) caiam no dia seguinte.
export const today = () => hojeISO();

export const fmtDate = (d: string) =>
  (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

/** Agrupa e conta ocorrências por chave, ordenado do maior para o menor. */
export function count<T>(arr: T[], key: (t: T) => string) {
  const map = new Map<string, number>();
  arr.forEach((it) => {
    const k = key(it);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
