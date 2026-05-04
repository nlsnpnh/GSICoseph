
-- Restringir leitura de tabelas com dados sensíveis a admin/gestor
DROP POLICY IF EXISTS "Autenticados leem terceirizados" ON public.terceirizados;
CREATE POLICY "Admin/gestor leem terceirizados" ON public.terceirizados
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

DROP POLICY IF EXISTS "Autenticados leem servidores" ON public.servidores;
CREATE POLICY "Admin/gestor leem servidores" ON public.servidores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

DROP POLICY IF EXISTS "Autenticados leem ocorrencias" ON public.ocorrencias;
CREATE POLICY "Admin/gestor leem ocorrencias" ON public.ocorrencias
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));
