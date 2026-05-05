-- Recria políticas de escrita para unidades e contratos
-- (SELECT já foi recriado em 20260505000000; INSERT/UPDATE/DELETE estavam faltando)

-- ── UNIDADES ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin/gestor inserem unidades" ON public.unidades;
DROP POLICY IF EXISTS "Admin/gestor editam unidades"  ON public.unidades;
DROP POLICY IF EXISTS "Admin deleta unidades"         ON public.unidades;
DROP POLICY IF EXISTS "unidades: insert"              ON public.unidades;
DROP POLICY IF EXISTS "unidades: update"              ON public.unidades;
DROP POLICY IF EXISTS "unidades: delete"              ON public.unidades;

CREATE POLICY "unidades: insert" ON public.unidades
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "unidades: update" ON public.unidades
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "unidades: delete" ON public.unidades
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
  );

-- ── CONTRATOS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados leem contratos"   ON public.contratos;
DROP POLICY IF EXISTS "Admin/gestor inserem contratos" ON public.contratos;
DROP POLICY IF EXISTS "Admin/gestor editam contratos"  ON public.contratos;
DROP POLICY IF EXISTS "Admin deleta contratos"         ON public.contratos;
DROP POLICY IF EXISTS "contratos: select"              ON public.contratos;
DROP POLICY IF EXISTS "contratos: insert"              ON public.contratos;
DROP POLICY IF EXISTS "contratos: update"              ON public.contratos;
DROP POLICY IF EXISTS "contratos: delete"              ON public.contratos;

CREATE POLICY "contratos: select" ON public.contratos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "contratos: insert" ON public.contratos
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "contratos: update" ON public.contratos
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "contratos: delete" ON public.contratos
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
  );
