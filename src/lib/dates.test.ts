import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addAnosISO,
  addDiasISO,
  anosCompletosISO,
  diffDiasISO,
  hojeISO,
  isISODate,
  toISODate,
} from "./dates";

afterEach(() => vi.useRealTimers());

// Instantes absolutos (UTC) de proposito: o resultado tem de ser o dia em
// Rondonia, nao o dia da maquina que roda o teste.
const congelar = (instanteUTC: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(instanteUTC));
};

describe("toISODate / hojeISO", () => {
  it("le a data no fuso de Rondonia, nao em UTC", () => {
    // 20/08 as 02:00 UTC ainda e dia 19/08 em Rondonia (UTC-4).
    congelar("2026-08-20T02:00:00Z");
    expect(hojeISO()).toBe("2026-08-19");
  });

  it("vira o dia junto com Rondonia, nao com UTC", () => {
    // 20/08 as 04:00 UTC = 20/08 00:00 em Rondonia.
    congelar("2026-08-20T04:00:00Z");
    expect(hojeISO()).toBe("2026-08-20");
  });

  it("formata um instante qualquer como YYYY-MM-DD", () => {
    expect(toISODate(new Date("2026-01-05T18:30:00Z"))).toBe("2026-01-05");
  });
});

describe("addDiasISO", () => {
  it("soma dias dentro do mes", () => {
    expect(addDiasISO("2026-08-10", 3)).toBe("2026-08-13");
  });

  it("atravessa a virada de mes e de ano", () => {
    expect(addDiasISO("2026-08-30", 5)).toBe("2026-09-04");
    expect(addDiasISO("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("respeita ano bissexto", () => {
    expect(addDiasISO("2024-02-27", 2)).toBe("2024-02-29");
    expect(addDiasISO("2026-02-27", 2)).toBe("2026-03-01");
  });

  it("aceita dias negativos", () => {
    expect(addDiasISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("nao desloca a data em nenhum fuso (soma zero e identidade)", () => {
    expect(addDiasISO("2026-08-19", 0)).toBe("2026-08-19");
  });
});

describe("diffDiasISO", () => {
  it("conta dias inteiros entre duas datas", () => {
    expect(diffDiasISO("2026-08-19", "2026-08-22")).toBe(3);
    expect(diffDiasISO("2026-08-19", "2026-08-19")).toBe(0);
  });

  it("devolve negativo quando a data alvo ja passou", () => {
    expect(diffDiasISO("2026-08-19", "2026-08-18")).toBe(-1);
  });

  it("atravessa meses e anos", () => {
    expect(diffDiasISO("2026-08-19", "2026-11-17")).toBe(90);
    expect(diffDiasISO("2026-12-31", "2027-01-01")).toBe(1);
  });
});

describe("isISODate", () => {
  it("aceita datas YYYY-MM-DD validas", () => {
    expect(isISODate("2026-08-19")).toBe(true);
    expect(isISODate("2024-02-29")).toBe(true);
  });

  it("rejeita formato errado ou data impossivel", () => {
    expect(isISODate("")).toBe(false);
    expect(isISODate("19/08/2026")).toBe(false);
    expect(isISODate("2026-8-19")).toBe(false);
    expect(isISODate("2026-13-01")).toBe(false);
  });
});

describe("anosCompletosISO", () => {
  it("conta o ano no dia do aniversario", () => {
    expect(anosCompletosISO("1990-08-19", "2026-08-19")).toBe(36);
  });

  it("nao conta o ano na vespera do aniversario", () => {
    expect(anosCompletosISO("1990-08-20", "2026-08-19")).toBe(35);
    expect(anosCompletosISO("1990-12-01", "2026-08-19")).toBe(35);
  });

  it("conta o ano quando o aniversario ja passou no ano corrente", () => {
    expect(anosCompletosISO("1990-01-05", "2026-08-19")).toBe(36);
  });

  it("devolve zero no proprio dia", () => {
    expect(anosCompletosISO("2026-08-19", "2026-08-19")).toBe(0);
  });
});

describe("addAnosISO", () => {
  it("soma anos mantendo mes e dia", () => {
    expect(addAnosISO("2016-08-19", 10)).toBe("2026-08-19");
    expect(addAnosISO("2026-08-19", 1)).toBe("2027-08-19");
  });

  it("recua 29/02 para 28/02 quando o ano alvo nao e bissexto", () => {
    expect(addAnosISO("2024-02-29", 1)).toBe("2025-02-28");
    expect(addAnosISO("2024-02-29", 4)).toBe("2028-02-29"); // alvo bissexto
  });

  it("aceita anos negativos", () => {
    expect(addAnosISO("2026-08-19", -36)).toBe("1990-08-19");
  });
});
