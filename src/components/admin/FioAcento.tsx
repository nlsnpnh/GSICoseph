import { cn } from "@/lib/utils";

/**
 * Fio de acento de 1px no topo do card — dourado no centro, mais discreto nas
 * pontas. É o único ornamento do sistema: marca a borda superior sem virar
 * moldura, e some visualmente quando o olho está lendo o conteúdo.
 *
 * Renderiza um `<span>` em bloco, e não uma `<div>`, para poder viver também
 * dentro de um `<button>` — onde só cabe conteúdo de frase.
 *
 * Use como primeiro filho de um contêiner com `overflow-hidden`.
 */
export function FioAcento({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-px w-full shrink-0 bg-gradient-to-r from-accent/25 via-accent to-accent/25",
        className,
      )}
    />
  );
}
