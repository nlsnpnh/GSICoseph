-- Adiciona flag de super_admin protegido no perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Trigger que impede remoção do admin de um super_admin
CREATE OR REPLACE FUNCTION public.proteger_super_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = OLD.user_id AND super_admin = TRUE
    ) THEN
      RAISE EXCEPTION 'Este usuário é um administrador protegido e não pode ter o papel admin removido.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tg_proteger_super_admin ON public.user_roles;
CREATE TRIGGER tg_proteger_super_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_super_admin();
