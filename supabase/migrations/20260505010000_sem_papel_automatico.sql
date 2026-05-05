-- Remove atribuição automática de papel no cadastro.
-- Novos usuários ficam sem papel até o admin liberar em Configurações.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, matricula, cargo, lotacao, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.raw_user_meta_data->>'matricula',
    NEW.raw_user_meta_data->>'cargo',
    NEW.raw_user_meta_data->>'lotacao',
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
