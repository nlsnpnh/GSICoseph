import { FioAcento } from "@/components/admin/FioAcento";
import { cn } from "@/lib/utils";

/**
 * Bloco de um formulário de cadastro — "Dados principais", "Segurança",
 * "Contato". Leva o fio de acento no topo, como os cards do sistema.
 *
 * Existia como cópia local em cinco páginas (Unidades, Comarcas, Servidores,
 * Terceirizados, Contratos), todas com o mesmo markup. Ficou aqui para que
 * um ajuste de apresentação valha para todos os cadastros de uma vez, em vez
 * de precisar ser repetido cinco vezes — e esquecido no sexto.
 */
export function SecaoFormulario({
  title, children, className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-border bg-muted/20", className)}>
      <FioAcento />
      <div className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}
