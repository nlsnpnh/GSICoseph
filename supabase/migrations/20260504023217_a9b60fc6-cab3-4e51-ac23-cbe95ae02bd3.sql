
-- ============ ENUM de papéis ============
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'operador');

-- ============ Função updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  matricula TEXT,
  cargo TEXT,
  lotacao TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ has_role (security definer) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ Trigger: cria profile no signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, matricula, cargo, lotacao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.raw_user_meta_data->>'matricula',
    NEW.raw_user_meta_data->>'cargo',
    NEW.raw_user_meta_data->>'lotacao'
  );
  -- Se for o primeiro usuário, vira admin automaticamente; demais ficam sem papel
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Policies: profiles ============
CREATE POLICY "Profiles: usuário vê o próprio" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: usuário atualiza o próprio" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: insert próprio" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ Policies: user_roles ============
CREATE POLICY "Roles: todos autenticados leem" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Roles: admin gerencia" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ comarcas ============
CREATE TABLE public.comarcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  entrancia TEXT NOT NULL CHECK (entrancia IN ('Inicial','Intermediária','Final')),
  municipios_atendidos INTEGER NOT NULL DEFAULT 0,
  responsavel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comarcas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER comarcas_updated_at BEFORE UPDATE ON public.comarcas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ unidades ============
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Fórum','Sede Administrativa','Anexo','Depósito')),
  endereco TEXT,
  cidade TEXT,
  comarca_id UUID REFERENCES public.comarcas(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa','Inativa','Em reforma')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER unidades_updated_at BEFORE UPDATE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ servidores ============
CREATE TABLE public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  cargo TEXT,
  lotacao TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Afastado','Aposentado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER servidores_updated_at BEFORE UPDATE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Policies genéricas para cadastros ============
-- SELECT: qualquer autenticado | INSERT/UPDATE: admin ou gestor | DELETE: admin
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['comarcas','unidades','servidores'] LOOP
    EXECUTE format('CREATE POLICY "%s: leitura autenticada" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s: insert admin/gestor" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''gestor''))', t, t);
    EXECUTE format('CREATE POLICY "%s: update admin/gestor" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''gestor''))', t, t);
    EXECUTE format('CREATE POLICY "%s: delete admin" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''admin''))', t, t);
  END LOOP;
END $$;

-- ============ Seed inicial ============
INSERT INTO public.comarcas (id, nome, entrancia, municipios_atendidos, responsavel) VALUES
  ('11111111-1111-1111-1111-000000000001','Porto Velho','Final',3,'Dr. Antônio Silva'),
  ('11111111-1111-1111-1111-000000000002','Ji-Paraná','Final',2,'Dra. Marina Costa'),
  ('11111111-1111-1111-1111-000000000003','Ariquemes','Intermediária',4,'Dr. Rafael Souza'),
  ('11111111-1111-1111-1111-000000000004','Cacoal','Intermediária',3,'Dra. Juliana Mendes'),
  ('11111111-1111-1111-1111-000000000005','Vilhena','Intermediária',2,'Dr. Paulo Henrique');

INSERT INTO public.unidades (nome, tipo, endereco, cidade, comarca_id, status) VALUES
  ('Fórum Geral de Porto Velho','Fórum','Av. Rogério Weber, 1872','Porto Velho','11111111-1111-1111-1111-000000000001','Ativa'),
  ('Sede Administrativa TJRO','Sede Administrativa','Rua José Camacho, 585','Porto Velho','11111111-1111-1111-1111-000000000001','Ativa'),
  ('Fórum de Ji-Paraná','Fórum','Av. Brasil, 595','Ji-Paraná','11111111-1111-1111-1111-000000000002','Ativa'),
  ('Fórum de Ariquemes','Fórum','Av. Tancredo Neves, 2606','Ariquemes','11111111-1111-1111-1111-000000000003','Em reforma'),
  ('Anexo Cacoal','Anexo','Rua Anísio Serrão, 2300','Cacoal','11111111-1111-1111-1111-000000000004','Ativa');

INSERT INTO public.servidores (nome, matricula, cargo, lotacao, email, status) VALUES
  ('Carlos Eduardo Lima','20451','Analista Judiciário','COSEPH','carlos.lima@tjro.jus.br','Ativo'),
  ('Fernanda Almeida','20987','Técnica Judiciária','Fórum Porto Velho','fernanda.almeida@tjro.jus.br','Ativo'),
  ('Rodrigo Pereira','18342','Agente de Segurança','Fórum Ji-Paraná','rodrigo.pereira@tjro.jus.br','Ativo'),
  ('Patrícia Nogueira','22110','Analista Judiciário','COSEPH','patricia.nogueira@tjro.jus.br','Afastado');

-- ============ Storage: avatars ============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true);

CREATE POLICY "Avatars: leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatars: usuário envia o próprio" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars: usuário atualiza o próprio" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars: usuário remove o próprio" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
