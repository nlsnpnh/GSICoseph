-- Permite que o operador exclua servidores e terceirizados da sua unidade.
-- Antes, o DELETE estava restrito apenas a 'admin', mesmo o operador podendo
-- inserir e editar registros da própria unidade. Alinha a política de DELETE
-- com as de INSERT/UPDATE (admin, gestor ou operador da mesma unidade).

DROP POLICY IF EXISTS "servidores: delete" ON public.servidores;
CREATE POLICY "servidores: delete" ON public.servidores
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

DROP POLICY IF EXISTS "terceirizados: delete" ON public.terceirizados;
CREATE POLICY "terceirizados: delete" ON public.terceirizados
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );
