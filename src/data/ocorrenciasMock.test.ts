import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcSla, slaDiasDaCategoria, tempoAtendimentoDias } from "./ocorrenciasMock";

// Relogio congelado num instante absoluto que corresponde a 19/08/2026 em
// Rondonia. Como calcSla usa o fuso de RO, o teste independe do fuso da maquina.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T15:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("slaDiasDaCategoria", () => {
  it("devolve o prazo da categoria", () => {
    expect(slaDiasDaCategoria("Elétrica")).toBe(3);
    expect(slaDiasDaCategoria("Pintura")).toBe(10);
    expect(slaDiasDaCategoria("Elevadores")).toBe(2);
  });

  it("cai no prazo padrao quando a categoria nao existe no catalogo", () => {
    expect(slaDiasDaCategoria("Categoria que nao existe")).toBe(5);
    expect(slaDiasDaCategoria("")).toBe(5);
  });
});

describe("calcSla — chamados sem prazo a apurar", () => {
  it("ignora chamados cancelados", () => {
    expect(
      calcSla({ data_abertura: "2026-08-01", categoria: "Elétrica", status: "Cancelado", data_conclusao: null }),
    ).toEqual({ indicador: "—", tone: "muted", dataLimite: null, diasRestantes: null });
  });

  it("ignora chamados sem data de abertura", () => {
    expect(
      calcSla({ data_abertura: "", categoria: "Elétrica", status: "Aberto", data_conclusao: null }).indicador,
    ).toBe("—");
  });
});

describe("calcSla — chamados concluidos", () => {
  const base = { data_abertura: "2026-08-10", categoria: "Elétrica", status: "Concluído" } as const;

  it("calcula a data limite somando o SLA da categoria a abertura", () => {
    expect(calcSla({ ...base, data_conclusao: "2026-08-12" }).dataLimite).toBe("2026-08-13");
  });

  it("considera no prazo quando concluiu antes do limite", () => {
    const sla = calcSla({ ...base, data_conclusao: "2026-08-12" });
    expect(sla.indicador).toBe("No prazo");
    expect(sla.tone).toBe("adequate");
  });

  it("considera no prazo quando concluiu no proprio dia do limite", () => {
    expect(calcSla({ ...base, data_conclusao: "2026-08-13" }).indicador).toBe("No prazo");
  });

  it("considera fora do prazo a partir do dia seguinte ao limite", () => {
    const sla = calcSla({ ...base, data_conclusao: "2026-08-14" });
    expect(sla.indicador).toBe("Fora do prazo");
    expect(sla.tone).toBe("critical");
  });

  it("assume no prazo quando falta a data de conclusao", () => {
    expect(calcSla({ ...base, data_conclusao: null }).indicador).toBe("No prazo");
  });
});

describe("calcSla — chamados em aberto", () => {
  const aberto = (data_abertura: string) =>
    calcSla({ data_abertura, categoria: "Elétrica", status: "Aberto", data_conclusao: null });

  it("marca como atrasado e devolve dias negativos quando o limite ja passou", () => {
    const sla = aberto("2026-08-01"); // limite 04/08, hoje 19/08
    expect(sla.indicador).toBe("Atrasado");
    expect(sla.tone).toBe("critical");
    expect(sla.diasRestantes).toBe(-15);
  });

  it("marca como em risco no dia do limite", () => {
    const sla = aberto("2026-08-16"); // limite 19/08 = hoje
    expect(sla.indicador).toBe("Em risco");
    expect(sla.diasRestantes).toBe(0);
  });

  it("marca como em risco na vespera do limite", () => {
    const sla = aberto("2026-08-17"); // limite 20/08
    expect(sla.indicador).toBe("Em risco");
    expect(sla.tone).toBe("partial");
    expect(sla.diasRestantes).toBe(1);
  });

  it("marca como no prazo com dois dias ou mais de folga", () => {
    const sla = aberto("2026-08-18"); // limite 21/08
    expect(sla.indicador).toBe("No prazo");
    expect(sla.diasRestantes).toBe(2);
  });
});

describe("tempoAtendimentoDias", () => {
  it("conta os dias entre abertura e conclusao", () => {
    expect(
      tempoAtendimentoDias({ data_abertura: "2026-08-10", data_conclusao: "2026-08-15", status: "Concluído" }),
    ).toBe(5);
  });

  it("devolve null enquanto o chamado nao esta concluido", () => {
    expect(
      tempoAtendimentoDias({ data_abertura: "2026-08-10", data_conclusao: "2026-08-15", status: "Aberto" }),
    ).toBeNull();
  });

  it("devolve null quando falta alguma das datas", () => {
    expect(
      tempoAtendimentoDias({ data_abertura: "2026-08-10", data_conclusao: null, status: "Concluído" }),
    ).toBeNull();
  });

  it("nao devolve tempo negativo se a conclusao for anterior a abertura", () => {
    expect(
      tempoAtendimentoDias({ data_abertura: "2026-08-15", data_conclusao: "2026-08-10", status: "Concluído" }),
    ).toBe(0);
  });
});
