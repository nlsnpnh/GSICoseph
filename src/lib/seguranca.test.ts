import { describe, expect, it } from "vitest";
import {
  calcCobertura, coberturaDoCampo, possui, respondidos, semResposta,
  type IndicadoresUnidade,
} from "./seguranca";

const u = (
  derso: boolean | null,
  acesso: boolean | null,
  cftv: boolean | null,
): IndicadoresUnidade => ({
  possui_derso: derso,
  controle_acesso: acesso,
  vigilancia_eletronica: cftv,
});

describe("respondidos / possui", () => {
  it("conta separadamente o que foi respondido e o que se possui", () => {
    expect(respondidos(u(true, false, null))).toBe(2);
    expect(possui(u(true, false, null))).toBe(1);
  });

  it("nao informado nao conta como resposta nem como posse", () => {
    expect(respondidos(u(null, null, null))).toBe(0);
    expect(possui(u(null, null, null))).toBe(0);
  });

  it("responder 'nao' nos tres e diferente de nao responder", () => {
    expect(respondidos(u(false, false, false))).toBe(3);
    expect(respondidos(u(null, null, null))).toBe(0);
  });
});

describe("semResposta", () => {
  it("so e verdadeiro quando nenhum dos tres foi respondido", () => {
    expect(semResposta(u(null, null, null))).toBe(true);
    expect(semResposta(u(false, null, null))).toBe(false);
    expect(semResposta(u(false, false, false))).toBe(false);
  });
});

describe("calcCobertura", () => {
  it("calcula sobre o respondido, ignorando o nao informado", () => {
    // 2 unidades: uma com 3 respostas (2 sim), outra sem nenhuma resposta.
    // O percentual sai 2/3, nao 2/6 — quem nao respondeu fica fora da conta.
    const c = calcCobertura([u(true, true, false), u(null, null, null)]);
    expect(c.camposRespondidos).toBe(3);
    expect(c.camposPossui).toBe(2);
    expect(c.percentual).toBe(67);
  });

  it("sem nenhuma resposta o percentual e null, nao zero", () => {
    // Zero afirmaria ausencia de seguranca; o que existe e ausencia de dado.
    const c = calcCobertura([u(null, null, null), u(null, null, null)]);
    expect(c.percentual).toBeNull();
    expect(c.unidadesSemResposta).toBe(2);
  });

  it("tres 'nao' respondidos dao cobertura zero de verdade", () => {
    const c = calcCobertura([u(false, false, false)]);
    expect(c.percentual).toBe(0);
    expect(c.unidadesSemResposta).toBe(0);
  });

  it("lista vazia nao quebra", () => {
    expect(calcCobertura([]).percentual).toBeNull();
  });
});

describe("coberturaDoCampo", () => {
  const lista = [
    u(true, null, true),
    u(false, null, true),
    u(null, null, null),
  ];

  it("usa como denominador so quem respondeu aquele campo", () => {
    // DERSO: 2 responderam, 1 possui -> 50%. A terceira unidade nao entra.
    expect(coberturaDoCampo(lista, "possui_derso")).toBe(50);
  });

  it("devolve null quando ninguem respondeu o campo", () => {
    expect(coberturaDoCampo(lista, "controle_acesso")).toBeNull();
  });

  it("cem por cento quando todos que responderam possuem", () => {
    expect(coberturaDoCampo(lista, "vigilancia_eletronica")).toBe(100);
  });
});
