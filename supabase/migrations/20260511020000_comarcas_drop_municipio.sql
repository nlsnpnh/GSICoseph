-- Remove campo municipio redundante com o nome da comarca
ALTER TABLE public.comarcas
  DROP COLUMN IF EXISTS municipio;
