import type { StatusPlanejamento, PrioridadePlanejamento } from "@/data/planejamento";

/**
 * Cor do ponto que identifica o status. O ponto acompanha o rótulo tanto na
 * lista de opções quanto no campo já preenchido — antes o campo mostrava o
 * rótulo dentro de uma bolha, que dentro da tabela virava ruído.
 */
export function statusDotClass(status: StatusPlanejamento): string {
  switch (status) {
    case "Concluída":    return "bg-adequate";
    case "Em andamento": return "bg-blue-500";
    case "Atrasada":     return "bg-critical";
    case "Suspensa":     return "bg-partial";
    case "Não iniciada":
    default:             return "bg-muted-foreground/40";
  }
}

/** Cor do ponto que identifica a prioridade. */
export function prioridadeDotClass(prioridade: PrioridadePlanejamento | null): string {
  switch (prioridade) {
    case "Alta":  return "bg-critical";
    case "Média": return "bg-partial";
    case "Baixa": return "bg-blue-500";
    default:      return "bg-muted-foreground/40";
  }
}
