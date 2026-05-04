import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  children: ReactNode;
  count: number;
  filters?: ReactNode;
}

export function CrudTableLayout({ search, onSearchChange, placeholder, children, count, filters }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder ?? "Buscar..."}
              className="pl-8"
            />
          </div>
          {filters}
        </div>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "registro" : "registros"}
        </span>
      </div>
      {children}
    </Card>
  );
}
