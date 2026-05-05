-- Vincula operador à sua unidade predial
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL;

-- Funções auxiliares para RLS
CREATE OR REPLACE FUNCTION public.get_user_unidade_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT unidade_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_unidade_nome()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.nome FROM public.unidades u
  JOIN public.profiles p ON p.unidade_id = u.id
  WHERE p.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_comarca_nome()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.comarca FROM public.unidades u
  JOIN public.profiles p ON p.unidade_id = u.id
  WHERE p.user_id = auth.uid()
$$;

-- ── UNIDADES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados leem unidades" ON public.unidades;
CREATE POLICY "unidades: select" ON public.unidades
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor') OR
    id = public.get_user_unidade_id()
  );

-- ── EQUIPAMENTOS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados leem equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Admin/gestor inserem equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Admin/gestor editam equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Admin deleta equipamentos" ON public.equipamentos;
CREATE POLICY "equipamentos: select" ON public.equipamentos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "equipamentos: insert" ON public.equipamentos
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "equipamentos: update" ON public.equipamentos
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "equipamentos: delete" ON public.equipamentos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ── PORTOES ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados leem portoes" ON public.portoes;
DROP POLICY IF EXISTS "Admin/gestor inserem portoes" ON public.portoes;
DROP POLICY IF EXISTS "Admin/gestor editam portoes" ON public.portoes;
DROP POLICY IF EXISTS "Admin deleta portoes" ON public.portoes;
CREATE POLICY "portoes: select" ON public.portoes
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "portoes: insert" ON public.portoes
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "portoes: update" ON public.portoes
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "portoes: delete" ON public.portoes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ── SERVIDORES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin/gestor leem servidores" ON public.servidores;
DROP POLICY IF EXISTS "Admin/gestor inserem servidores" ON public.servidores;
DROP POLICY IF EXISTS "Admin/gestor editam servidores" ON public.servidores;
DROP POLICY IF EXISTS "Admin deleta servidores" ON public.servidores;
CREATE POLICY "servidores: select" ON public.servidores
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade = public.get_user_unidade_nome()
  );
CREATE POLICY "servidores: insert" ON public.servidores
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade = public.get_user_unidade_nome()
  );
CREATE POLICY "servidores: update" ON public.servidores
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade = public.get_user_unidade_nome()
  );
CREATE POLICY "servidores: delete" ON public.servidores
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ── TERCEIRIZADOS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin/gestor leem terceirizados" ON public.terceirizados;
DROP POLICY IF EXISTS "Admin/gestor inserem terceirizados" ON public.terceirizados;
DROP POLICY IF EXISTS "Admin/gestor editam terceirizados" ON public.terceirizados;
DROP POLICY IF EXISTS "Admin deleta terceirizados" ON public.terceirizados;
CREATE POLICY "terceirizados: select" ON public.terceirizados
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade = public.get_user_unidade_nome()
  );
CREATE POLICY "terceirizados: insert" ON public.terceirizados
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade = public.get_user_unidade_nome()
  );
CREATE POLICY "terceirizados: update" ON public.terceirizados
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade = public.get_user_unidade_nome()
  );
CREATE POLICY "terceirizados: delete" ON public.terceirizados
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ── OCORRENCIAS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin/gestor leem ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Admin/gestor inserem ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Admin/gestor editam ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Admin deleta ocorrencias" ON public.ocorrencias;
CREATE POLICY "ocorrencias: select" ON public.ocorrencias
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "ocorrencias: insert" ON public.ocorrencias
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "ocorrencias: update" ON public.ocorrencias
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "ocorrencias: delete" ON public.ocorrencias
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ── CONTRATOS (operador não acessa) ──────────────────────────────
DROP POLICY IF EXISTS "Autenticados leem contratos" ON public.contratos;
CREATE POLICY "contratos: select" ON public.contratos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
  );
