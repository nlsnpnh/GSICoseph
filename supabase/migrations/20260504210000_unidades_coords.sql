-- Adiciona coordenadas geográficas às unidades prediais
ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
