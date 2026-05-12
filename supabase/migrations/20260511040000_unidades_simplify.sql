-- Remove campos desnecessários e adiciona responsavel_substituto
ALTER TABLE public.unidades
  DROP COLUMN IF EXISTS tipo,
  DROP COLUMN IF EXISTS criticidade,
  DROP COLUMN IF EXISTS horario_funcionamento,
  DROP COLUMN IF EXISTS imagem_url,
  DROP COLUMN IF EXISTS servidor_titular_id,
  DROP COLUMN IF EXISTS servidor_substituto_id,
  ADD COLUMN IF NOT EXISTS responsavel_substituto TEXT NOT NULL DEFAULT '';
