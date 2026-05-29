-- Remove status_cadastro: redundante com situacao funcional
ALTER TABLE public.servidores
  DROP COLUMN IF EXISTS status_cadastro;
