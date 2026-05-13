-- ─────────────────────────────────────────────────────────────────
-- Boletim Operacional Mensal (15 indicadores fixos por unidade/mês)
-- ─────────────────────────────────────────────────────────────────

-- Catálogo dos 15 itens fixos
CREATE TABLE IF NOT EXISTS public.boletim_itens_catalogo (
  item_number SMALLINT PRIMARY KEY CHECK (item_number BETWEEN 1 AND 15),
  descricao   TEXT    NOT NULL,
  categoria   TEXT
);

INSERT INTO public.boletim_itens_catalogo (item_number, descricao, categoria) VALUES
  (1,  'Número de acautelamento de armas de FOGO',                                                                           'arma_fogo'),
  (2,  'Número de acautelamento de armas BRANCAS',                                                                           'arma_branca'),
  (3,  'Registros de roubos e furtos ocorridos na unidade',                                                                  'roubo_furto'),
  (4,  'Ocorrências de incidentes de segurança',                                                                             'incidente'),
  (5,  'Extravio de cartões de acesso a serviço/visitantes',                                                                 'acesso'),
  (6,  'Relutância no controle de acesso/identificação',                                                                     'relutancia'),
  (7,  'Falhas em equipamentos de segurança, informando número do chamado',                                                  'falha_equipamento'),
  (8,  'Acessos concedidos a áreas sensíveis, como faciais de gabinetes e salas racks',                                      'acesso_sensivel'),
  (9,  'Número de servidores do TJRO que atuam no Núcleo de Segurança, incluindo o supervisor(a) de segurança',              'efetivo'),
  (10, 'Número de funcionários terceirizados que auxiliam o NUSEG no serviço de portaria/recepção 44 horas',                 'efetivo'),
  (11, 'Número de funcionários terceirizados que auxiliam o NUSEG no serviço de portaria/recepção 12x36 horas',              'efetivo'),
  (12, 'Número de policial DERSO existente na unidade',                                                                      'efetivo'),
  (13, 'Número de pessoas autorizadas pelo Juiz Diretor a acessar a unidade predial fora do horário de expediente',          'autorizacao'),
  (14, 'Número de acionamentos ocorridos fora do horário de expediente',                                                     'acionamento'),
  (15, 'Reuniões de alinhamento realizadas pelo núcleo local com os agentes de portaria/AFS',                                'reuniao')
ON CONFLICT (item_number) DO UPDATE
  SET descricao = EXCLUDED.descricao,
      categoria = EXCLUDED.categoria;

ALTER TABLE public.boletim_itens_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boletim_itens: leitura autenticada" ON public.boletim_itens_catalogo
  FOR SELECT TO authenticated USING (true);

-- Lançamentos mensais
CREATE TABLE IF NOT EXISTS public.boletim_mensal (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id   UUID        NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  ano          SMALLINT    NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  mes          SMALLINT    NOT NULL CHECK (mes BETWEEN 1 AND 12),
  item_number  SMALLINT    NOT NULL REFERENCES public.boletim_itens_catalogo(item_number),
  quantidade   INTEGER     NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  observacoes  TEXT,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unidade_id, ano, mes, item_number)
);

CREATE INDEX IF NOT EXISTS idx_boletim_unidade ON public.boletim_mensal(unidade_id);
CREATE INDEX IF NOT EXISTS idx_boletim_ano_mes ON public.boletim_mensal(ano, mes);
CREATE INDEX IF NOT EXISTS idx_boletim_item    ON public.boletim_mensal(item_number);

CREATE TRIGGER trg_boletim_updated
  BEFORE UPDATE ON public.boletim_mensal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.boletim_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boletim: select" ON public.boletim_mensal
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

CREATE POLICY "boletim: insert" ON public.boletim_mensal
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

CREATE POLICY "boletim: update" ON public.boletim_mensal
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

CREATE POLICY "boletim: delete" ON public.boletim_mensal
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
