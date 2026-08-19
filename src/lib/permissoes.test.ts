import { describe, expect, it } from "vitest";
import { podeEditar, podeExcluir, type PerfilAcesso, type Recurso } from "./permissoes";

const admin: PerfilAcesso = { isAdmin: true, isGestor: false, isOperador: false, unidadeId: null };
const gestor: PerfilAcesso = { isAdmin: false, isGestor: true, isOperador: false, unidadeId: null };
const operador: PerfilAcesso = { isAdmin: false, isGestor: false, isOperador: true, unidadeId: "u1" };
const semPapel: PerfilAcesso = { isAdmin: false, isGestor: false, isOperador: false, unidadeId: null };
const operadorSemUnidade: PerfilAcesso = { ...operador, unidadeId: null };

const RECURSOS: Recurso[] = [
  "comarcas", "unidades", "contratos", "ocorrencias", "equipamentos",
  "portoes", "servidores", "terceirizados", "boletim", "planejamento", "orcamento",
];

describe("admin", () => {
  it("pode tudo, em qualquer recurso e qualquer unidade", () => {
    for (const r of RECURSOS) {
      expect(podeEditar(admin, r)).toBe(true);
      expect(podeExcluir(admin, r)).toBe(true);
      expect(podeExcluir(admin, r, "outra-unidade")).toBe(true);
    }
  });
});

describe("gestor", () => {
  it("escreve nos cadastros operacionais", () => {
    for (const r of ["comarcas", "unidades", "contratos", "ocorrencias", "equipamentos", "servidores"] as Recurso[]) {
      expect(podeEditar(gestor, r)).toBe(true);
    }
  });

  it("nao entra em planejamento nem orcamento (RLS: admin only)", () => {
    expect(podeEditar(gestor, "planejamento")).toBe(false);
    expect(podeEditar(gestor, "orcamento")).toBe(false);
    expect(podeExcluir(gestor, "planejamento")).toBe(false);
  });

  it("nao exclui o que a RLS reserva ao admin", () => {
    expect(podeExcluir(gestor, "unidades")).toBe(false);
    expect(podeExcluir(gestor, "contratos")).toBe(false);
    expect(podeExcluir(gestor, "comarcas")).toBe(false);
    expect(podeExcluir(gestor, "portoes")).toBe(false);
    expect(podeExcluir(gestor, "boletim")).toBe(false);
  });

  it("exclui ocorrencias e equipamentos", () => {
    expect(podeExcluir(gestor, "ocorrencias")).toBe(true);
    expect(podeExcluir(gestor, "equipamentos")).toBe(true);
  });
});

describe("operador", () => {
  it("escreve nos recursos por unidade, na propria unidade", () => {
    for (const r of ["servidores", "terceirizados", "portoes", "boletim"] as Recurso[]) {
      expect(podeEditar(operador, r, "u1")).toBe(true);
    }
  });

  it("nao escreve na unidade de outro", () => {
    expect(podeEditar(operador, "servidores", "u2")).toBe(false);
    expect(podeExcluir(operador, "terceirizados", "u2")).toBe(false);
  });

  it("nao escreve nos cadastros de alcance sistemico", () => {
    for (const r of ["comarcas", "unidades", "contratos", "ocorrencias", "equipamentos"] as Recurso[]) {
      expect(podeEditar(operador, r, "u1")).toBe(false);
    }
  });

  it("exclui servidor e terceirizado da propria unidade, mas nao portao nem boletim", () => {
    expect(podeExcluir(operador, "servidores", "u1")).toBe(true);
    expect(podeExcluir(operador, "terceirizados", "u1")).toBe(true);
    expect(podeExcluir(operador, "portoes", "u1")).toBe(false);
    expect(podeExcluir(operador, "boletim", "u1")).toBe(false);
  });

  it("pode criar (sem unidade de registro) porque tem unidade vinculada", () => {
    expect(podeEditar(operador, "servidores")).toBe(true);
  });

  it("nao faz nada sem unidade vinculada", () => {
    for (const r of RECURSOS) {
      expect(podeEditar(operadorSemUnidade, r)).toBe(false);
      expect(podeExcluir(operadorSemUnidade, r)).toBe(false);
    }
  });
});

describe("usuario sem papel", () => {
  it("nao escreve nem exclui nada", () => {
    for (const r of RECURSOS) {
      expect(podeEditar(semPapel, r)).toBe(false);
      expect(podeEditar(semPapel, r, "u1")).toBe(false);
      expect(podeExcluir(semPapel, r)).toBe(false);
    }
  });
});

describe("invariante", () => {
  it("quem exclui tambem edita — nenhuma regra de exclusao e mais frouxa que a de escrita", () => {
    for (const perfil of [admin, gestor, operador, semPapel]) {
      for (const r of RECURSOS) {
        if (podeExcluir(perfil, r, "u1")) {
          expect(podeEditar(perfil, r, "u1")).toBe(true);
        }
      }
    }
  });
});
