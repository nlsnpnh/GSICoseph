import { cn } from "@/lib/utils";

type Props = {
  label: string;
  ativo: boolean;
  /** Texto lido por leitor de tela quando o recurso não existe na unidade. */
  tituloInativo?: string;
};

/**
 * Indicador compacto de recurso de segurança (DERSO, controle de acesso,
 * vigilância). Ocupa o espaço de um chip e substitui uma coluna inteira de
 * "Sim/Não" — o olho varre a coluna pela cor, não pela leitura.
 */
export function SinalSeguranca({ label, ativo, tituloInativo }: Props) {
  return (
    <span
      title={ativo ? label : (tituloInativo ?? `Sem ${label}`)}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
        ativo
          ? "border-adequate/30 bg-adequate/10 text-adequate"
          : "border-border bg-muted/50 text-muted-foreground/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", ativo ? "bg-adequate" : "bg-muted-foreground/40")}
      />
      {label}
    </span>
  );
}
