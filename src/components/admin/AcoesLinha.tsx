import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Nome do registro — entra no rótulo acessível de cada botão. */
  rotulo: string;
  onEditar?: () => void;
  onExcluir?: () => void;
};

/**
 * Ações de uma linha de listagem: editar e excluir sempre lado a lado, na
 * mesma célula à direita. A lixeira é permanentemente vermelha — ação
 * destrutiva não se esconde atrás de cor neutra até o hover.
 */
export function AcoesLinha({ rotulo, onEditar, onExcluir }: Props) {
  if (!onEditar && !onExcluir) return null;

  return (
    <div className="flex items-center justify-end gap-0.5">
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
