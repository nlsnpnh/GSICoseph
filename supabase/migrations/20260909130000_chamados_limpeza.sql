-- =====================================================================
-- Sobras do modelo de ocorrência que a migration anterior não removeu.
-- =====================================================================

-- `data_abertura` (DATE) ficou convivendo com `aberto_em` (TIMESTAMPTZ),
-- que é quem responde "quando o chamado foi aberto". Pior que redundante,
-- ela era uma armadilha: o default `CURRENT_DATE` é lido no fuso do
-- servidor (UTC), então todo chamado aberto após as 20h em Rondônia
-- nasceria gravado com a data do dia seguinte — exatamente o defeito que
-- `src/lib/dates.ts` existe para evitar.
ALTER TABLE public.chamados DROP COLUMN IF EXISTS data_abertura;

-- O enum de prioridade continuava com o nome do modelo antigo. É usado
-- apenas por `chamados.prioridade`, então renomear não afeta nada mais.
ALTER TYPE public.prioridade_oco RENAME TO prioridade_chamado;
