import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TRANSICOES, calcPrazo, calcVencimento, contratosDaUnidade, diasSemMovimentacao,
  empresaCurta, isPendente, podeTransicionar, tempoAtendimentoDias,
  type Chamado, type StatusChamado,
} from "./chamados";
import type { Contrato } from "./contratos";

// O relogio congela num instante ABSOLUTO em UTC: 19/08/2026 15:00Z e
// 19/08/2026 11:00 em Rondonia (UTC-4), entao o teste vale em qualquer maquina.
const AGORA = "2026-08-19T15:00:00Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(AGORA));
});
afterEach(() => vi.useRealTimers());

const chamado = (over: Partial<Chamado> = {}): Chamado => ({
  id: "c1", numero: "30823", unidade_id: "u1", contrato_id: "k1",
  solicitante_id: "s1", solicitante_nome: "João Silva", responsavel_nome: "",
  servico: "Manutenção corretiva", categoria: "Controle de Acesso",
  assunto: "Porta da subestação não trava", descricao: "...",
  status: "Aberto", prioridade: "Média",
  aberto_em: AGORA, ultima_movimentacao: AGORA,
  prazo: "", resolvido_em: "", fechado_em: "", solucao: "",
  tags: [], cc: [],
  ...over,
});

describe("calcPrazo", () => {
  it("soma o SLA do contrato ao dia da abertura", () => {
    expect(calcPrazo(AGORA, 5)).toBe("2026-08-24");
  });

  it("usa o dia de Rondonia, nao o de UTC", () => {
    // 02:00Z de 20/08 ainda e 22:00 do dia 19 em Rondonia: o prazo conta do 19.
    expect(calcPrazo("2026-08-20T02:00:00Z", 1)).toBe("2026-08-20");
  });

  it("sem SLA no contrato, o chamado nao tem prazo", () => {
    expect(calcPrazo(AGORA, null)).toBe("");
    expect(calcPrazo(AGORA, 0)).toBe("");
  });
});

describe("calcVencimento", () => {
  it("sem prazo definido nao cobra nada", () => {
    expect(calcVencimento(chamado({ prazo: "" })).tone).toBe("muted");
  });

  it("pendente com folga esta no prazo", () => {
    expect(calcVencimento(chamado({ prazo: "2026-08-25" })).rotulo).toBe("No prazo");
  });

  it("vence hoje ou amanha entra em risco", () => {
    expect(calcVencimento(chamado({ prazo: "2026-08-19" })).rotulo).toBe("Em risco");
    expect(calcVencimento(chamado({ prazo: "2026-08-20" })).rotulo).toBe("Em risco");
  });

  it("prazo passado marca vencido", () => {
    const v = calcVencimento(chamado({ prazo: "2026-08-17" }));
    expect(v.rotulo).toBe("Vencido");
    expect(v.vencido).toBe(true);
    expect(v.diasRestantes).toBe(-2);
  });

  it("resolvido compara a resolucao com o prazo, nao com hoje", () => {
    const noPrazo = chamado({
      prazo: "2026-08-17", status: "Resolvido", resolvido_em: "2026-08-16T12:00:00Z",
    });
    expect(calcVencimento(noPrazo).rotulo).toBe("No prazo");

    const fora = chamado({
      prazo: "2026-08-17", status: "Resolvido", resolvido_em: "2026-08-18T12:00:00Z",
    });
    expect(calcVencimento(fora).rotulo).toBe("Fora do prazo");
  });

  it("cancelado nao tem prazo a cobrar", () => {
    expect(calcVencimento(chamado({ prazo: "2026-01-01", status: "Cancelado" })).tone).toBe("muted");
  });
});

describe("fluxo de status", () => {
  it("pendente e tudo que nao esta fechado nem cancelado", () => {
    expect(isPendente("Novo")).toBe(true);
    expect(isPendente("Resolvido")).toBe(true);
    expect(isPendente("Fechado")).toBe(false);
    expect(isPendente("Cancelado")).toBe(false);
  });

  it("nao permite pular de Novo direto para Fechado", () => {
    expect(podeTransicionar("Novo", "Fechado")).toBe(false);
    expect(podeTransicionar("Novo", "Aberto")).toBe(true);
  });

  it("so fecha o que ja foi resolvido", () => {
    expect(podeTransicionar("Resolvido", "Fechado")).toBe(true);
    expect(podeTransicionar("Em atendimento", "Fechado")).toBe(false);
  });

  it("encerrado sempre pode ser reaberto", () => {
    expect(podeTransicionar("Fechado", "Aberto")).toBe(true);
    expect(podeTransicionar("Cancelado", "Aberto")).toBe(true);
  });

  it("todo destino declarado e um status valido", () => {
    const validos = new Set(Object.keys(TRANSICOES) as StatusChamado[]);
    for (const destinos of Object.values(TRANSICOES)) {
      for (const d of destinos) expect(validos.has(d)).toBe(true);
    }
  });
});

describe("tempoAtendimentoDias", () => {
  it("conta os dias entre abertura e resolucao", () => {
    expect(tempoAtendimentoDias({
      aberto_em: "2026-08-10T12:00:00Z", resolvido_em: "2026-08-14T12:00:00Z",
    })).toBe(4);
  });

  it("ainda aberto nao tem tempo de atendimento", () => {
    expect(tempoAtendimentoDias({ aberto_em: AGORA, resolvido_em: "" })).toBeNull();
  });
});

describe("diasSemMovimentacao", () => {
  it("conta a partir da ultima movimentacao", () => {
    expect(diasSemMovimentacao({ ultima_movimentacao: "2026-08-12T12:00:00Z" })).toBe(7);
  });

  it("movimentado hoje conta zero", () => {
    expect(diasSemMovimentacao({ ultima_movimentacao: AGORA })).toBe(0);
  });
});

describe("contratosDaUnidade", () => {
  const contrato = (id: string, unidades: string[]): Contrato => ({
    id, numero: id, empresa: "EMPRESA X LTDA", objeto: "", data_inicio: "", data_fim: "",
    valor_mensal: 0, valor_total: 0, unidade_ids: unidades, fiscal: "", gestor: "",
    sla: "", sla_dias: null, aditivos: [], apostilamentos: [], observacoes: "",
  });

  const contratos = [contrato("k1", ["u1", "u2"]), contrato("k2", ["u2"])];

  it("traz so os contratos que atendem a unidade", () => {
    expect(contratosDaUnidade(contratos, "u1").map((c) => c.id)).toEqual(["k1"]);
    expect(contratosDaUnidade(contratos, "u2").map((c) => c.id)).toEqual(["k1", "k2"]);
  });

  it("sem unidade escolhida nao oferece contrato nenhum", () => {
    expect(contratosDaUnidade(contratos, "")).toEqual([]);
  });
});

describe("empresaCurta", () => {
  it("reduz a razao social aos dois primeiros nomes", () => {
    expect(empresaCurta("V2 INTEGRADORA DE SOLUÇÕES E IMPORTAÇÃO EIRELI")).toBe("V2 INTEGRADORA");
    expect(empresaCurta("AFS SERVIÇOS DE LOCAÇÃO E GESTÃO DE MÃO DE OBRA LTDA")).toBe("AFS SERVIÇOS");
  });

  it("nome curto passa inteiro", () => {
    expect(empresaCurta("TECHSCAN")).toBe("TECHSCAN");
  });
});
