import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FioAcento } from "@/components/admin/FioAcento";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  hrefLabel?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "accent" | "primary" | "info";
  onClick?: () => void;
}

// A cor do número é reservada para o que exige atenção. Indicadores de
// inventário ficam neutros — quando tudo é colorido, nada se destaca.
const toneClasses: Record<NonNullable<StatCardProps["tone"]>, { icon: string; value: string }> = {
  default:     { icon: "text-muted-foreground/60", value: "text-foreground" },
  primary:     { icon: "text-primary/70",          value: "text-foreground" },
  info:        { icon: "text-blue-600/70",         value: "text-blue-700 dark:text-blue-400" },
  success:     { icon: "text-adequate/70",         value: "text-adequate" },
  warning:     { icon: "text-partial/80",          value: "text-partial" },
  destructive: { icon: "text-critical/80",         value: "text-critical" },
  accent:      { icon: "text-accent/70",           value: "text-accent" },
};

export function StatCard({ label, value, icon: Icon, href, hrefLabel, tone = "default", onClick }: StatCardProps) {
  const t = toneClasses[tone];
  const clicavel = !!href || !!onClick;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-sm transition-colors",
        clicavel && "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.025]",
      )}
    >
      <FioAcento />
      <div className="flex items-start justify-between gap-2 px-3 pt-2">
        <p className="min-w-0 text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", t.icon)} aria-hidden="true" />
      </div>

      <p className={cn("mt-1.5 px-3 text-[26px] font-light tabular-nums leading-none tracking-[-0.03em]", t.value)}>
        {value}
      </p>

      {(href || hrefLabel) &&
        (href ? (
          <Link to={href} className="mb-2 ml-3 mt-1.5 inline-block text-[10px] font-medium uppercase tracking-[0.1em] text-primary hover:underline">
            {hrefLabel ?? "Ver detalhes"}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="mb-2 ml-3 mt-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-primary hover:underline"
          >
            {hrefLabel ?? "Ver detalhes"}
          </button>
        ))}
    </Card>
  );
}
