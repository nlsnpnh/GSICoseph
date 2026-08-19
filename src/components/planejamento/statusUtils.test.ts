import { describe, expect, it } from "vitest";
import { prioridadeBadgeClass, statusBadgeClass } from "./statusUtils";

describe("statusBadgeClass", () => {
  it("usa a cor de adequado para concluida e a de critico para atrasada", () => {
    expect(statusBadgeClass("Concluída")).toContain("text-adequate");
    expect(statusBadgeClass("Atrasada")).toContain("text-critical");
  });

  it("diferencia em andamento e suspensa", () => {
    expect(statusBadgeClass("Em andamento")).toContain("text-blue-600");
    expect(statusBadgeClass("Suspensa")).toContain("text-partial");
  });

  it("cai no neutro para nao iniciada", () => {
    expect(statusBadgeClass("Não iniciada")).toContain("text-muted-foreground");
  });

  it("nunca devolve string vazia", () => {
    const todos = ["Concluída", "Em andamento", "Atrasada", "Suspensa", "Não iniciada"] as const;
    for (const s of todos) expect(statusBadgeClass(s).length).toBeGreaterThan(0);
  });
});

describe("prioridadeBadgeClass", () => {
  it("mapeia alta, media e baixa em cores distintas", () => {
    const classes = [
      prioridadeBadgeClass("Alta"),
      prioridadeBadgeClass("Média"),
      prioridadeBadgeClass("Baixa"),
    ];
    expect(new Set(classes).size).toBe(3);
    expect(classes[0]).toContain("text-critical");
  });

  it("usa o neutro quando a prioridade e nula", () => {
    expect(prioridadeBadgeClass(null)).toContain("text-muted-foreground");
  });
});
