import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILTROS_VAZIOS, aplicarFiltros, intervaloDoPeriodo } from "./filtros";
import type { Chamado } from "@/data/chamados";

// 19/08/2026 15:00Z = 19/08/2026 11:00 em Rondonia.
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
  assunto: "Porta da subestação não trava", descricao: "kit de reconhecimento facial",
  status: "Aberto", prioridade: "Média",
  aberto_em: AGORA, ultima_movimentacao: AGORA,
  prazo: "", resolvido_em: "", fechado_em: "", solucao: "",
  tags: [], cc: [],
  ...over,
});

const nomeUnidade = (id: string) => (id === "u1" ? "Edifício Sede do PJRO" : "Fórum de Jaru");
const rotuloContrato = (id: string) => (id === "k1" ? "115/2023 — V2 INTEGRADORA" : "23/2024 — AFS SERVIÇOS");

describe("intervaloDoPeriodo", () => {
  it("hoje e um unico dia", () => {
    expect(intervaloDoPeriodo("hoje", "", "")).toEqual({ de: "2026-08-19", ate: "2026-08-19" });
  });

  it("ultimos 7 dias inclui hoje", () => {
    expect(intervaloDoPeriodo("7dias", "", "")).toEqual({ de: "2026-08-13", ate: "2026-08-19" });
  });

  it("mes atual comeca no dia 1", () => {
    expect(intervaloDoPeriodo("mes", "", "")).toEqual({ de: "2026-08-01", ate: "2026-08-19" });
  });

  it("mes anterior termina no ultimo dia dele", () => {
    expect(intervaloDoPeriodo("mesAnterior", "", "")).toEqual({ de: "2026-07-01", ate: "2026-07-31" });
  });

  it("ano atual comeca em janeiro", () => {
    expect(intervaloDoPeriodo("ano", "", "")).toEqual({ de: "2026-01-01", ate: "2026-08-19" });
  });

  it("personalizado usa as datas informadas", () => {
    expect(intervaloDoPeriodo("custom", "2026-03-01", "2026-03-31"))
      .toEqual({ de: "2026-03-01", ate: "2026-03-31" });
  });

  it("todo o periodo nao limita nada", () => {
    expect(intervaloDoPeriodo("todos", "", "")).toEqual({ de: "", ate: "" });
  });
});

describe("aplicarFiltros", () => {
  const lista = [
    chamado({ id: "a", unidade_id: "u1", categoria: "Câmera", status: "Novo" }),
    chamado({ id: "b", unidade_id: "u2", categoria: "Catraca", status: "Fechado", contrato_id: "k2" }),
    chamado({ id: "c", unidade_id: "u1", categoria: "Câmera", status: "Em atendimento", prioridade: "Alta" }),
  ];

  const filtrar = (over: Partial<typeof FILTROS_VAZIOS>) =>
    aplicarFiltros(lista, { ...FILTROS_VAZIOS, ...over }, nomeUnidade, rotuloContrato).map((c) => c.id);

  it("sem filtro devolve tudo", () => {
    expect(filtrar({})).toEqual(["a", "b", "c"]);
  });

  it("combina unidade e categoria", () => {
    expect(filtrar({ unidade: "u1", categoria: "Câmera" })).toEqual(["a", "c"]);
  });

  it("filtra por contrato, status e prioridade", () => {
    expect(filtrar({ contrato: "k2" })).toEqual(["b"]);
    expect(filtrar({ status: "Novo" })).toEqual(["a"]);
    expect(filtrar({ prioridade: "Alta" })).toEqual(["c"]);
  });

  it("busca alcanca o nome da unidade e o rotulo do contrato", () => {
    expect(filtrar({ busca: "edifício sede" })).toEqual(["a", "c"]);
    expect(filtrar({ busca: "AFS" })).toEqual(["b"]);
  });

  it("destaque de vencidos so pega pendente com prazo estourado", () => {
    const comPrazos = [
      chamado({ id: "x", prazo: "2026-08-01", status: "Aberto" }),
      chamado({ id: "y", prazo: "2026-08-01", status: "Fechado" }),
      chamado({ id: "z", prazo: "2026-09-01", status: "Aberto" }),
    ];
    const ids = aplicarFiltros(
      comPrazos, { ...FILTROS_VAZIOS, destaque: "vencidos" }, nomeUnidade, rotuloContrato,
    ).map((c) => c.id);
    expect(ids).toEqual(["x"]);
  });

  it("destaque de parados exige mais de 7 dias sem movimentacao", () => {
    const parados = [
      chamado({ id: "velho", ultima_movimentacao: "2026-08-01T12:00:00Z" }),
      chamado({ id: "recente", ultima_movimentacao: "2026-08-18T12:00:00Z" }),
    ];
    const ids = aplicarFiltros(
      parados, { ...FILTROS_VAZIOS, destaque: "parados" }, nomeUnidade, rotuloContrato,
    ).map((c) => c.id);
    expect(ids).toEqual(["velho"]);
  });

  it("periodo recorta pela data de abertura em Rondonia", () => {
    const meses = [
      chamado({ id: "jul", aberto_em: "2026-07-15T12:00:00Z" }),
      chamado({ id: "ago", aberto_em: "2026-08-05T12:00:00Z" }),
    ];
    const ids = aplicarFiltros(
      meses, { ...FILTROS_VAZIOS, periodo: "mes" }, nomeUnidade, rotuloContrato,
    ).map((c) => c.id);
    expect(ids).toEqual(["ago"]);
  });
});
