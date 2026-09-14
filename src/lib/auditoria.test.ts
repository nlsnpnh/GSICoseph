import { describe, expect, it } from "vitest";
import {
  autor, formatarValor, inicioDoDiaRondonia, linhaExportacao, mudancas,
  resumo, rotuloCampo, rotuloTabela, termoDeBusca, type EntradaAuditoria,
} from "./auditoria";

const base: EntradaAuditoria = {
  id: 1,
  ocorrido_em: "2026-08-19T15:00:00+00:00",
  tabela: "contratos",
  operacao: "UPDATE",
  registro_id: "c1",
  registro_rotulo: "115/2023 — V2 INTEGRADORA",
  usuario_id: "0d1f2e3c-4b5a-6978-8a9b-0c1d2e3f4a5b",
  usuario_nome: "Maria Souza",
  usuario_papel: "admin",
  origem: "app",
  antes: { id: "c1", valor_mensal: 50000, fiscal: "João", updated_at: "2026-08-01T10:00:00Z" },
  depois: { id: "c1", valor_mensal: 80000, fiscal: "João", updated_at: "2026-08-19T15:00:00Z" },
  campos_alterados: ["valor_mensal"],
};

describe("rotuloCampo", () => {
  it("usa o rótulo cadastrado quando existe", () => {
    expect(rotuloCampo("possui_derso")).toBe("Possui DERSO");
    expect(rotuloCampo("sla_dias")).toBe("Prazo de atendimento (dias)");
  });

  it("deriva um rótulo legível de coluna desconhecida", () => {
    expect(rotuloCampo("posto_escala_nova")).toBe("Posto escala nova");
    // O sufixo _id é detalhe técnico: a coluna fala da unidade, não do id.
    expect(rotuloCampo("comarca_id")).toBe("Comarca");
  });
});

describe("rotuloTabela", () => {
  it("traduz tabela conhecida e mantém o nome técnico da desconhecida", () => {
    expect(rotuloTabela("user_roles")).toBe("Papéis de acesso");
    expect(rotuloTabela("tabela_nova")).toBe("tabela_nova");
  });
});

describe("formatarValor", () => {
  it("vazio vira travessão", () => {
    expect(formatarValor(null)).toBe("—");
    expect(formatarValor(undefined)).toBe("—");
    expect(formatarValor("")).toBe("—");
    expect(formatarValor([])).toBe("—");
  });

  it("booleano vira Sim/Não", () => {
    expect(formatarValor(true)).toBe("Sim");
    expect(formatarValor(false)).toBe("Não");
  });

  it("data do domínio vira dd/mm/aaaa sem desvio de fuso", () => {
    // Via Date em UTC-4, 01/01 viraria 31/12 do ano anterior.
    expect(formatarValor("2026-01-01")).toBe("01/01/2026");
  });

  it("instante é lido no fuso de Rondônia", () => {
    expect(formatarValor("2026-08-19T15:00:00+00:00")).toBe("19/08/2026 11:00");
  });

  it("coluna monetária sai em reais; número comum, com separador", () => {
    expect(formatarValor(80000, { campo: "valor_mensal" })).toMatch(/R\$\s?80\.000,00/);
    expect(formatarValor(1500, { campo: "quantidade" })).toBe("1.500");
  });

  it("id é traduzido pelo resolver, ou encurtado quando não há nome", () => {
    const id = "0d1f2e3c-4b5a-6978-8a9b-0c1d2e3f4a5b";
    expect(formatarValor(id, { resolver: () => "Fórum de Porto Velho" })).toBe("Fórum de Porto Velho");
    expect(formatarValor(id, { resolver: () => undefined })).toBe("0d1f2e3c…");
  });

  it("lista de ids vira lista de nomes", () => {
    const ids = ["0d1f2e3c-4b5a-6978-8a9b-0c1d2e3f4a5b", "1d1f2e3c-4b5a-6978-8a9b-0c1d2e3f4a5b"];
    const nomes: Record<string, string> = { [ids[0]]: "Ariquemes", [ids[1]]: "Cacoal" };
    expect(formatarValor(ids, { resolver: (id) => nomes[id] })).toBe("Ariquemes, Cacoal");
  });

  it("lista de objetos sai como JSON, sem perder conteúdo", () => {
    expect(formatarValor([{ numero: "1" }])).toBe('[{"numero":"1"}]');
  });
});

