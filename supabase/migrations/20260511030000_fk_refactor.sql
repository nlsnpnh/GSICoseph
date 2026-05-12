-- ============================================================
-- Refatoração estrutural: FK reais substituem campos texto
-- Unidade é a entidade central; comarca é só agrupador
-- ============================================================

-- 1. comarcas: remove lat/lng (pins ficam nas unidades)
ALTER TABLE public.comarcas
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng;

-- 2. unidades: troca comarca TEXT → comarca_id UUID FK
ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS comarca_id UUID REFERENCES public.comarcas(id) ON DELETE SET NULL;
ALTER TABLE public.unidades
  DROP COLUMN IF EXISTS comarca;

-- 3. servidores: troca unidade TEXT + comarca TEXT → unidade_id UUID FK
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL;
ALTER TABLE public.servidores
  DROP COLUMN IF EXISTS unidade,
  DROP COLUMN IF EXISTS comarca;

-- 4. terceirizados: troca unidade TEXT + comarca TEXT → unidade_id UUID FK
ALTER TABLE public.terceirizados
  ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL;
ALTER TABLE public.terceirizados
  DROP COLUMN IF EXISTS unidade,
  DROP COLUMN IF EXISTS comarca;

-- 5. Atualiza get_user_comarca_nome() para usar a FK real
CREATE OR REPLACE FUNCTION public.get_user_comarca_nome()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.nome
  FROM public.comarcas c
  JOIN public.unidades u ON u.comarca_id = c.id
  JOIN public.profiles p ON p.unidade_id = u.id
  WHERE p.user_id = auth.uid()
$$;

-- 6. RLS servidores: usa unidade_id no lugar de comparação por nome
DROP POLICY IF EXISTS "servidores: select" ON public.servidores;
DROP POLICY IF EXISTS "servidores: insert" ON public.servidores;
DROP POLICY IF EXISTS "servidores: update" ON public.servidores;
CREATE POLICY "servidores: select" ON public.servidores
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "servidores: insert" ON public.servidores
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "servidores: update" ON public.servidores
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

-- 7. RLS terceirizados: idem
DROP POLICY IF EXISTS "terceirizados: select" ON public.terceirizados;
DROP POLICY IF EXISTS "terceirizados: insert" ON public.terceirizados;
DROP POLICY IF EXISTS "terceirizados: update" ON public.terceirizados;
CREATE POLICY "terceirizados: select" ON public.terceirizados
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "terceirizados: insert" ON public.terceirizados
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
CREATE POLICY "terceirizados: update" ON public.terceirizados
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
