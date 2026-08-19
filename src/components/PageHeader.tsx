import { ReactNode } from "react";
import { TYPO } from "@/lib/design-tokens";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Rótulo curto em caixa alta que situa a página no sistema (ex.: "Cadastro"). */
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-accent" aria-hidden="true" />
            <span className={`${TYPO.eyebrow} text-accent`}>{eyebrow}</span>
          </div>
        )}
        <h1 className={`text-foreground ${TYPO.pageTitle} ${eyebrow ? "mt-1.5" : ""}`}>{title}</h1>
        {description && (
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
