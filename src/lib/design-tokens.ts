// =====================================================================
// Tokens de apresentação — Tier 0 (admin premium) sobre a identidade TJRO.
//
// A identidade institucional manda na cor: azul do brasão como primária,
// dourado como acento. Do Tier 0 vem a disciplina — densidade alta, peso
// tipográfico leve (300-400, nunca bold), tracking negativo nos títulos,
// numerais tabulares e um único acento por tela.
// =====================================================================

export const EASE = {
  cinematic: [0.16, 1, 0.3, 1] as const,
  gentle: [0.25, 0.1, 0.25, 1] as const,
};

export const TYPO = {
  /** Número protagonista de um card de indicador. */
  heroStat: "text-[32px] md:text-[40px] font-extralight tracking-[-0.04em] leading-[0.95] tabular-nums",
  /** Título de página. */
  pageTitle: "text-[22px] sm:text-[26px] font-light tracking-[-0.025em] leading-[1.1]",
  /** Título de card / seção. */
  cardTitle: "text-[13px] font-medium tracking-[-0.01em]",
  /** Rótulo em caixa alta com tracking largo — abre seções e colunas. */
  eyebrow: "text-[10px] font-medium uppercase tracking-[0.18em]",
  /** Corpo padrão das tabelas. */
  cell: "text-[13px] leading-[1.35]",
  /** Texto secundário dentro da célula. */
  cellMuted: "text-[11px] leading-[1.3] text-muted-foreground",
  /** Números em coluna — sempre tabulares para alinhar. */
  num: "text-[13px] tabular-nums tracking-tight",
};

/** Altura de linha das tabelas densas: 36px úteis. */
export const DENSITY = {
  row: "h-9",
  cellPad: "px-3 py-1.5",
  headPad: "px-3",
};

// Paleta dos gráficos: azul institucional + dourado + os status já definidos
// no index.css. Máximo 3 cores por gráfico.
export const CHART = {
  primary: "hsl(217 91% 55%)",
  primarySoft: "hsl(215 45% 55%)",
  accent: "hsl(42 75% 50%)",
  adequate: "hsl(142 65% 45%)",
  partial: "hsl(42 95% 55%)",
  critical: "hsl(0 75% 55%)",
  // Eixo e grade seguem o tema: com cor fixa clara, a grade tracejada virava
  // um pontilhado quase branco no modo escuro.
  axis: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  tooltip: {
    contentStyle: {
      background: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "8px",
      color: "hsl(var(--popover-foreground))",
      fontSize: "12px",
      padding: "8px 12px",
      boxShadow: "0 8px 24px rgba(15, 40, 70, 0.12)",
    },
    itemStyle: { color: "hsl(var(--foreground))" },
    labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: "4px" },
  },
  axisStyle: {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 11,
    tickLine: false as const,
    axisLine: false as const,
  },
};
