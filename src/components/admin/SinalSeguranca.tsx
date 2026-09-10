import { cn } from "@/lib/utils";
import type { IndicadorSeguranca } from "@/data/unidades";

type Props = {
  label: string;
  ativo: IndicadorSeguranca;
  /** Texto lido por leitor de tela quando o recurso não existe na unidade. */
  tituloInativo?: string;
};

/**
 * Indicador compacto de recurso de segurança (DERSO, controle de acesso,
 * vigilância). Ocupa o espaço de um chip e substitui uma coluna inteira de
 * "Sim/Não" — o olho varre a coluna pela cor, não pela leitura.
 *
 * Três estados, não dois: `null` é "não informado" e precisa se distinguir de
 * "não possui". Sem isso, quem varre a lista não consegue saber onde falta
 * cadastro — que é exatamente o que pintava comarcas de vermelho sem motivo.
 */
export function SinalSeguranca({ label, ativo, tituloInativo }: Props) {
  const naoInformado = ativo == null;

  const titulo = naoInformado
    ? `${label}: não informado`
    : ativo
      ? label
      : (tituloInativo ?? `Sem ${label}`);

  return (
    <span
      title={titulo}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
        naoInformado
          // Tracejado: sinaliza ausência de resposta sem competir com as cores
          // de estado, e continua legível sem depender de cor.
          ? "border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground/70"
          : ativo
            ? "border-adequate/30 bg-adequate/10 text-adequate"
            : "border-border bg-muted/50 text-muted-foreground/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          naoInformado
            ? "bg-transparent ring-1 ring-muted-foreground/50"
            : ativo
              ? "bg-adequate"
              : "bg-muted-foreground/40",
        )}
      />
      {label}
      {naoInformado && <span aria-hidden="true">?</span>}
    </span>
  );
}