describe("mudancas", () => {
  it("na alteração, traz só os campos alterados com antes e depois", () => {
    expect(mudancas(base)).toEqual([
      { campo: "valor_mensal", rotulo: "Valor mensal", antes: 50000, depois: 80000 },
    ]);
  });

  it("sem campos_alterados, calcula a diferença e ignora carimbos do banco", () => {
    const r = mudancas({ ...base, campos_alterados: [] });
    expect(r.map((m) => m.campo)).toEqual(["valor_mensal"]);
  });

  it("na inclusão, traz o registro inteiro sem vazios nem campos técnicos", () => {
    const r = mudancas({
      operacao: "INSERT",
      antes: null,
      depois: { id: "x", nome: "Cacoal", telefone: null, created_at: "2026-08-19T15:00:00Z" },
      campos_alterados: [],
    });
    expect(r).toEqual([{ campo: "nome", rotulo: "Nome", antes: undefined, depois: "Cacoal" }]);
  });

  it("na exclusão, o que resta é o 'antes'", () => {
    const r = mudancas({
      operacao: "DELETE",
      antes: { id: "x", nome: "Cacoal" },
      depois: null,
      campos_alterados: [],
    });
    expect(r).toEqual([{ campo: "nome", rotulo: "Nome", antes: "Cacoal", depois: undefined }]);
  });

  it("booleano false não é tratado como vazio", () => {
    const r = mudancas({
      operacao: "RETRATO",
      antes: null,
      depois: { possui_derso: false },
      campos_alterados: [],
    });
    expect(r.map((m) => m.campo)).toEqual(["possui_derso"]);
  });
});

describe("resumo", () => {
  it("descreve cada operação", () => {
    expect(resumo({ ...base, operacao: "INSERT" })).toBe("Incluiu o registro");
    expect(resumo({ ...base, operacao: "DELETE" })).toBe("Excluiu o registro");
    expect(resumo({ ...base, operacao: "RETRATO" })).toBe("Estado na ativação da trilha");
    expect(resumo(base)).toBe("Alterou Valor mensal");
  });

  it("resume alterações longas", () => {
    const r = resumo({ ...base, campos_alterados: ["nome", "fiscal", "gestor", "objeto", "sla"] });
    expect(r).toBe("Alterou Fiscal, Gestor, Nome e mais 2");
  });
});

describe("autor", () => {
  it("prefere o nome copiado no momento do fato", () => {
    expect(autor(base)).toBe("Maria Souza");
  });

  it("sem nome, identifica pelo id ou pela origem", () => {
    expect(autor({ ...base, usuario_nome: null })).toBe("Usuário 0d1f2e3c…");
    expect(autor({ usuario_id: null, usuario_nome: null, origem: "banco" })).toBe("Direto no banco");
    expect(autor({ usuario_id: null, usuario_nome: null, origem: "sistema" })).toBe("Sistema");
  });
});

describe("inicioDoDiaRondonia", () => {
  it("ancora a meia-noite em UTC-4", () => {
    expect(inicioDoDiaRondonia("2026-08-19")).toBe("2026-08-19T00:00:00-04:00");
    expect(new Date(inicioDoDiaRondonia("2026-08-19")).toISOString()).toBe("2026-08-19T04:00:00.000Z");
  });
});

describe("termoDeBusca", () => {
  it("remove o que quebraria o filtro do PostgREST", () => {
    expect(termoDeBusca("  115/2023, (V2)*  ")).toBe("115/2023 V2");
    expect(termoDeBusca("100%")).toBe("100");
  });
});

describe("linhaExportacao", () => {
  it("monta a linha com a mudança por extenso", () => {
    const l = linhaExportacao(base);
    expect(l["Data e hora"]).toBe("19/08/2026 11:00");
    expect(l["Usuário"]).toBe("Maria Souza");
    expect(l["Operação"]).toBe("Alteração");
    expect(l["Tabela"]).toBe("Contratos");
    expect(l["Detalhe"]).toMatch(/^Valor mensal: R\$\s?50\.000,00 → R\$\s?80\.000,00$/);
  });

  it("na exclusão, lista os valores que o registro tinha", () => {
    const l = linhaExportacao({
      ...base, operacao: "DELETE", antes: { nome: "Cacoal" }, depois: null, campos_alterados: [],
    });
    expect(l["Detalhe"]).toBe("Nome: Cacoal");
  });
});
