-- Módulo Planejamento — Plano Anual de Atividades COSEPH
-- Tabela multiano de ações de planejamento (acesso exclusivo de administradores).
-- Seed: 59 ações do ano 2026 ({"nop_adm":13,"nop_ope":15,"cim":21,"assessoria_coseph":10}).

CREATE TABLE IF NOT EXISTS public.planejamento_acoes (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano            SMALLINT    NOT NULL DEFAULT 2026,
  setor          TEXT        NOT NULL CHECK (setor IN ('assessoria_coseph','nop_adm','nop_ope','cim')),
  ordem          SMALLINT    NOT NULL DEFAULT 0,
  eixo           TEXT,
  problema       TEXT,
  publico_alvo   TEXT,
  acao           TEXT        NOT NULL,
  etapas         TEXT,
  responsavel    TEXT,
  prazo_data     TEXT,
  frequencia     TEXT,
  prioridade     TEXT        CHECK (prioridade IS NULL OR prioridade IN ('Alta','Média','Baixa')),
  status         TEXT        NOT NULL DEFAULT 'Não iniciada'
                 CHECK (status IN ('Não iniciada','Em andamento','Concluída','Atrasada','Suspensa')),
  percentual     SMALLINT    NOT NULL DEFAULT 0 CHECK (percentual BETWEEN 0 AND 100),
  data_inicio    DATE,
  data_conclusao DATE,
  indicador      TEXT,
  evidencia_sei  TEXT,
  link_documento TEXT,
  observacoes    TEXT,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planejamento_ano_setor ON public.planejamento_acoes(ano, setor);

DROP TRIGGER IF EXISTS trg_planejamento_updated ON public.planejamento_acoes;
CREATE TRIGGER trg_planejamento_updated
  BEFORE UPDATE ON public.planejamento_acoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS — somente administradores
ALTER TABLE public.planejamento_acoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planejamento: select" ON public.planejamento_acoes;
CREATE POLICY "planejamento: select" ON public.planejamento_acoes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "planejamento: insert" ON public.planejamento_acoes;
CREATE POLICY "planejamento: insert" ON public.planejamento_acoes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "planejamento: update" ON public.planejamento_acoes;
CREATE POLICY "planejamento: update" ON public.planejamento_acoes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "planejamento: delete" ON public.planejamento_acoes;
CREATE POLICY "planejamento: delete" ON public.planejamento_acoes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Seed 2026 (idempotente: só insere se o ano ainda não existir)
INSERT INTO public.planejamento_acoes
  (ano, setor, ordem, eixo, problema, publico_alvo, acao, etapas, responsavel, prazo_data,
   frequencia, prioridade, status, percentual, data_inicio, data_conclusao, indicador,
   evidencia_sei, link_documento, observacoes)
SELECT
  v.ano, v.setor, v.ordem, v.eixo, v.problema, v.publico_alvo, v.acao, v.etapas, v.responsavel,
  v.prazo_data, v.frequencia, v.prioridade, v.status, v.percentual,
  v.data_inicio::date, v.data_conclusao::date,
  v.indicador, v.evidencia_sei, v.link_documento, v.observacoes
FROM (VALUES
  (2026, 'nop_adm', 1, 'Gestão Contratual', 'Baixo conhecimento dos contratos', 'Supervisores e fiscais', 'Workshop de Alinhamento Contratual', '1. Levantar dúvidas 2. Preparar material 3. Capacitar equipes 4. Avaliar resultados', 'Assessoria COSEPH / NOP ADM', NULL, 'Trimestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Capacitação realizada', NULL, NULL, NULL),
  (2026, 'nop_adm', 2, 'Gestão Contratual', 'Fiscalização não padronizada', 'Fiscais e NUSEGs', 'Padronização da Fiscalização', '1. Elaborar checklist 2. Elaborar fluxo 3. Validar procedimento 4. Implantar nas unidades', 'Assessoria COSEPH / NOP ADM', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Checklist implantado', NULL, NULL, NULL),
  (2026, 'nop_adm', 3, 'Gestão Contratual', 'Falta de controle dos SLA''s', 'Fiscais dos contratos', 'Monitoramento dos SLA''s', '1. Definir indicadores 2. Monitorar desempenho 3. Registrar desvios 4. Propor medidas corretivas', 'Assessoria COSEPH / NOP ADM', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'SLA acompanhado', NULL, NULL, NULL),
  (2026, 'nop_adm', 4, 'Gestão Contratual', 'Risco de vencimento contratual', 'COSEPH', 'Controle de Vigência Contratual', '1. Mapear vencimentos 2. Elaborar cronograma 3. Alertar fiscais 4. Iniciar providências', 'Assessoria COSEPH / NOP ADM', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Cronograma atualizado', NULL, NULL, NULL),
  (2026, 'nop_adm', 5, 'Gestão Contratual', 'Falta de integração entre fiscais e contratadas', 'Fiscais e empresas', 'Reunião de Alinhamento Contratual', '1. Levantar pautas 2. Convocar participantes 3. Realizar reunião 4. Registrar ata', 'Assessoria COSEPH / NOP ADM', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Ata de reunião', NULL, NULL, NULL),
  (2026, 'nop_adm', 6, 'Aquisições', 'Necessidade de planejamento das contratações', 'COSEPH', 'Gestão do PCA', '1. Levantar demandas 2. Priorizar aquisições 3. Consolidar PCA 4. Monitorar execução', 'Assessoria COSEPH / NOP ADM', NULL, 'Anual', 'Alta', 'Não iniciada', 0, NULL, NULL, 'PCA acompanhado', NULL, NULL, NULL),
  (2026, 'nop_adm', 7, 'Aquisições', 'Necessidade de instrução processual', 'COSEPH', 'Elaboração de ETP', '1. Realizar reunião técnica 2. Levantar necessidade 3. Elaborar estudo 4. Encaminhar para revisão', 'Assessoria COSEPH / NOP ADM', NULL, 'Conforme demanda', 'Alta', 'Não iniciada', 0, NULL, NULL, 'ETP elaborado', NULL, NULL, NULL),
  (2026, 'nop_adm', 8, 'Aquisições', 'Necessidade de especificações adequadas', 'COSEPH', 'Elaboração de TR', '1. Definir objeto 2. Elaborar especificações 3. Validar requisitos 4. Encaminhar processo', 'Assessoria COSEPH / NOP ADM', NULL, 'Conforme demanda', 'Alta', 'Não iniciada', 0, NULL, NULL, 'TR elaborado', NULL, NULL, NULL),
  (2026, 'nop_adm', 9, 'Aquisições', 'Necessidade de estimativa de preços', 'COSEPH', 'Pesquisa de Mercado', '1. Consultar fornecedores 2. Levantar preços 3. Consolidar estimativa 4. Anexar ao processo', 'Assessoria COSEPH / NOP ADM', NULL, 'Conforme demanda', 'Média', 'Não iniciada', 0, NULL, NULL, 'Pesquisa concluída', NULL, NULL, NULL),
  (2026, 'nop_adm', 10, 'Convênios', 'Necessidade de controle das parcerias', 'GSI / COSEPH', 'Gestão de Convênios', '1. Acompanhar vigência 2. Monitorar execução 3. Registrar pendências 4. Propor providências', 'Assessoria COSEPH / NOP ADM', NULL, 'Trimestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Convênios acompanhados', NULL, NULL, NULL),
  (2026, 'nop_adm', 11, 'Governança Contratual', 'Falta de conhecimento do Contrato 115/2023', 'NUSEGs e CIM', 'Workshop de Alinhamento Contratual V2', '1. Apresentar escopo 2. Explicar chamados e SLA 3. Tratar IMR/glosas 4. Padronizar fiscalização', 'Assessoria COSEPH / NOP ADM', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Workshop realizado', NULL, NULL, NULL),
  (2026, 'nop_adm', 12, 'Governança Contratual', 'Falta de conhecimento do Contrato 23/2024', 'NUSEGs', 'Workshop de Alinhamento Contratual AFS', '1. Apresentar postos 2. Orientar ocorrências 3. Alinhar cobertura 4. Padronizar fiscalização', 'Assessoria COSEPH / NOP ADM', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Workshop realizado', NULL, NULL, NULL),
  (2026, 'nop_adm', 13, 'Governança Contratual', 'Falta de conhecimento do Contrato 244/2025', 'Supervisores e fiscais', 'Workshop de Alinhamento Contratual TECHSCAN', '1. Apresentar escopo 2. Orientar preventivas 3. Explicar corretivas/SLA 4. Padronizar acionamentos', 'Assessoria COSEPH / NOP ADM', NULL, 'Semestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Workshop realizado', NULL, NULL, NULL),
  (2026, 'nop_ope', 1, 'Gestão Operacional', 'Falta de padronização entre NUSEGs', 'Supervisores dos NUSEGs', 'Programa de Padronização Operacional', '1. Levantar divergências 2. Revisar procedimentos 3. Orientar equipes 4. Monitorar aplicação', 'NOP OPE', NULL, 'Trimestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Procedimentos padronizados', NULL, NULL, NULL),
  (2026, 'nop_ope', 2, 'Gestão Operacional', 'Falta de integração entre CIM e NUSEGs', 'Supervisores', 'Reunião Operacional Integrada', '1. Levantar ocorrências 2. Consolidar demandas 3. Realizar reunião 4. Acompanhar providências', 'NOP OPE', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Reunião realizada', NULL, NULL, NULL),
  (2026, 'nop_ope', 3, 'Segurança Orgânica', 'Ausência de diagnóstico atualizado das unidades', 'NUSEGs', 'Programa de Vistorias Operacionais, incluindo os Fóruns Digitais', '1. Realizar inspeção 2. Identificar vulnerabilidades 3. Emitir relatório 4. Propor plano de ação', 'NOP OPE', NULL, 'Anual', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Relatório de vistoria', NULL, NULL, NULL),
  (2026, 'nop_ope', 4, 'Segurança Orgânica', 'Falta de mapeamento de riscos', 'COSEPH', 'Mapeamento de Vulnerabilidades', '1. Levantar riscos 2. Classificar criticidade 3. Consolidar mapa 4. Acompanhar medidas', 'NOP OPE', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Mapa de vulnerabilidades', NULL, NULL, NULL),
  (2026, 'nop_ope', 5, 'Procedimentos Operacionais', 'POPs desatualizados', 'NUSEGs e CIM', 'Revisão dos POPs', '1. Revisar normas 2. Atualizar procedimentos 3. Validar com COSEPH 4. Implantar orientações', 'NOP OPE', NULL, 'Anual', 'Alta', 'Não iniciada', 0, NULL, NULL, 'POPs revisados', NULL, NULL, NULL),
  (2026, 'nop_ope', 6, 'Procedimentos Operacionais', 'Falta de protocolos específicos', 'NUSEGs', 'Elaboração de Protocolos Operacionais', '1. Identificar necessidade 2. Elaborar protocolo 3. Testar aplicação 4. Implementar', 'NOP OPE', NULL, 'Conforme demanda', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Protocolo implantado', NULL, NULL, NULL),
  (2026, 'nop_ope', 7, 'Controle de Acesso', 'Aplicação desigual da Instrução 020', 'NUSEGs', 'Programa de Uniformização', '1. Realizar reunião técnica 2. Orientar unidades 3. Acompanhar aplicação 4. Manual de Procedimentos 5. Avaliar e Corrigir', 'NOP OPE', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Uniformização aplicada', NULL, NULL, NULL),
  (2026, 'nop_ope', 8, 'Inteligência Operacional', 'Ausência de histórico institucional', 'COSEPH', 'Banco de Lições Aprendidas', '1. Catalogar incidentes 2. Registrar soluções 3. Disponibilizar consulta 4. Revisar periodicamente', 'NOP OPE', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Lições catalogadas', NULL, NULL, NULL),
  (2026, 'nop_ope', 9, 'Capacitação', 'Deficiência técnica dos supervisores', 'Supervisores', 'Programa de Capacitação Operacional', '1. Levantar necessidades 2. Elaborar cronograma 3. Ministrar instruções 4. Avaliar resultados', 'NOP OPE', NULL, 'Trimestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Capacitação realizada', NULL, NULL, NULL),
  (2026, 'nop_ope', 10, 'Capacitação', 'Falhas nos registros operacionais', 'Supervisores', 'Orientação para preenchimento de Relatórios', '1. Padronizar modelo 2. Capacitar equipes 3. Avaliar qualidade 4. Corrigir desvios', 'NOP OPE', NULL, 'Semestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Registros padronizados', NULL, NULL, NULL),
  (2026, 'nop_ope', 11, 'Monitoramento Eletrônico', 'Necessidade de melhoria contínua do CIM', 'CIM e NUSEGs', 'Avaliação da Cobertura Eletrônica entre outros pontos, inclusive comunicaação', '1. Levantar cobertura 2. Identificar lacunas 3. Propor melhorias 4. Monitorar execução', 'NOP OPE', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Cobertura avaliada', NULL, NULL, NULL),
  (2026, 'nop_ope', 12, 'Gestão de Crises', 'Ausência de testes operacionais', 'NUSEGs e CIM', 'Adotar cheklist para os Nusegs', '1. Planejar simulado 2. Executar teste 3. Avaliar resposta 4. Registrar melhorias', 'NOP OPE/Nuseg', NULL, 'Semanal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Simulado realizado', NULL, NULL, NULL),
  (2026, 'nop_ope', 13, 'Articulação Institucional', 'Baixa integração com órgãos parceiros', 'GSI / COSEPH', 'Programa de Benchmarking', '1. Mapear órgãos 2. Realizar visitas 3. Registrar oportunidades 4. Propor melhorias', 'NOP OPE', NULL, 'Semestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Relatório de benchmarking', NULL, NULL, NULL),
  (2026, 'nop_ope', 14, 'Supervisão Operacional', 'Falta de acompanhamento sistemático das unidades', 'NUSEGs', 'Supervisão Técnica das Unidades', '1. Acompanhar supervisores 2. Registrar demandas 3. Emitir orientação 4. Monitorar providências', 'NOP OPE', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Unidades acompanhadas', NULL, NULL, NULL),
  (2026, 'nop_ope', 15, 'Segurança Institucional', 'Falta de avaliação das medidas de proteção', 'Magistrados e unidades sensíveis', 'Revisão das Medidas de Segurança', '1. Avaliar vulnerabilidades 2. Verificar controles 3. Propor ajustes 4. Monitorar execução', 'NOP OPE', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Medidas revisadas', NULL, NULL, NULL),
  (2026, 'cim', 1, 'Monitoramento', 'Necessidade de verificação preventiva das áreas críticas', 'CIM / Unidades', 'Rondas virtuais', 'Realizar verificação preventiva das câmeras, ativos e áreas críticas', 'Operadores', NULL, 'Contínuo', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Situações suspeitas identificadas', NULL, NULL, NULL),
  (2026, 'cim', 2, 'Monitoramento', 'Câmeras e ativos podem ficar offline ou obstruídos', 'CIM / Unidades', 'Checagem de câmeras', 'Verificar câmeras, botões de emergência e demais ativos offline, com falhas ou obstruções', 'Operadores', NULL, 'Contínuo', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Funcionamento garantido', NULL, NULL, NULL),
  (2026, 'cim', 3, 'Monitoramento', 'Necessidade de rastreabilidade das ações', 'CIM', 'Registro de ocorrências', 'Registrar todas as ocorrências no sistema ou parte diária digital', 'Operadores', NULL, 'Contínuo', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Ocorrências registradas', NULL, NULL, NULL),
  (2026, 'cim', 4, 'Monitoramento', 'Necessidade de controle de áreas sensíveis', 'CIM / Unidades', 'Monitoramento de acessos', 'Acompanhar entradas e saídas em áreas sensíveis', 'Operadores', NULL, 'Contínuo', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Acessos monitorados', NULL, NULL, NULL),
  (2026, 'cim', 5, 'Segurança Preventiva', 'Existência de pontos cegos e fragilidades', 'COSEPH / NUSEGs', 'Mapeamento de vulnerabilidades', 'Identificar pontos cegos e fragilidades nas unidades', 'Coordenação / Supervisor Geral', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Riscos reduzidos', NULL, NULL, NULL),
  (2026, 'cim', 6, 'Segurança Preventiva', 'Ocorrências recorrentes sem análise consolidada', 'COSEPH / CIM', 'Análise de ocorrências recorrentes', 'Levantar locais e situações com maior incidência', 'Coordenação / Supervisor Geral', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Atuação preventiva', NULL, NULL, NULL),
  (2026, 'cim', 7, 'Segurança Preventiva', 'Necessidade de prontidão dos alarmes', 'CIM / NUSEGs', 'Teste de alarmes', 'Verificar funcionamento de alarmes e sensores', 'Supervisores / Operadores', NULL, 'Semanal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Prontidão operacional', NULL, NULL, NULL),
  (2026, 'cim', 8, 'Gestão', 'Baixa visibilidade dos dados do setor', 'COSEPH / GSI', 'Relatório estatístico mensal', 'Produzir relatório com dados e indicadores do setor em formulário modelo SEI', 'Coordenação', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Relatório emitido', NULL, NULL, NULL),
  (2026, 'cim', 9, 'Gestão', 'Necessidade de acompanhamento da equipe', 'CIM', 'Controle de produtividade', 'Acompanhar produtividade e desempenho da equipe', 'Coordenação / Supervisor Geral', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Produtividade acompanhada', NULL, NULL, NULL),
  (2026, 'cim', 10, 'Gestão', 'Necessidade de alinhamento operacional', 'CIM', 'Reunião de alinhamento', 'Realizar alinhamento operacional e estratégico', 'Supervisor Geral', NULL, 'Semanal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Acompanhamento realizado', NULL, NULL, NULL),
  (2026, 'cim', 11, 'Gestão', 'Histórico de incidentes não catalogado', 'COSEPH / CIM', 'Lições aprendidas', 'Preservar e catalogar o histórico de incidentes', 'Supervisor Geral', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Banco de conhecimento', NULL, NULL, NULL),
  (2026, 'cim', 12, 'Tecnologia', 'Necessidade de controle dos ativos', 'CIM', 'Inventário de equipamentos', 'Atualizar relação de câmeras e demais ativos', 'Supervisor Geral', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Inventário atualizado', NULL, NULL, NULL),
  (2026, 'cim', 13, 'Tecnologia', 'Necessidade de atualização dos sistemas', 'CIM', 'Atualização de sistemas', 'Verificar necessidade de atualização de softwares', 'Supervisores', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Controle de sistemas', NULL, NULL, NULL),
  (2026, 'cim', 14, 'Tecnologia', 'Necessidade de preservação de evidências', 'CIM', 'Backup de imagens', 'Garantir armazenamento seguro das imagens', 'Supervisor Geral', NULL, 'Diário', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Evidências preservadas', NULL, NULL, NULL),
  (2026, 'cim', 15, 'Inteligência', 'Necessidade de apoio à tomada de decisão', 'COSEPH / GSI', 'Mapa de ocorrências', 'Produzir mapa com locais e tipos de ocorrências', 'Coordenação', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Mapa produzido', NULL, NULL, NULL),
  (2026, 'cim', 16, 'Inteligência', 'Necessidade de identificar padrões suspeitos', 'COSEPH / GSI', 'Análise preventiva', 'Identificar padrões suspeitos ou riscos institucionais', 'Coordenação', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Inteligência preventiva', NULL, NULL, NULL),
  (2026, 'cim', 17, 'Capacitação', 'Necessidade de atualização técnica', 'Equipe CIM', 'Treinamento da equipe', 'Capacitar equipe sobre protocolos e sistemas', 'Todos', NULL, 'Trimestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Equipe capacitada', NULL, NULL, NULL),
  (2026, 'cim', 18, 'Capacitação', 'Necessidade de preparação operacional', 'CIM / NUSEGs', 'Simulados operacionais', 'Realizar simulações de incidentes críticos', 'Coordenação / Supervisor Geral', NULL, 'Semestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Simulado realizado', NULL, NULL, NULL),
  (2026, 'cim', 19, 'Visibilidade Unidade', 'Baixo reconhecimento institucional do CIM', 'Alta Gestão', 'Apresentação de resultados', 'Apresentar indicadores e ações para gestão', 'Coordenação / Supervisor Geral', NULL, 'Trimestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Resultados apresentados', NULL, NULL, NULL),
  (2026, 'cim', 20, 'Visibilidade Unidade', 'Necessidade de divulgação das ações do setor', 'COSEPH / GSI', 'Produção de informativos', 'Divulgar ações e melhorias do setor', 'Supervisor Geral', NULL, 'Mensal', 'Média', 'Não iniciada', 0, NULL, NULL, 'Informativos produzidos', NULL, NULL, NULL),
  (2026, 'cim', 21, 'Governança', 'Necessidade de padronização dos acionamentos', 'CIM / NUSEGs', 'Fluxo de comunicação emergencial', 'Revisar lista de contatos e padronizar acionamentos emergenciais', 'Supervisor Geral', NULL, 'Mensal', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Fluxo atualizado', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 1, 'Governança', 'Ausência de indicadores consolidados', 'GSI / Presidência / COSEPH', 'Dashboard Executivo da COSEPH', '1. Definir indicadores 2. Consolidar dados 3. Atualizar painel 4. Apresentar resultados', 'Assessoria COSEPH', NULL, 'Mensal', 'Alta', 'Em andamento', 50, '2026-06-01', '2026-06-05', 'Painel atualizado', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 2, 'Governança', 'Baixa visibilidade das ações da segurança', 'Alta Gestão', 'Relatório Gerencial da COSEPH', '1. Consolidar contratos 2. Consolidar indicadores 3. Consolidar projetos 4. Emitir relatório executivo', 'Assessoria COSEPH', NULL, 'Mensal', 'Alta', 'Em andamento', 25, '2026-06-15', '2026-06-30', 'Relatório emitido', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 3, 'Planejamento Estratégico', 'Necessidade de alinhamento institucional', 'COSEPH', 'Monitoramento do SPO e PCA', '1. Verificar ações cadastradas 2. Acompanhar metas 3. Atualizar informações 4. Reportar desvios', 'Assessoria COSEPH', NULL, 'Mensal', 'Alta', 'Em andamento', 50, '2026-01-01', '2026-12-19', 'SPO atualizado', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 4, 'Planejamento Estratégico', 'Necessidade de acompanhamento dos projetos estratégicos', 'GSI / COSEPH', 'Monitoramento do SIPLAG', '1. Acompanhar projetos cadastrados 2. Atualizar status 3. Registrar entregas 4. Reportar pendências', 'Assessoria COSEPH', NULL, 'Mensal', 'Alta', 'Em andamento', 50, '2026-01-01', '2026-12-19', 'SIPLAG acompanhado', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 5, 'Governança Orçamentária', 'Necessidade de controle da execução financeira', 'COSEPH', 'Monitoramento do SIGEF', '1. Consultar sistema 2. Verificar saldos 3. Acompanhar empenhos e liquidações 4. Elaborar demonstrativo', 'Assessoria COSEPH / NOP ADM', NULL, 'Mensal', 'Alta', 'Não iniciada', 50, '2026-01-01', '2026-12-19', 'Demonstrativo financeiro', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 6, 'Planejamento', 'Ausência de visão integrada dos projetos', 'COSEPH', 'Plano Anual da Segurança Institucional', '1. Levantar projetos 2. Definir metas 3. Consolidar cronograma 4. Acompanhar entregas', 'Assessoria COSEPH', NULL, 'Anual', 'Alta', 'Não iniciada', 10, '2026-06-01', '2026-06-30', 'Plano anual aprovado', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 7, 'Orçamento', 'Necessidade de controle financeiro', 'COSEPH', 'Gestão Orçamentária', '1. Monitorar saldo 2. Projetar despesas 3. Reportar riscos 4. Subsidiar decisões', 'Assessoria COSEPH', NULL, 'Mensal', 'Alta', 'Em andamento', 0, '2026-01-01', '2026-12-19', 'Relatório', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 8, 'Inovação', 'Necessidade de modernização constante', 'COSEPH', 'Estudos de Modernização Tecnológica', '1. Realizar benchmarking 2. Levantar tecnologias 3. Avaliar viabilidade 4. Apresentar proposta', 'Assessoria COSEPH', NULL, 'Semestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Estudo técnico', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 9, 'Governança', 'Falta de acompanhamento de riscos estratégicos', 'GSI / COSEPH', 'Mapa de Riscos da Segurança Institucional', '1. Identificar riscos 2. Classificar criticidade 3. Definir controles 4. Monitorar evolução', 'Assessoria COSEPH', NULL, 'Semestral', 'Alta', 'Não iniciada', 0, NULL, NULL, 'Mapa de riscos', NULL, NULL, NULL),
  (2026, 'assessoria_coseph', 10, 'Articulação Institucional', 'Necessidade de integração com outras instituições', 'GSI / COSEPH', 'Agenda Institucional de Segurança', '1. Mapear instituições 2. Agendar visitas 3. Registrar oportunidades 4. Propor melhorias', 'Assessoria COSEPH', NULL, 'Semestral', 'Média', 'Não iniciada', 0, NULL, NULL, 'Relatório de visitas', NULL, NULL, NULL)
) AS v(ano, setor, ordem, eixo, problema, publico_alvo, acao, etapas, responsavel, prazo_data,
       frequencia, prioridade, status, percentual, data_inicio, data_conclusao, indicador,
       evidencia_sei, link_documento, observacoes)
WHERE NOT EXISTS (SELECT 1 FROM public.planejamento_acoes WHERE ano = 2026);
