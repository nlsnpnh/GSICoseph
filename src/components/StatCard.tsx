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

export function StatCard({
  label, value, icon: Icon, href, hrefLabel, tone = "default", onClick,
}: StatCardProps) {
  const t = toneClasses[tone];
  const clicavel = !!href || !!onClick;

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden border-border/80 shadow-sm transition-colors",
        "min-h-[104px]",
        clicavel && "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.025]",
      )}
    >
      <FioAcento />

      <div className="flex flex-1 flex-col px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Rotulo pode ocupar duas linhas: "Equipamentos instalados" nao cabe
              em uma so na largura de um oitavo da tela. */}
          <p className="min-w-0 text-[9px] font-medium uppercase leading-[1.3] tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <Icon className={cn("h-3.5 w-3.5 shrink-0", t.icon)} aria-hidden="true" />
        </div>

        <p
          className={cn(
            "mt-auto pt-2 text-[28px] font-light tabular-nums leading-none tracking-[-0.035em]",
            t.value,
          )}
        >
          {value}
        </p>

        {(href || hrefLabel) &&
          (href ? (
            <Link
              to={href}
              className="mt-1.5 inline-block text-[10px] font-medium uppercase tracking-[0.1em] text-primary hover:underline"
            >
              {hrefLabel ?? "Ver detalhes"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              className="mt-1.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-primary hover:underline"
            >
              {hrefLabel ?? "Ver detalhes"}
            </button>
          ))}
      </div>
    </Card>
  );
}
