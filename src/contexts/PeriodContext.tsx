import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Period = "todos" | "ano" | "mes";

type Ctx = {
  period: Period;
  setPeriod: (p: Period) => void;
  /** Fator multiplicador aplicado aos contadores agregados (mantido p/ retrocompat). */
  factor: number;
  label: string;
  /** Mês/ano reais derivados do período (referência: hoje). */
  mes: number;   // 1..12
  ano: number;
  /** Override manual de mês/ano (usado por cards específicos). */
  setMesAno: (mes: number | null, ano: number | null) => void;
  /** True quando há override manual ativo. */
  hasOverride: boolean;
};

const PeriodContext = createContext<Ctx | null>(null);

const FACTORS: Record<Period, number> = {
  todos: 1,
  ano: 0.72,
  mes: 0.18,
};

const LABELS: Record<Period, string> = {
  todos: "Todos os dados",
  ano: "Último ano",
  mes: "Último mês",
};

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>("todos");
  const [mesOverride, setMesOverride] = useState<number | null>(null);
  const [anoOverride, setAnoOverride] = useState<number | null>(null);

  const value = useMemo<Ctx>(() => {
    const hoje = new Date();
    const mes = mesOverride ?? hoje.getMonth() + 1;
    const ano = anoOverride ?? hoje.getFullYear();
    return {
      period,
      setPeriod,
      factor: FACTORS[period],
      label: LABELS[period],
      mes,
      ano,
      setMesAno: (m, a) => { setMesOverride(m); setAnoOverride(a); },
      hasOverride: mesOverride !== null || anoOverride !== null,
    };
  }, [period, mesOverride, anoOverride]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}

/** Aplica o filtro de período a um número agregado, arredondando para inteiro. */
export function applyPeriod(value: number, factor: number) {
  return Math.max(0, Math.round(value * factor));
}
