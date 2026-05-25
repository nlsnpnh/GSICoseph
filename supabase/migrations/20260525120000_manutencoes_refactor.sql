-- =====================================================================
-- Módulo de Manutenções (reaproveita a tabela public.ocorrencias)
-- Foco: chamados técnicos / manutenção predial, SLA por categoria,
-- visualização por unidade e controle de acesso por perfil.
-- =====================================================================

-- ── Novas colunas do modelo de manutenção ───────────────────────────
ALTER TABLE public.ocorrencias
  ADD COLUMN IF NOT EXISTS servico              TEXT,
  ADD COLUMN IF NOT EXISTS categoria            TEXT,
  ADD COLUMN IF NOT EXISTS servidor_solicitante TEXT;

-- Colunas legadas deixam de ser obrigatórias (o novo formulário não as usa;
-- o front preenche `titulo`/`tipo` por retrocompatibilidade dos painéis antigos).
ALTER TABLE public.ocorrencias ALTER COLUMN titulo DROP NOT NULL;
ALTER TABLE public.ocorrencias ALTER COLUMN tipo   DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ocorrencias_categoria ON public.ocorrencias(categoria);

-- ── RLS: regras de acesso por perfil ────────────────────────────────
-- Admin/Gestor: CRUD completo + alterar status + finalizar + excluir.
-- Unidade predial (operador): SOMENTE leitura dos chamados da própria unidade.
DROP POLICY IF EXISTS "ocorrencias: select"  ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias: insert"  ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias: update"  ON public.ocorrencias;
DROP POLICY IF EXISTS "ocorrencias: delete"  ON public.ocorrencias;

-- SELECT: admin, gestor ou usuário vinculado à unidade do registro
CREATE POLICY "ocorrencias: select" ON public.ocorrencias
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

-- INSERT: apenas admin/gestor (operador da unidade NÃO cria)
CREATE POLICY "ocorrencias: insert" ON public.ocorrencias
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor')
  );

-- UPDATE: apenas admin/gestor (operador da unidade NÃO edita / não altera status)
CREATE POLICY "ocorrencias: update" ON public.ocorrencias
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor')
  );

-- DELETE: admin/gestor (antes era apenas admin)
CREATE POLICY "ocorrencias: delete" ON public.ocorrencias
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor')
  );

-- ── Anexos: alinhar gestão de anexos ao mesmo perfil ────────────────
-- (admin/gestor inserem e removem; leitura segue autenticada)
DROP POLICY IF EXISTS "anexos: delete admin" ON public.ocorrencia_anexos;
CREATE POLICY "anexos: delete admin/gestor" ON public.ocorrencia_anexos
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor')
  );

DROP POLICY IF EXISTS "anexos storage: delete admin" ON storage.objects;
CREATE POLICY "anexos storage: delete admin/gestor" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'anexos' AND (
      public.has_role(auth.uid(),'admin') OR
      public.has_role(auth.uid(),'gestor')
    )
  );
