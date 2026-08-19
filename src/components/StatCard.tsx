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
  /**
   * Protagonista da tela: card mais alto e número maior. Reserve para os dois
   * ou três indicadores que pedem providência — se tudo é destaque, nada é.
   */
  destaque?: boolean;
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
  label, value, icon: Icon, href, hrefLabel, tone = "default", onClick, destaque = false,
}: StatCardProps) {
  const t = toneClasses[tone];
  const clicavel = !!href || !!onClick;

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden border-border/80 shadow-sm transition-colors",
        destaque ? "min-h-[112px]" : "min-h-[84px]",
        clicavel && "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.025]",
      )}
    >
      <FioAcento />

      <div className={cn("flex flex-1 flex-col", destaque ? "px-4 py-3" : "px-3 py-2.5")}>
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "min-w-0 font-medium uppercase leading-tight text-muted-foreground",
              destaque ? "text-[10px] tracking-[0.16em]" : "text-[9px] tracking-[0.12em]",
            )}
          >
            {label}
          </p>
          <Icon
            className={cn("shrink-0", destaque ? "h-4 w-4" : "h-3.5 w-3.5", t.icon)}
            aria-hidden="true"
          />
        </div>

        <p
          className={cn(
            "mt-auto pt-2 font-extralight tabular-nums leading-none tracking-[-0.04em]",
            destaque ? "text-[38px] md:text-[44px]" : "text-[24px]",
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
