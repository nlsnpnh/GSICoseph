import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TYPO } from "@/lib/design-tokens";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  children: ReactNode;
  count: number;
  filters?: ReactNode;
}

/**
 * Moldura das listagens: barra de ferramentas enxuta (busca + filtros à
 * esquerda, contagem à direita) e tabela colada embaixo — sem respiro
 * desperdiçado entre a barra e o dado.
 */
export function CrudTableLayout({ search, onSearchChange, placeholder, children, count, filters }: Props) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder ?? "Buscar..."}
              className="h-8 border-border/70 bg-card pl-8 text-[13px]"
            />
          </div>
          {filters}
        </div>
        <span className={`${TYPO.eyebrow} text-muted-foreground`}>
          {count} {count === 1 ? "registro" : "registros"}
        </span>
      </div>
      {children}
    </Card>
  );
}
