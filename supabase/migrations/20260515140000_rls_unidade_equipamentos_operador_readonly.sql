-- Operador NÃO pode criar, alterar nem excluir vínculos de equipamentos.
-- Continua podendo ler os equipamentos da própria unidade (já garantido
-- pela política de SELECT existente). Apenas admin/gestor podem mutar.

ALTER TABLE public.unidade_equipamentos ENABLE ROW LEVEL SECURITY;

-- SELECT: admin/gestor leem tudo; operador lê apenas vínculos da sua unidade.
DROP POLICY IF EXISTS "unidade_equipamentos: select" ON public.unidade_equipamentos;
CREATE POLICY "unidade_equipamentos: select" ON public.unidade_equipamentos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
    OR unidade_id = public.get_user_unidade_id()
  );

-- INSERT/UPDATE/DELETE: apenas admin e gestor.
DROP POLICY IF EXISTS "unidade_equipamentos: insert" ON public.unidade_equipamentos;
CREATE POLICY "unidade_equipamentos: insert" ON public.unidade_equipamentos
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );

DROP POLICY IF EXISTS "unidade_equipamentos: update" ON public.unidade_equipamentos;
CREATE POLICY "unidade_equipamentos: update" ON public.unidade_equipamentos
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );

DROP POLICY IF EXISTS "unidade_equipamentos: delete" ON public.unidade_equipamentos;
CREATE POLICY "unidade_equipamentos: delete" ON public.unidade_equipamentos
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
