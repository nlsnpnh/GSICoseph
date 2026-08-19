import { describe, expect, it } from "vitest";
import { prioridadeDotClass, statusDotClass } from "./statusUtils";

describe("statusDotClass", () => {
  it("usa a cor de adequado para concluída e a de crítico para atrasada", () => {
    expect(statusDotClass("Concluída")).toBe("bg-adequate");
    expect(statusDotClass("Atrasada")).toBe("bg-critical");
  });

  it("diferencia em andamento e suspensa", () => {
    expect(statusDotClass("Em andamento")).toBe("bg-blue-500");
    expect(statusDotClass("Suspensa")).toBe("bg-partial");
  });

  it("cai no neutro para não iniciada", () => {
    expect(statusDotClass("Não iniciada")).toBe("bg-muted-foreground/40");
  });

  it("dá uma cor distinta a cada status", () => {
    const todos = ["Concluída", "Em andamento", "Atrasada", "Suspensa", "Não iniciada"] as const;
    const cores = todos.map(statusDotClass);
    expect(new Set(cores).size).toBe(todos.length);
  });
});

describe("prioridadeDotClass", () => {
  it("mapeia alta, média e baixa em cores distintas", () => {
    const cores = [
      prioridadeDotClass("Alta"),
      prioridadeDotClass("Média"),
      prioridadeDotClass("Baixa"),
    ];
    expect(new Set(cores).size).toBe(3);
    expect(cores[0]).toBe("bg-critical");
  });

  it("usa o neutro quando a prioridade é nula", () => {
    expect(prioridadeDotClass(null)).toBe("bg-muted-foreground/40");
  });
});
