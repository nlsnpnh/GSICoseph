-- Garante que o nome da comarca seja único (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comarcas_nome_unique'
      AND conrelid = 'public.comarcas'::regclass
  ) THEN
    ALTER TABLE public.comarcas
      ADD CONSTRAINT comarcas_nome_unique UNIQUE (nome);
  END IF;
END $$;
