-- Adiciona número de patrimônio, data de garantia e vínculo de contrato aos equipamentos
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS numero_patrimonio  TEXT,
  ADD COLUMN IF NOT EXISTS garantia_ate       DATE,
  ADD COLUMN IF NOT EXISTS contrato_vinculado TEXT;
