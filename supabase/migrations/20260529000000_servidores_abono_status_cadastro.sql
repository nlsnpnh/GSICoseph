-- Adiciona marcação de abono de permanência (mantém situação 'Ativo')
-- e status do cadastro funcional do servidor
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS abono_permanencia boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status_cadastro text NOT NULL DEFAULT 'Ativo';
