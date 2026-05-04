import { createContext, useContext, useState, ReactNode } from "react";

export type Period = "todos" | "ano" | "mes";

type Ctx = {
  period: Period;
  setPeriod: (p: Period) => void;
  /** Fator multiplicador aplicado aos contadores agregados */
  factor: number;
  label: string;
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
  return (
    <PeriodContext.Provider
      value={{ period, setPeriod, factor: FACTORS[period], label: LABELS[period] }}
    >
      {children}
    </PeriodContext.Provider>
  );
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
