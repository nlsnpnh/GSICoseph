
-- Tabela de ocorrências
CREATE TABLE public.ocorrencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  gravidade TEXT NOT NULL DEFAULT 'Media',
  status TEXT NOT NULL DEFAULT 'Aberta',
  data_fato DATE NOT NULL DEFAULT CURRENT_DATE,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  comarca_id UUID REFERENCES public.comarcas(id) ON DELETE SET NULL,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocorrencias: leitura autenticada" ON public.ocorrencias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ocorrencias: insert admin/gestor" ON public.ocorrencias
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "ocorrencias: update admin/gestor" ON public.ocorrencias
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "ocorrencias: delete admin" ON public.ocorrencias
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ocorrencias_updated
  BEFORE UPDATE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Anexos
CREATE TABLE public.ocorrencia_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ocorrencia_id UUID NOT NULL REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  tamanho BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ocorrencia_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anexos: leitura autenticada" ON public.ocorrencia_anexos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "anexos: insert admin/gestor" ON public.ocorrencia_anexos
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "anexos: delete admin" ON public.ocorrencia_anexos
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Bucket privado para anexos
INSERT INTO storage.buckets (id, name, public) VALUES ('anexos','anexos', false);

CREATE POLICY "anexos storage: select autenticado" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'anexos');
CREATE POLICY "anexos storage: insert admin/gestor" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anexos' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor')));
CREATE POLICY "anexos storage: delete admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'anexos' AND has_role(auth.uid(),'admin'));

CREATE INDEX idx_ocorrencias_unidade ON public.ocorrencias(unidade_id);
CREATE INDEX idx_ocorrencias_comarca ON public.ocorrencias(comarca_id);
CREATE INDEX idx_ocorrencias_status ON public.ocorrencias(status);
CREATE INDEX idx_anexos_ocorrencia ON public.ocorrencia_anexos(ocorrencia_id);
