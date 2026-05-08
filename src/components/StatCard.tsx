import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  hrefLabel?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "accent" | "primary" | "info";
  onClick?: () => void;
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, { bg: string; icon: string; value: string }> = {
  default:     { bg: "bg-primary/10",     icon: "text-primary",     value: "text-foreground" },
  primary:     { bg: "bg-primary/10",     icon: "text-primary",     value: "text-primary" },
  success:     { bg: "bg-adequate/10",    icon: "text-adequate",    value: "text-adequate" },
  warning:     { bg: "bg-partial/15",     icon: "text-partial",     value: "text-partial" },
  destructive: { bg: "bg-critical/10",    icon: "text-critical",    value: "text-critical" },
  accent:      { bg: "bg-accent/10",      icon: "text-accent",      value: "text-accent" },
  info:        { bg: "bg-blue-500/10",    icon: "text-blue-600",    value: "text-blue-600" },
};

export function StatCard({ label, value, icon: Icon, href, hrefLabel, tone = "default", onClick }: StatCardProps) {
  const t = toneClasses[tone];
  const actionClassName = "mt-3 border-t border-border pt-2 text-left text-[11px] font-medium text-primary hover:underline";

  return (
    <Card className="flex items-stretch gap-3 border-border p-3 shadow-sm hover:shadow-lg hover:ring-1 hover:ring-primary/60 cursor-pointer">
      <div className={cn("flex w-12 shrink-0 items-center justify-center rounded-md", t.bg)}>
        <Icon className={cn("h-6 w-6", t.icon)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
        <p className="text-[11px] font-medium leading-tight text-muted-foreground line-clamp-2">
          {label}
        </p>
        <p className={cn("mt-1 text-2xl font-bold leading-none tracking-tight", t.value)}>
          {value}
        </p>
        {(href || hrefLabel) &&
          (href ? (
            <Link to={href} className="mt-1.5 text-[11px] font-medium text-primary hover:underline">
              {hrefLabel ?? "Ver detalhes"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              className="mt-1.5 text-[11px] font-medium text-primary hover:underline"
            >
              {hrefLabel ?? "Ver detalhes"}
            </button>
          ))}
      </div>
    </Card>
  );
}
