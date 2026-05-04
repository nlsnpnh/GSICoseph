import { useEffect } from "react";
import { LucideIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function ModulePage({
  title,
  description,
  icon,
  emptyTitle = "Nenhum registro cadastrado",
  emptyDescription = "Os dados deste módulo serão exibidos aqui após o cadastro inicial.",
}: ModulePageProps) {
  useEffect(() => {
    document.title = `${title} | SIG-COSEPH`;
  }, [title]);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        }
      />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
