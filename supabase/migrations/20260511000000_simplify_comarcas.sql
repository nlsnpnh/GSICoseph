-- Simplifica tabela comarcas: remove campos de identificação que pertencem às unidades prediais
-- Mantém apenas nome, municipio sede e coordenadas geográficas

ALTER TABLE public.comarcas
  DROP COLUMN IF EXISTS entrancia,
  DROP COLUMN IF EXISTS municipios_atendidos,
  DROP COLUMN IF EXISTS responsavel,
  DROP COLUMN IF EXISTS endereco,
  DROP COLUMN IF EXISTS telefone,
  ADD COLUMN IF NOT EXISTS municipio TEXT;
