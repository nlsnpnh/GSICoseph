-- Separa apostilamentos dos aditivos na tabela contratos
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS apostilamentos JSONB NOT NULL DEFAULT '[]'::jsonb;
