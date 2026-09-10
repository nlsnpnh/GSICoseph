// =====================================================================
// Indicadores de seguranca da unidade predial, em tri-estado.
//
// `true` = possui, `false` = nao possui, `null` = NAO INFORMADO. A diferenca
// entre os dois ultimos e o ponto inteiro deste arquivo: enquanto os campos
// eram booleanos com default `false`, uma unidade cadastrada sem passar pela
// secao Seguranca era indistinguivel de uma sem nenhum controle — e o mapa
// pintava a comarca de vermelho por falta de cadastro.
//
// Regra que vale em todo lugar: quem nao respondeu nao entra na conta, nem
// no numerador nem no denominador.
// =====================================================================

import type { IndicadorSeguranca } from "@/data/unidades";

/** Os tres campos que compoem a cobertura de seguranca de uma unidade. */
export type IndicadoresUnidade = {
  possui_derso: IndicadorSeguranca;
  controle_acesso: IndicadorSeguranca;
  vigilancia_eletronica: IndicadorSeguranca;
};

const CAMPOS = ["possui_derso", "controle_acesso", "vigilancia_eletronica"] as const;

/** Quantos dos tres indicadores foram respondidos (com sim ou com nao). */
export function respondidos(u: IndicadoresUnidade): number {
  return CAMPOS.filter((c) => u[c] != null).length;
}

/** Quantos dos tres a unidade declara possuir. */
export function possui(u: IndicadoresUnidade): number {
  return CAMPOS.filter((c) => u[c] === true).length;
}

/** True quando a unidade nao respondeu nenhum dos tres. */
export const semResposta = (u: IndicadoresUnidade) => respondidos(u) === 0;

export type Cobertura = {
  /** Percentual sobre o que foi respondido, ou null se ninguem respondeu. */
  percentual: number | null;
  camposRespondidos: number;
  camposPossui: number;
  unidadesSemResposta: number;
};

/**
 * Cobertura de um conjunto de unidades. `percentual` e null — e nao zero —
 * quando nao ha nenhuma resposta: zero afirmaria ausencia de seguranca, e o
 * que existe e ausencia de informacao.
 */
export function calcCobertura(unidades: IndicadoresUnidade[]): Cobertura {
  const camposRespondidos = unidades.reduce((s, u) => s + respondidos(u), 0);
  const camposPossui      = unidades.reduce((s, u) => s + possui(u), 0);
  return {
    percentual: camposRespondidos
      ? Math.round((camposPossui / camposRespondidos) * 100)
      : null,
    camposRespondidos,
    camposPossui,
    unidadesSemResposta: unidades.filter(semResposta).length,
  };
}

/**
 * Percentual de unidades que possuem um indicador especifico, sobre as que
 * responderam aquele campo. Null quando ninguem respondeu.
 */
export function coberturaDoCampo(
  unidades: IndicadoresUnidade[],
  campo: (typeof CAMPOS)[number],
): number | null {
  const responderam = unidades.filter((u) => u[campo] != null);
  if (responderam.length === 0) return null;
  return Math.round(
    (responderam.filter((u) => u[campo] === true).length / responderam.length) * 100,
  );
}
