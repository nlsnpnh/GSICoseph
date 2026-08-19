// Regras de ordenação compartilhadas entre as listagens.

/** Comarca da capital — abre as listagens ordenadas por comarca. */
export const COMARCA_CAPITAL = "Porto Velho";

/**
 * Compara ignorando caixa e acento (sensitivity "base"), então "PORTO VELHO"
 * e "Pôrto Velho" também casam com a capital.
 */
export const ehCapital = (comarca: string) =>
  comarca.trim().localeCompare(COMARCA_CAPITAL, "pt-BR", { sensitivity: "base" }) === 0;

/**
 * Ordena comarcas com a capital em primeiro e as demais em ordem alfabética.
 * Devolve 0 quando são a mesma comarca, para encadear com um segundo critério.
 */
export function comparaComarca(a: string, b: string): number {
  const ca = ehCapital(a);
  const cb = ehCapital(b);
  if (ca !== cb) return ca ? -1 : 1;
  return a.localeCompare(b, "pt-BR");
}

/** Comparação alfabética padrão em português. */
export const comparaTexto = (a: string, b: string) => a.localeCompare(b, "pt-BR");
