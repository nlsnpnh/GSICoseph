import { describe, expect, it } from "vitest";
import {
  acaoLabel,
  fmtBRL,
  fmtBRL0,
  fmtPct,
  resumoPorAcao,
  totalGeral,
  type OrcamentoAcao,
} from "./orcamento";

// toLocaleString usa espaco nao separavel (U+00A0) depois do "R$".
const norm = (s: string) => s.replace(/\u00A0/g, " ");

const item = (over: Partial<OrcamentoAcao>): OrcamentoAcao =>
  ({
    id: "x", ano: 2026, acao: "4078", ordem: 1,
    ed: null, sl: null, fonte: null, objeto: null,
    dotacao: 0, empenho: 0, reforco_empenho: 0, anulacao_empenho: 0,
    saldo_dotacao: 0, liquidado: 0, saldo_empenho: 0,
    protocolo: null, nota_empenho: null, observacao: null,
    created_at: "", updated_at: "",
    ...over,
  }) as OrcamentoAcao;

describe("acaoLabel", () => {
  it("traduz o codigo da acao para o rotulo da aba", () => {
    expect(acaoLabel("4078")).toBe("4078 - COSEPH");
    expect(acaoLabel("4079")).toBe("4079 - ASMIL");
    expect(acaoLabel("4080")).toBe("4080 - ABM");
  });
});

describe("resumoPorAcao", () => {
  it("soma os itens dentro de cada acao e mantem as tres acoes", () => {
    const resumo = resumoPorAcao([
      item({ acao: "4078", dotacao: 1000, empenho: 400, liquidado: 250, saldo_dotacao: 600 }),
      item({ acao: "4078", dotacao: 1000, empenho: 600, liquidado: 250, saldo_dotacao: 400 }),
      item({ acao: "4080", dotacao: 500, empenho: 100, liquidado: 50, saldo_dotacao: 400 }),
    ]);

    expect(resumo).toHaveLength(3);
    const coseph = resumo.find((r) => r.acao === "4078")!;
    expect(coseph.dotacao).toBe(2000);
    expect(coseph.empenho).toBe(1000);
    expect(coseph.liquidado).toBe(500);
    expect(coseph.pctEmpenho).toBe(0.5);
    expect(coseph.pctLiquidacao).toBe(0.25);
  });

  it("zera os percentuais quando nao ha dotacao, sem dividir por zero", () => {
    const resumo = resumoPorAcao([item({ acao: "4079", dotacao: 0, empenho: 800 })]);
    const asmil = resumo.find((r) => r.acao === "4079")!;
    expect(asmil.pctEmpenho).toBe(0);
    expect(asmil.pctLiquidacao).toBe(0);
    expect(Number.isFinite(asmil.pctEmpenho)).toBe(true);
  });

  it("devolve as tres acoes zeradas quando nao ha itens", () => {
    const resumo = resumoPorAcao([]);
    expect(resumo).toHaveLength(3);
    expect(resumo.every((r) => r.dotacao === 0 && r.pctEmpenho === 0)).toBe(true);
  });
});

describe("totalGeral", () => {
  it("consolida as acoes e recalcula os percentuais sobre o total", () => {
    const total = totalGeral(
      resumoPorAcao([
        item({ acao: "4078", dotacao: 1000, empenho: 500, liquidado: 200, saldo_dotacao: 500 }),
        item({ acao: "4080", dotacao: 1000, empenho: 300, liquidado: 100, saldo_dotacao: 700 }),
      ]),
    );

    expect(total.dotacao).toBe(2000);
    expect(total.empenho).toBe(800);
    expect(total.saldo).toBe(1200);
    expect(total.pctEmpenho).toBe(0.4);
    expect(total.pctSaldo).toBe(0.6);
  });

  it("nao quebra com resumo vazio", () => {
    const total = totalGeral([]);
    expect(total.dotacao).toBe(0);
    expect(total.pctEmpenho).toBe(0);
  });
});

describe("formatadores", () => {
  it("fmtBRL mostra centavos", () => {
    expect(norm(fmtBRL(1234.5))).toBe("R$ 1.234,50");
    expect(norm(fmtBRL(0))).toBe("R$ 0,00");
  });

  it("fmtBRL0 omite centavos", () => {
    expect(norm(fmtBRL0(1234.56))).toBe("R$ 1.235");
  });

  it("fmtPct usa virgula decimal e uma casa", () => {
    expect(fmtPct(0.4)).toBe("40,0%");
    expect(fmtPct(0.1234)).toBe("12,3%");
    expect(fmtPct(0)).toBe("0,0%");
  });
});
