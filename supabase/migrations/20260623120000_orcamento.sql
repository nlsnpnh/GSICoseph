-- Módulo Orçamento — Acompanhamento da Execução Orçamentária GSI 2026
-- Duas tabelas (acesso exclusivo de administradores):
--   orcamento_acoes      → abas 4078 (COSEPH), 4079 (ASMIL), 4080 (ABM)
--   orcamento_superavit  → aba Superávit 2026
-- A aba "Macrodesafios GSI" é um dashboard calculado a partir de orcamento_acoes.

-- ───────────────────────── orcamento_acoes ─────────────────────────
CREATE TABLE IF NOT EXISTS public.orcamento_acoes (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano               SMALLINT    NOT NULL DEFAULT 2026,
  acao              TEXT        NOT NULL CHECK (acao IN ('4078','4079','4080')),
  ordem             SMALLINT    NOT NULL DEFAULT 0,
  ed                TEXT,        -- Elemento de Despesa
  sl                TEXT,        -- Subelemento
  fonte             TEXT,
  objeto            TEXT,
  dotacao           NUMERIC(15,2) NOT NULL DEFAULT 0,
  empenho           NUMERIC(15,2) NOT NULL DEFAULT 0,
  reforco_empenho   NUMERIC(15,2) NOT NULL DEFAULT 0,
  anulacao_empenho  NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_dotacao     NUMERIC(15,2) NOT NULL DEFAULT 0,
  liquidado         NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_empenho     NUMERIC(15,2) NOT NULL DEFAULT 0,
  protocolo         TEXT,
  nota_empenho      TEXT,
  observacao        TEXT,
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orcamento_acoes_ano_acao ON public.orcamento_acoes(ano, acao);

DROP TRIGGER IF EXISTS trg_orcamento_acoes_updated ON public.orcamento_acoes;
CREATE TRIGGER trg_orcamento_acoes_updated
  BEFORE UPDATE ON public.orcamento_acoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orcamento_acoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orcamento_acoes: select" ON public.orcamento_acoes;
CREATE POLICY "orcamento_acoes: select" ON public.orcamento_acoes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "orcamento_acoes: insert" ON public.orcamento_acoes;
CREATE POLICY "orcamento_acoes: insert" ON public.orcamento_acoes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "orcamento_acoes: update" ON public.orcamento_acoes;
CREATE POLICY "orcamento_acoes: update" ON public.orcamento_acoes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "orcamento_acoes: delete" ON public.orcamento_acoes;
CREATE POLICY "orcamento_acoes: delete" ON public.orcamento_acoes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ──────────────────────── orcamento_superavit ──────────────────────
CREATE TABLE IF NOT EXISTS public.orcamento_superavit (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano               SMALLINT    NOT NULL DEFAULT 2026,
  acao              TEXT        NOT NULL CHECK (acao IN ('4078','4079','4080')),
  ordem             SMALLINT    NOT NULL DEFAULT 0,
  especificacao     TEXT,
  elemento_despesa  TEXT,
  subelemento       TEXT,
  unidade_medida    TEXT,
  quantidade        NUMERIC(15,2),
  valor_unitario    NUMERIC(15,2),
  valor_total       NUMERIC(15,2) NOT NULL DEFAULT 0,
  exercicio         TEXT,
  envolve_pca       TEXT,
  data_maxima       DATE,
  justificativa     TEXT,
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orcamento_superavit_ano_acao ON public.orcamento_superavit(ano, acao);

DROP TRIGGER IF EXISTS trg_orcamento_superavit_updated ON public.orcamento_superavit;
CREATE TRIGGER trg_orcamento_superavit_updated
  BEFORE UPDATE ON public.orcamento_superavit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orcamento_superavit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orcamento_superavit: select" ON public.orcamento_superavit;
CREATE POLICY "orcamento_superavit: select" ON public.orcamento_superavit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "orcamento_superavit: insert" ON public.orcamento_superavit;
CREATE POLICY "orcamento_superavit: insert" ON public.orcamento_superavit
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "orcamento_superavit: update" ON public.orcamento_superavit;
CREATE POLICY "orcamento_superavit: update" ON public.orcamento_superavit
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "orcamento_superavit: delete" ON public.orcamento_superavit;
CREATE POLICY "orcamento_superavit: delete" ON public.orcamento_superavit
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ───────────────────────────── Seed 2026 ───────────────────────────
INSERT INTO public.orcamento_acoes
  (ano, acao, ordem, ed, sl, fonte, objeto, dotacao, empenho, reforco_empenho,
   anulacao_empenho, saldo_dotacao, liquidado, saldo_empenho, protocolo, nota_empenho, observacao)
SELECT * FROM (VALUES
  (2026, '4078', 1, '33.90.14', '15', '1759008001', 'Diárias de Civis para deslocamento Institucional', 8000, 8000, 0, 0, 0, 1964.68, 6035.32, '0001998-65.2026.8.22.8000', '2026NE000176', NULL),
  (2026, '4078', 2, '33.90.14', '14', '1759008001', 'Viagens e Deslocamento Institucional diárias no País (Dentro do Estado)', 28000, 10000, 31800, 0, 18000, 0, 10000, '0001998-65.2026.8.22.8000', '2026NE000177', NULL),
  (2026, '4078', 3, '33.90.37', '99', '17590080011', 'Prestação dos Serviços de Portaria nas unidades do TJRO', 8640000, 1308387.8, 0, 0, 7331612.2, 0, 1308387.8, NULL, NULL, NULL),
  (2026, '4078', 4, '33.90.39', '92', '17590080011', 'Locação de solução de Vigilância eletrônica e de Controle de acesso de pessoas e veículos (CFTV)', 7205308, 0, 0, 0, 7205308, 0, 0, NULL, NULL, NULL),
  (2026, '4078', 5, '33.90.4', '99', '17590080011', 'Locação com locação de infraestrutura de monitoramento, por (CFTV) - Unidades Prisionais', 775000, 670894.96, 567400, 0, 104105.04, 0, 670894.96, NULL, NULL, NULL),
  (2026, '4078', 6, '33.91.39', '6', '17590080011', 'Cooperação técnica visando à prestação de serviços, sob a coordenação da equipe do TJRO, de monitoramento eletrônico e de apoio ADM..', 600000, 468192.26, 0, 0, 131807.74, 300000, 168192.26, NULL, NULL, NULL),
  (2026, '4078', 7, '44.90.52', '24', '17590080011', 'Equipamentos e Material Permanente', 500000, 0, 530800, 0, 500000, 0, 0, NULL, NULL, NULL),
  (2026, '4078', 8, '33.90.30', '25', '17590080011', 'Material de Consumo - Contrato Manunteção  Equip de Segurança', 350000, 0, 0, 0, 350000, 0, 0, NULL, NULL, NULL),
  (2026, '4078', 9, '33.90.39', '17', '17590080011', 'Material de Consumo - Contrato Manunteção  Equip de Segurança', 399992, 0, 0, 0, 399992, 0, 0, NULL, NULL, NULL),
  (2026, '4078', 10, '33.90.37', '11', '17590080011', 'Serviço de Monitoramento - CIM', 1800000, 0, 0, 0, 1800000, 0, 0, NULL, NULL, NULL),
  (2026, '4078', 11, '33.90.35', '01', '17590080011', 'Serviços de Consuloria', 100000, 0, 506450, 0, 100000, 0, 0, NULL, NULL, NULL),
  (2026, '4079', 1, '33.90.15', '17', '1759008001', 'Diárias Especial de Reforço de Serviço Operacional - DERSO', 2599470.08, 1750000, 0, 0, 849470.08, 482085.12, 1267914.88, NULL, '2026NE000182', 'REFORÇO - 2026NE000187 (27/01/2026) R$246.463,60
REFORÇO - 2026NE000565 (02/03/2026) R$1.500.000,00'),
  (2026, '4079', 2, '33.90.15', '14', '1759008001', 'Diárias no país (Dentro do Estado) - Diárias Militar', 979471.22, 300000, 0, 0, 679471.22, 48566.56, 251433.44, NULL, '2026NE000180', NULL),
  (2026, '4079', 3, '33.90.15', '15', '1759008001', 'Diárias no país (Fora do Estado) - Diárias Militar', 7858.7, 0, 0, 0, 7858.7, 0, 0, NULL, NULL, NULL),
  (2026, '4079', 4, '33.90.92', '08', '1759008001', 'Diárias de Exercício Anteriores', 4715.2, 3536.4, 0, 0, 1178.8, 3536.4, 0, NULL, '2026NE000181', NULL),
  (2026, '4079', 5, '33.90.92', '21', '1759008001', 'Diárias de Exercício Anteriores  - DERSO', 212984.8, 82000, 0, 0, 130984.8, 81215.36, 784.639999999999, NULL, '2026NE000441', NULL),
  (2026, '4079', 6, '44.90.52', '00', '1759008001', 'Material Permanente - Convênio de Armas e DERSO', 2005700, 0, 0, 0, 2005700, 0, 0, NULL, NULL, NULL),
  (2026, '4079', 7, '44.90.52', '06', '1759008001', 'Aquisição de Rádio HT', 156000, 0, 0, 0, 156000, 0, 0, NULL, NULL, NULL),
  (2026, '4079', 8, '33.90.52', '00', '1759008001', 'Aquisição de Drone', 50000, 0, 0, 0, 50000, 0, 0, NULL, NULL, NULL),
  (2026, '4079', 9, '33.90.39', '00', '1759008001', 'Serviço de acesso à internet via satélite de alta velocidade, por meio da tecnologia fornecida pela plataforma Starlink,', 24000, 0, 0, 0, 24000, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 1, '33.90.14', '14', '1759008001', 'Viagens e Deslocamento Institucional diárias no País (Dentro do Estado)', 17000, 17000, 0, 0, 0, 0, 17000, NULL, NULL, NULL),
  (2026, '4080', 2, '33.90.15', '14', '1759008001', 'Diárias no país (Dentro do Estado) - Diárias Militar', 41000, 41000, 0, 0, 0, 0, 41000, NULL, NULL, NULL),
  (2026, '4080', 3, '44.90.52', '24', '1759008001', 'Equipamento de Material Permanente', 150000, 150000, 186300, 0, 0, 10995.4, 139004.6, NULL, NULL, NULL),
  (2026, '4080', 4, '44.90.52', '24', '1759008001', 'Equipamento de Material Permanente - Fornecimento de cadeira de resgate para transporte de pessoas em escadas', 186225, 186225, 0, 0, 0, 74490, 111735, NULL, NULL, NULL),
  (2026, '4080', 5, '3.3.3.90.30', '00', '1759008001', 'Equipamento de Material Consumo', 58300, 0, 0, 0, 58300, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 6, '3.3.3.90.30', '66', '1759008001', 'Equipamento de Material Consumo - Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança)', 28968.24, 0, 0, 0, 28968.24, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 7, '3.3.3.90.30', '66', '1759008001', 'Equipamento de Material Consumo - Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança) - apito', 11215.26, 0, 0, 0, 11215.26, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 8, '3.3.3.90.30', '66', '1759008001', 'Equipamento de Material Consumo - Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança) - óculos', 12328.96, 0, 0, 0, 12328.96, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 9, '3.3.3.90.30', '66', '1759008001', 'Equipamento de Material Consumo - Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança) - capacete', 19745.6, 0, 0, 0, 19745.6, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 10, '3.3.3.90.30', '44', '1759008001', 'Aquisição de cones de sinalização', 51035, 0, 0, 0, 51035, 0, 0, NULL, NULL, NULL),
  (2026, '4080', 11, '3.3.3.90.30', '23', '1759008001', 'Fornecimento de camiseta gola redonda - (PP, P, M, G e GG)', 48900.5, 0, 172500, 0, 48900.5, 0, 0, NULL, NULL, NULL)
) AS v(ano, acao, ordem, ed, sl, fonte, objeto, dotacao, empenho, reforco_empenho,
       anulacao_empenho, saldo_dotacao, liquidado, saldo_empenho, protocolo, nota_empenho, observacao)
WHERE NOT EXISTS (SELECT 1 FROM public.orcamento_acoes WHERE ano = 2026);

INSERT INTO public.orcamento_superavit
  (ano, acao, ordem, especificacao, elemento_despesa, subelemento, unidade_medida,
   quantidade, valor_unitario, valor_total, exercicio, envolve_pca, data_maxima, justificativa)
SELECT v.ano, v.acao, v.ordem, v.especificacao, v.elemento_despesa, v.subelemento, v.unidade_medida,
       v.quantidade, v.valor_unitario, v.valor_total, v.exercicio, v.envolve_pca,
       v.data_maxima::date, v.justificativa
FROM (VALUES
  (2026, '4078', 1, 'Contratação de empresa para o fornecimento de material permanente de rádio comunicadores do tipo HT e acessórios.', '44.90.52', '6', 'Unidade', 110, 2490, 273900, '2026', 'SIM', '2026-09-30', 'Em razão do disposto no processo nº 0020733-83.2025.8.22.8000, que trata da Assessoria do Corpo de Bombeiros Militar e prevê a necessidade de disponibilização de rádios comunicadores portáteis do tipo HT para todas as Comarcas deste Poder Judiciário, observa-se a necessidade de revisão do valor inicialmente estimado da demanda, considerando que a orientação técnica estabelece a distribuição mínima de 2 (duas) unidades para edificações com apenas um pavimento, podendo alcançar até 10 (dez) rádios em edificações com múltiplos pavimentos, o que implica aumento do quantitativo de equipamentos e, consequentemente, majoração do valor inicialmente previsto.'),
  (2026, '4078', 2, 'Aquisição de equipamentos de segurança institucional, incluindo scanners raio-X para inspeção de bagagens para atender o Tribunal de Justiça do Estado de Rondônia,', '44.90.52', '24', 'Unidade', 2, 128450, 256900, '2026', 'SIM', '2026-08-30', 'O valor solicitado para aporte orçamentário tem por finalidade atender às unidades que necessitam substituir equipamentos em razão do tempo de uso e da consequente necessidade de modernização tecnológica, observando-se as diretrizes previstas na Ata de Registro de Preços oriunda do processo SEI nº 0010673-51.2025.8.22.8000, a fim de assegurar a continuidade, atualização tecnológica e a eficiência das soluções de segurança utilizadas nas edificações deste Poder Judiciário.'),
  (2026, '4078', 3, 'Locação  de infraestrutura de monitoramento, por (CFTV) - Unidades Prisionais', '33.90.40', 'aguarda definição Processo 0005499-27.2026.8.22.8000', 'Locação', 1, 567348.43, 567348.43, '2026', 'SIM', '2026-07-30', 'O processo de contratação em referência encontra-se em trâmite e, à luz dos valores estimados obtidos na pesquisa de mercado realizada para instrução do feito, identifica-se a necessidade de aporte orçamentário na correspondente rubrica, de modo a garantir a adequada previsão e cobertura financeira da despesa estimada, possibilitando a continuidade regular das etapas subsequentes do procedimento de contratação, conforme Processo SEI n. 0015297-46.2025.8.22.8000.'),
  (2026, '4078', 4, 'Diárias de Civis para deslocamento Institucional', '33.90.14', '15', 'Diárias', 20, 785.87, 15717.4, '2026', 'SIM', '2026-08-30', 'Considerando a necessidade de participação de membros do GSI em reuniões técnicas na área de segurança pública, faz-se necessário o reforço orçamentário da unidade, a fim de viabilizar os deslocamentos e assegurar a adequada representação institucional nas articulações relacionadas à segurança das unidades do Poder Judiciário.'),
  (2026, '4079', 1, 'Diárias Especial de Reforço de Serviço Operacional - DERSO', '33.90.15.', '17', 'Diária', 1, 412000, 412000, '2026', 'NÃO', NULL, 'Ativação de 08 (oito) novos postos da DERSO para atender os Fóruns Digitais no interior do Estado. Considerando o serviço diário de 8h, ao valor de R$ 36,16 por hora. Processo n. 0000517-92.2026.8.22.8800.'),
  (2026, '4080', 1, 'Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança)', '33.90.30', '66', 'Unidade', 602, 48.12, 28968.24, '2026', 'SIM', '2026-06-01', 'Para utilização pela Brigada de Emergência, com o objetivo de atender a legislação pertinente, quanto a identificação, atuação e proteção a integridade física do brigadista, conforme item 2 do Termo de Referência 4 (5243881), nos autos 0020802-18.2025.8.22.8000.'),
  (2026, '4080', 2, 'Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança)', '33.90.30', '66', 'Unidade', 602, 18.63, 11215.26, '2026', 'SIM', '2026-06-01', NULL),
  (2026, '4080', 3, 'Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança)', '33.90.30', '66', 'Unidade', 602, 20.48, 12328.96, '2026', 'SIM', '2026-06-01', NULL),
  (2026, '4080', 4, 'Equipamentos de proteção individual - EPI''s (Kit socorrista, apito para brigadista, óculos de proteção e capacete de segurança)', '33.90.30', '66', 'Unidade', 602, 32.8, 19745.6, '2026', 'SIM', '2026-06-01', NULL),
  (2026, '4080', 5, 'Aquisição de cones de sinalização', '33.90.30', '44', 'Unidade', 500, 102.07, 51035, '2026', 'SIM', '2026-04-19', 'Os cones de sinalização constituem material essencial para atuação imediata dos brigadistas em ocorrências como princípio de incêndio, vazamento de líquidos, quedas de objetos, isolamento de áreas sinistradas, controle de fluxo de pessoas e apoio às ações de evacuação, contribuindo diretamente para a preservação da integridade física de magistrados, servidores, jurisdicionados e demais usuários das unidades judiciárias.'),
  (2026, '4080', 6, 'Fornecimento de camiseta gola redonda - (PP, P, M, G e GG)', '33.90.30', '23', 'Unidade', 1204, 40.61, 48900.5, '2026', 'SIM', '2026-06-05', 'A presente contratação tem por objetivo a aquisição de camisetas padronizadas para os brigadistas que atuam nas edificações do Tribunal de Justiça de Rondônia. A medida justifica-se pela necessidade de identificação visual imediata dos brigadistas durante situações de emergência, treinamentos, simulados de evacuação e atividades preventivas de segurança contra incêndio. A padronização do vestuário possibilita maior organização, agilidade e eficiência na atuação das equipes, bem como facilita o reconhecimento por magistrados, servidores, colaboradores, público externo e pelas equipes do Corpo de Bombeiros Militar.'),
  (2026, '4080', 7, 'Fornecimento de cadeira de resgate para transporte de pessoas em escadas', '44.90.52', '57', 'Unidade', 25, 7449, 186225, '2026', 'SIM', '2026-05-01', 'A aquisição de cadeiras de resgaste para transportes de pessoas em escadas é uma medida preventiva essencial para a preservação da vida, bem como, para o cumprimento das normas de segurança, previstas na NR 23 (proteção contra incêndios) do Ministério do Trabalho, na Lei nº 10.098/2000 que trata da acessibilidade para pessoas portadoras de deficiência ou com mobilidade reduzida, e  NBR 9050/2020 que estabelece critérios técnicos para promover a acessibilidade em edificações e espaços urbanos.')
) AS v(ano, acao, ordem, especificacao, elemento_despesa, subelemento, unidade_medida,
       quantidade, valor_unitario, valor_total, exercicio, envolve_pca, data_maxima, justificativa)
WHERE NOT EXISTS (SELECT 1 FROM public.orcamento_superavit WHERE ano = 2026);
