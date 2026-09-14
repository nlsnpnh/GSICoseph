import { History, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Nome do registro — entra no rótulo acessível de cada botão. */
  rotulo: string;
  onEditar?: () => void;
  onExcluir?: () => void;
  /** Histórico de auditoria do registro. Só admin recebe. */
  onHistorico?: () => void;
};

/**
 * Ações de uma linha de listagem: histórico, editar e excluir lado a lado, na
 * mesma célula à direita. A lixeira é permanentemente vermelha — ação
 * destrutiva não se esconde atrás de cor neutra até o hover.
 */
export function AcoesLinha({ rotulo, onEditar, onExcluir, onHistorico }: Props) {
  if (!onEditar && !onExcluir && !onHistorico) return null;

  return (
    <div className="flex items-center justify-end gap-0.5">
      {onHistorico && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          onClick={onHistorico}
          aria-label={`Histórico de ${rotulo}`}
          title="Histórico de alterações"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      )}
      {onEditar && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          onClick={onEditar}
          aria-label={`Editar ${rotulo}`}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {onExcluir && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-critical hover:bg-critical/10 hover:text-critical"
          onClick={onExcluir}
          aria-label={`Excluir ${rotulo}`}
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
