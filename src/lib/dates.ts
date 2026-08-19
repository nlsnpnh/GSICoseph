// =====================================================================
// Datas do sistema, ancoradas no fuso de Rondonia.
//
// Todo campo de data do dominio (abertura de chamado, vigencia de contrato,
// ingresso de servidor) e "date-only": YYYY-MM-DD, sem hora. Misturar isso com
// `new Date()` do navegador causava dois problemas:
//
//   1. o "hoje" era o do fuso da maquina do usuario, nao o de Rondonia;
//   2. `toISOString()` converte para UTC, entao a meia-noite local podia voltar
//      um dia ao virar texto.
//
// Aqui o "hoje" vem sempre de America/Porto_Velho (UTC-4, sem horario de verao)
// e a aritmetica de dias e feita em UTC sobre datas sem hora — o resultado nao
// depende do fuso de quem abre o sistema.
// =====================================================================

/** Fuso de referencia do sistema: Rondonia (UTC-4, sem horario de verao). */
export const TZ_RONDONIA = "America/Porto_Velho";

// "en-CA" formata como YYYY-MM-DD, que e o formato usado no banco.
const fmtISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ_RONDONIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data (YYYY-MM-DD) de um instante, lida no fuso de Rondonia. */
export function toISODate(instante: Date = new Date()): string {
  return fmtISO.format(instante);
}

/** Hoje em Rondonia (YYYY-MM-DD), independente do fuso do navegador. */
export function hojeISO(): string {
  return toISODate();
}

/** Ancora YYYY-MM-DD em UTC: aritmetica de dias sem desvio de fuso. */
function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** true se a string e uma data YYYY-MM-DD valida. */
export function isISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return !Number.isNaN(parseISO(iso).getTime());
}

/** Soma (ou subtrai) dias a uma data YYYY-MM-DD. */
export function addDiasISO(iso: string, dias: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Dias inteiros de `de` ate `ate` (negativo se `ate` ja passou). */
export function diffDiasISO(de: string, ate: string): number {
  return Math.round((parseISO(ate).getTime() - parseISO(de).getTime()) / 86_400_000);
}

/**
 * Anos completos entre duas datas YYYY-MM-DD (idade, tempo de servico).
 * O ano so conta quando o aniversario chega — comparacao por mes/dia.
 */
export function anosCompletosISO(de: string, ate: string): number {
  const [ay, am, ad] = de.split("-").map(Number);
  const [by, bm, bd] = ate.split("-").map(Number);
  let anos = by - ay;
  if (bm < am || (bm === am && bd < ad)) anos--;
  return anos;
}

/** Soma anos a uma data YYYY-MM-DD. 29/02 vira 28/02 em ano nao bissexto. */
export function addAnosISO(iso: string, anos: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const alvo = new Date(Date.UTC(y + anos, m - 1, d));
  // Dia inexistente transborda para o mes seguinte (29/02 -> 01/03): recua
  // para o ultimo dia do mes pretendido.
  if (alvo.getUTCMonth() !== m - 1) alvo.setUTCDate(0);
  return alvo.toISOString().slice(0, 10);
}
