-- Add Cedido to situacao_servidor enum if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='Cedido' AND enumtypid='situacao_servidor'::regtype) THEN
    ALTER TYPE situacao_servidor ADD VALUE 'Cedido';
  END IF;
END $$;

-- New columns on servidores
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS data_ingresso date,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS funcao_atual text,
  ADD COLUMN IF NOT EXISTS observacoes text;

-- New columns on unidades for titular/substituto
ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS servidor_titular_id uuid,
  ADD COLUMN IF NOT EXISTS servidor_substituto_id uuid;