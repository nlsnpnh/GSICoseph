import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { statusFromVigencia } from "./contratosMock";

// Relogio congelado num instante absoluto correspondente a 19/08/2026 em
// Rondonia — a funcao compara dia contra dia no fuso de RO.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T15:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("statusFromVigencia", () => {
  it("trata contrato sem data de fim como vigente", () => {
    expect(statusFromVigencia("")).toBe("Vigente");
  });

  it("marca como vencido quando a vigencia ja passou", () => {
    expect(statusFromVigencia("2026-08-18")).toBe("Vencido");
    expect(statusFromVigencia("2025-01-31")).toBe("Vencido");
  });

  it("marca como a vencer dentro da janela de 90 dias", () => {
    expect(statusFromVigencia("2026-09-30")).toBe("A vencer");
    expect(statusFromVigencia("2026-11-17")).toBe("A vencer"); // 90o dia, ultimo da janela
  });

  it("marca como vigente a partir do 91o dia", () => {
    expect(statusFromVigencia("2026-11-18")).toBe("Vigente");
    expect(statusFromVigencia("2027-06-30")).toBe("Vigente");
  });

  it("mantem vigente o contrato que termina hoje", () => {
    // O contrato vale ate o fim da data de vigencia: no ultimo dia ele aparece
    // como "A vencer", nunca como vencido.
    expect(statusFromVigencia("2026-08-19")).toBe("A vencer");
  });

  it("so vira vencido no dia seguinte ao fim da vigencia", () => {
    vi.setSystemTime(new Date("2026-08-20T15:00:00Z"));
    expect(statusFromVigencia("2026-08-19")).toBe("Vencido");
  });
});
