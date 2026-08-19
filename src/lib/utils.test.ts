import { describe, expect, it } from "vitest";
import { cn, getErrorMessage } from "./utils";

describe("cn", () => {
  it("junta classes condicionais ignorando valores falsos", () => {
    const ativo = false;
    expect(cn("a", ativo && "b", null, undefined, "c")).toBe("a c");
  });

  it("resolve conflito do Tailwind mantendo a ultima classe", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("getErrorMessage", () => {
  it("extrai a mensagem de um Error", () => {
    expect(getErrorMessage(new Error("falhou"))).toBe("falhou");
  });

  it("devolve a propria string", () => {
    expect(getErrorMessage("erro cru")).toBe("erro cru");
  });

  it("le message de objetos que nao sao Error (ex.: PostgrestError)", () => {
    expect(getErrorMessage({ message: "violacao de RLS", code: "42501" })).toBe(
      "violacao de RLS",
    );
  });

  it("converte valores sem mensagem em string", () => {
    expect(getErrorMessage(404)).toBe("404");
    expect(getErrorMessage(null)).toBe("null");
  });
});
