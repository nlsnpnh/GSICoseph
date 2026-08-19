// Períodos do boletim operacional.
//
// O ano/mês corrente vem do fuso de Rondônia (src/lib/dates), não do navegador:
// com o relógio local, a virada de mês e de exercício aconteceria em momentos
// diferentes conforme o fuso de quem abre o sistema.
import { hojeISO } from "@/lib/dates";

export const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Sistema começou a operar em 2026 — não exibir anos anteriores.
export const ANO_INICIAL = 2026;

export const ANOS = (() => {
  const atual = Number(hojeISO().slice(0, 4));
  const fim = Math.max(atual + 1, ANO_INICIAL + 4);
  const arr: number[] = [];
  for (let a = ANO_INICIAL; a <= fim; a++) arr.push(a);
  return arr.reverse();
})();

/** Ano padrão para abrir as abas: o vigente (se estiver na lista), senão o mais recente. */
export const ANO_VIGENTE = (() => {
  const atual = Number(hojeISO().slice(0, 4));
  return ANOS.includes(atual) ? atual : ANOS[0];
})();

/** Mês corrente (1-12) em Rondônia. */
export const MES_VIGENTE = Number(hojeISO().slice(5, 7));
