import type { StatusPlanejamento, PrioridadePlanejamento } from "@/data/planejamento";

/** Classe de cor (Badge) para cada status, no padrão de cores do sistema. */
export function statusBadgeClass(status: StatusPlanejamento): string {
  switch (status) {
    case "Concluída":
      return "bg-adequate/10 text-adequate border-adequate/30";
    case "Em andamento":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "Atrasada":
      return "bg-critical/10 text-critical border-critical/30";
    case "Suspensa":
      return "bg-partial/15 text-partial border-partial/30";
    case "Não iniciada":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function prioridadeBadgeClass(prioridade: PrioridadePlanejamento | null): string {
  switch (prioridade) {
    case "Alta":
      return "bg-critical/10 text-critical border-critical/30";
    case "Média":
      return "bg-partial/15 text-partial border-partial/30";
    case "Baixa":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
