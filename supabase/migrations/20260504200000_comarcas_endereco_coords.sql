-- Adiciona campos de endereço, telefone e coordenadas geográficas à tabela comarcas
ALTER TABLE public.comarcas
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS lat     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng     DOUBLE PRECISION;

-- Atualiza as comarcas do seed inicial com coordenadas aproximadas de Rondônia
UPDATE public.comarcas SET lat = -8.7619,  lng = -63.9039 WHERE nome = 'Porto Velho';
UPDATE public.comarcas SET lat = -10.8773, lng = -61.9322 WHERE nome = 'Ji-Paraná';
UPDATE public.comarcas SET lat = -9.9133,  lng = -63.0408 WHERE nome = 'Ariquemes';
UPDATE public.comarcas SET lat = -11.4386, lng = -61.4475 WHERE nome = 'Cacoal';
UPDATE public.comarcas SET lat = -12.7406, lng = -60.1458 WHERE nome = 'Vilhena';
