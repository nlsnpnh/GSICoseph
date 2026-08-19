import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcIdade, faixaEtaria, tempoServicoAnos } from "./servidores";

// Instante absoluto que corresponde a 19/08/2026 em Rondonia. As funcoes usam
// o fuso de RO, entao o teste independe do fuso da maquina.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T15:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("calcIdade", () => {
  it("conta o aniversario do proprio dia", () => {
    expect(calcIdade("1990-08-19")).toBe(36);
  });

  it("nao conta o ano quando o aniversario ainda nao chegou", () => {
    expect(calcIdade("1990-08-20")).toBe(35);
    expect(calcIdade("1990-12-01")).toBe(35);
  });

  it("conta o ano quando o aniversario ja passou", () => {
    expect(calcIdade("1990-01-05")).toBe(36);
  });

  it("devolve null para data vazia ou invalida", () => {
    expect(calcIdade("")).toBeNull();
    expect(calcIdade("data-invalida")).toBeNull();
    expect(calcIdade("19/08/1990")).toBeNull();
  });

  it("usa o dia de Rondonia, nao o de UTC", () => {
    // 20/08 02:00 UTC ainda e 19/08 em RO: quem faz aniversario dia 20 nao
    // pode ter a idade contada ainda.
    vi.setSystemTime(new Date("2026-08-20T02:00:00Z"));
    expect(calcIdade("1990-08-20")).toBe(35);
    vi.setSystemTime(new Date("2026-08-20T04:00:00Z")); // ja e 20/08 em RO
    expect(calcIdade("1990-08-20")).toBe(36);
  });
});

describe("faixaEtaria", () => {
  it("classifica cada faixa pelos limites", () => {
    expect(faixaEtaria(29)).toBe("Até 29");
    expect(faixaEtaria(30)).toBe("30-39");
    expect(faixaEtaria(39)).toBe("30-39");
    expect(faixaEtaria(40)).toBe("40-49");
    expect(faixaEtaria(49)).toBe("40-49");
    expect(faixaEtaria(50)).toBe("50-59");
    expect(faixaEtaria(59)).toBe("50-59");
    expect(faixaEtaria(60)).toBe("60+");
    expect(faixaEtaria(72)).toBe("60+");
  });

  it("rotula idade desconhecida", () => {
    expect(faixaEtaria(null)).toBe("Não informada");
  });
});

describe("tempoServicoAnos", () => {
  it("marca o aniversario exato sem perder a casa decimal", () => {
    // 10 anos redondos tem de dar 10, nao 9.9.
    expect(tempoServicoAnos("2016-08-19")).toBe(10);
  });

  it("volta a fracao no dia seguinte ao aniversario", () => {
    expect(tempoServicoAnos("2016-08-18")).toBe(10);
    expect(tempoServicoAnos("2016-08-20")).toBe(9.9);
  });

  it("trata ingresso futuro como zero", () => {
    expect(tempoServicoAnos("2027-01-01")).toBe(0);
  });

  it("trunca a fracao em vez de arredondar", () => {
    // 19/02 a 19/08 = 181 dias = 0,4956 ano -> trunca para 0.4 (nao arredonda p/ 0.5).
    expect(tempoServicoAnos("2026-02-19")).toBe(0.4);
  });

  it("devolve null para data vazia ou invalida", () => {
    expect(tempoServicoAnos("")).toBeNull();
    expect(tempoServicoAnos("31/12/2020")).toBeNull();
    expect(tempoServicoAnos("2020-13-01")).toBeNull();
  });
});
