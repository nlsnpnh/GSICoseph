
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'operador');
CREATE TYPE public.criticidade AS ENUM ('Baixo', 'Médio', 'Alto', 'Crítico');
CREATE TYPE public.tipo_unidade AS ENUM ('Fórum', 'Sede Administrativa', 'Anexo', 'Depósito', 'CEJUSC', 'Juizado');
CREATE TYPE public.situacao_servidor AS ENUM ('Ativo', 'Férias', 'Licença', 'Afastado', 'Aposentado');
CREATE TYPE public.situacao_terc AS ENUM ('Ativo', 'Afastado', 'Substituído', 'Desligado');
CREATE TYPE public.status_equipamento AS ENUM ('Operacional', 'Em manutenção', 'Inoperante', 'Desativado');
CREATE TYPE public.situacao_op AS ENUM ('Operacional', 'Operacional com restrição', 'Inoperante', 'Em manutenção', 'Desativado');
CREATE TYPE public.prioridade_manut AS ENUM ('Nenhuma', 'Baixa', 'Média', 'Alta', 'Urgente');
CREATE TYPE public.prioridade_oco AS ENUM ('Baixa', 'Média', 'Alta', 'Urgente');
CREATE TYPE public.status_oco AS ENUM ('Aberto', 'Em andamento', 'Aguardando peça', 'Concluído', 'Cancelado');
CREATE TYPE public.tipo_ocorrencia AS ENUM ('Chamado', 'Falha', 'Pendência', 'Manutenção preventiva', 'Manutenção corretiva', 'Vistoria');

-- =========================================
-- TIMESTAMP TRIGGER FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  matricula TEXT,
  cargo TEXT,
  lotacao TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================
-- AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, matricula, cargo, lotacao, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.raw_user_meta_data->>'matricula',
    NEW.raw_user_meta_data->>'cargo',
    NEW.raw_user_meta_data->>'lotacao',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operador');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- UNIDADES
-- =========================================
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  comarca TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  responsavel_local TEXT,
  tipo public.tipo_unidade NOT NULL,
  horario_funcionamento TEXT,
  possui_derso BOOLEAN NOT NULL DEFAULT false,
  controle_acesso BOOLEAN NOT NULL DEFAULT false,
  vigilancia_eletronica BOOLEAN NOT NULL DEFAULT false,
  criticidade public.criticidade NOT NULL DEFAULT 'Médio',
  observacoes TEXT,
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER unidades_updated_at BEFORE UPDATE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- SERVIDORES
-- =========================================
CREATE TABLE public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT NOT NULL,
  cargo TEXT NOT NULL,
  unidade TEXT,
  comarca TEXT,
  regime TEXT,
  escala TEXT,
  situacao public.situacao_servidor NOT NULL DEFAULT 'Ativo',
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER servidores_updated_at BEFORE UPDATE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TERCEIRIZADOS
-- =========================================
CREATE TABLE public.terceirizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT,
  empresa TEXT,
  contrato TEXT,
  funcao TEXT,
  posto_trabalho TEXT,
  unidade TEXT,
  comarca TEXT,
  escala TEXT,
  turno TEXT,
  situacao public.situacao_terc NOT NULL DEFAULT 'Ativo',
  certificacoes TEXT,
  validade_certificacao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.terceirizados ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER terceirizados_updated_at BEFORE UPDATE ON public.terceirizados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EQUIPAMENTOS
-- =========================================
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  identificacao TEXT,
  fabricante TEXT,
  modelo TEXT,
  numero_serie TEXT,
  localizacao TEXT,
  data_instalacao DATE,
  ultima_manutencao DATE,
  proxima_manutencao DATE,
  status public.status_equipamento NOT NULL DEFAULT 'Operacional',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER equipamentos_updated_at BEFORE UPDATE ON public.equipamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PORTOES
-- =========================================
CREATE TABLE public.portoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  identificacao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  localizacao TEXT,
  automatizacao TEXT,
  camera_associada TEXT,
  interfone BOOLEAN NOT NULL DEFAULT false,
  controle_acesso TEXT,
  situacao public.situacao_op NOT NULL DEFAULT 'Operacional',
  necessidade_manutencao public.prioridade_manut NOT NULL DEFAULT 'Nenhuma',
  descricao_manutencao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portoes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER portoes_updated_at BEFORE UPDATE ON public.portoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- CONTRATOS
-- =========================================
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  empresa TEXT NOT NULL,
  objeto TEXT,
  data_inicio DATE,
  data_fim DATE,
  valor_mensal NUMERIC(14,2) DEFAULT 0,
  valor_total NUMERIC(14,2) DEFAULT 0,
  unidades_atendidas TEXT[] DEFAULT '{}',
  fiscal TEXT,
  gestor TEXT,
  sla TEXT,
  aditivos JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER contratos_updated_at BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- OCORRENCIAS
-- =========================================
CREATE SEQUENCE public.ocorrencias_protocolo_seq START 1;

CREATE TABLE public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL UNIQUE DEFAULT ('OS-' || lpad(nextval('public.ocorrencias_protocolo_seq')::text, 5, '0')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo public.tipo_ocorrencia NOT NULL,
  prioridade public.prioridade_oco NOT NULL DEFAULT 'Média',
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  equipamento TEXT,
  empresa_responsavel TEXT,
  responsavel_nome TEXT,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo DATE,
  data_conclusao DATE,
  status public.status_oco NOT NULL DEFAULT 'Aberto',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- RLS POLICIES
-- =========================================

-- profiles: usuário vê/edita seu próprio; admins veem todos
CREATE POLICY "Próprio perfil select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Próprio perfil insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Próprio perfil update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin pode deletar perfil" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: somente admin gerencia; usuário pode ler os próprios papéis
CREATE POLICY "Ler próprios papéis" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia papéis ins" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia papéis upd" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia papéis del" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Helper: política padrão para tabelas operacionais
-- SELECT: qualquer autenticado
-- INSERT/UPDATE: admin ou gestor
-- DELETE: apenas admin
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['unidades','servidores','terceirizados','equipamentos','portoes','contratos','ocorrencias'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Autenticados leem %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', tbl);
    EXECUTE format('CREATE POLICY "Admin/gestor inserem %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''gestor''))', tbl);
    EXECUTE format('CREATE POLICY "Admin/gestor editam %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''gestor''))', tbl);
    EXECUTE format('CREATE POLICY "Admin deleta %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', tbl);
  END LOOP;
END $$;
