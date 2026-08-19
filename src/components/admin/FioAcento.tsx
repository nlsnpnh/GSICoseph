import { cn } from "@/lib/utils";

/**
 * Fio de acento de 1px no topo do card — dourado no centro, dissolvendo nas
 * pontas. É o único ornamento do sistema: marca a borda superior sem virar
 * moldura, e some visualmente quando o olho está lendo o conteúdo.
 *
 * Use dentro de um `<Card>` com `overflow-hidden`, como primeiro filho.
 */
export function FioAcento({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-px w-full shrink-0 bg-gradient-to-r from-transparent via-accent/70 to-transparent",
        className,
      )}
    />
  );
}
