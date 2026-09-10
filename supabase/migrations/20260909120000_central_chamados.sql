-- =====================================================================
-- Central de Chamados de Prestação de Serviços
--
-- Substitui o módulo de Manutenção. A tabela `ocorrencias` (vazia no
-- momento desta migration) é RENOMEADA para `chamados` em vez de
-- duplicada: preserva a sequence do número, a FK dos anexos e as
-- policies de storage, e passa a se chamar como a entidade realmente é.
--
-- Regra central: nenhum chamado existe sem UNIDADE PREDIAL e sem CONTRATO.
-- =====================================================================

-- ── 1. Renomeia a estrutura antiga ──────────────────────────────────
ALTER TABLE public.ocorrencias       RENAME TO chamados;
ALTER TABLE public.ocorrencia_anexos RENAME TO chamado_anexos;
ALTER TABLE public.chamado_anexos    RENAME COLUMN ocorrencia_id TO chamado_id;
ALTER SEQUENCE public.ocorrencias_protocolo_seq RENAME TO chamados_numero_seq;

-- Índices e trigger não acompanham o rename da tabela. Sem renomeá-los, os
-- CREATE INDEX mais abaixo montariam um segundo índice sobre as mesmas
-- colunas — e o schema ficaria falando de "ocorrências" que não existem mais.
ALTER TABLE public.chamados RENAME CONSTRAINT ocorrencias_pkey          TO chamados_pkey;
ALTER TABLE public.chamados RENAME CONSTRAINT ocorrencias_protocolo_key TO chamados_numero_key;
ALTER INDEX public.idx_ocorrencias_unidade   RENAME TO idx_chamados_unidade;
ALTER INDEX public.idx_ocorrencias_status    RENAME TO idx_chamados_status;
ALTER INDEX public.idx_ocorrencias_categoria RENAME TO idx_chamados_categoria;
ALTER TRIGGER ocorrencias_updated_at ON public.chamados RENAME TO chamados_updated_at;

-- ── 2. Novo fluxo de status (8 estados) ─────────────────────────────
CREATE TYPE public.status_chamado AS ENUM (
  'Novo', 'Aberto', 'Encaminhado', 'Em atendimento',
  'Aguardando prestador', 'Resolvido', 'Fechado', 'Cancelado'
);

-- Tipo de evento da linha do tempo.
CREATE TYPE public.tipo_evento_chamado AS ENUM (
  'Abertura', 'Mensagem', 'Status', 'Contrato', 'Anexo',
  'Atendimento', 'Conclusão', 'Fechamento', 'Reabertura'
);

-- ── 3. Enxuga o legado ──────────────────────────────────────────────
-- Colunas do modelo antigo de ocorrência que o novo fluxo não usa. A
-- tabela está vazia, então não há perda de informação.
ALTER TABLE public.chamados
  DROP COLUMN IF EXISTS titulo,
  DROP COLUMN IF EXISTS tipo,
  DROP COLUMN IF EXISTS equipamento,
  DROP COLUMN IF EXISTS empresa_responsavel,
  DROP COLUMN IF EXISTS observacoes,
  DROP COLUMN IF EXISTS data_conclusao,
  DROP COLUMN IF EXISTS servidor_solicitante;

DROP TYPE IF EXISTS public.tipo_ocorrencia;

-- `protocolo` vira `numero`. O número é gerado pela sequence, mas pode ser
-- informado manualmente (chamados que já nasceram em outro sistema).
ALTER TABLE public.chamados RENAME COLUMN protocolo TO numero;
ALTER TABLE public.chamados
  ALTER COLUMN numero SET DEFAULT nextval('public.chamados_numero_seq')::text;

-- Números antigos eram 'OS-00001'; o novo é sequencial puro, como no
-- sistema de origem (ex.: 30823).
SELECT setval('public.chamados_numero_seq', 30000, true);

-- ── 4. Colunas do novo modelo ───────────────────────────────────────
ALTER TABLE public.chamados
  ADD COLUMN IF NOT EXISTS contrato_id          UUID REFERENCES public.contratos(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS solicitante_id       UUID REFERENCES public.servidores(id) ON DELETE SET NULL,
  -- Cópia do nome no momento da abertura: o servidor pode ser desligado
  -- depois, e o chamado precisa continuar dizendo quem pediu.
  ADD COLUMN IF NOT EXISTS solicitante_nome     TEXT,
  ADD COLUMN IF NOT EXISTS assunto              TEXT,
  ADD COLUMN IF NOT EXISTS aberto_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ultima_movimentacao  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resolvido_em         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fechado_em           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS solucao              TEXT,
  ADD COLUMN IF NOT EXISTS tags                 TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cc                   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS criado_por           UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Troca o enum de status. A coluna antiga tem default, que precisa cair antes.
ALTER TABLE public.chamados ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.chamados
  ALTER COLUMN status TYPE public.status_chamado
  USING (CASE status::text
    WHEN 'Aberto'          THEN 'Aberto'
    WHEN 'Em andamento'    THEN 'Em atendimento'
    WHEN 'Aguardando peça' THEN 'Aguardando prestador'
    WHEN 'Concluído'       THEN 'Resolvido'
    WHEN 'Cancelado'       THEN 'Cancelado'
    ELSE 'Novo'
  END)::public.status_chamado;
ALTER TABLE public.chamados ALTER COLUMN status SET DEFAULT 'Novo';

DROP TYPE IF EXISTS public.status_oco;

-- Obrigatoriedades do novo modelo (a tabela está vazia).
ALTER TABLE public.chamados
  ALTER COLUMN unidade_id  SET NOT NULL,
  ALTER COLUMN contrato_id SET NOT NULL,
  ALTER COLUMN servico     SET NOT NULL,
  ALTER COLUMN categoria   SET NOT NULL,
  ALTER COLUMN assunto     SET NOT NULL,
  ALTER COLUMN descricao   SET NOT NULL;

-- Excluir unidade ou contrato com chamado vinculado passa a ser proibido:
-- o chamado perderia a resposta de "onde ocorreu" / "qual contrato responde".
ALTER TABLE public.chamados DROP CONSTRAINT IF EXISTS ocorrencias_unidade_id_fkey;
ALTER TABLE public.chamados
  ADD CONSTRAINT chamados_unidade_id_fkey
  FOREIGN KEY (unidade_id) REFERENCES public.unidades(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_chamados_unidade    ON public.chamados(unidade_id);
CREATE INDEX IF NOT EXISTS idx_chamados_contrato   ON public.chamados(contrato_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status     ON public.chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_categoria  ON public.chamados(categoria);
CREATE INDEX IF NOT EXISTS idx_chamados_aberto_em  ON public.chamados(aberto_em DESC);

-- ── 5. Linha do tempo do chamado ────────────────────────────────────
CREATE TABLE public.chamado_eventos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id      UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  tipo            public.tipo_evento_chamado NOT NULL,
  mensagem        TEXT,
  status_anterior public.status_chamado,
  status_novo     public.status_chamado,
  autor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  autor_nome      TEXT NOT NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chamado_eventos_chamado ON public.chamado_eventos(chamado_id, criado_em);
ALTER TABLE public.chamado_eventos ENABLE ROW LEVEL SECURITY;

-- Toda escrita no chamado empurra a última movimentação, que alimenta
-- "data da última ação" e a busca por chamados parados.
CREATE OR REPLACE FUNCTION public.toca_movimentacao_chamado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chamados
     SET ultima_movimentacao = NEW.criado_em
   WHERE id = NEW.chamado_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chamado_eventos_movimentacao
  AFTER INSERT ON public.chamado_eventos
  FOR EACH ROW EXECUTE FUNCTION public.toca_movimentacao_chamado();

-- ── 6. SLA numérico no contrato ─────────────────────────────────────
-- `contratos.sla` é texto corrido (cláusula contratual) e não serve para
-- calcular vencimento. `sla_dias` é o prazo de atendimento em dias.
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS sla_dias INTEGER CHECK (sla_dias IS NULL OR sla_dias > 0);

-- ── 7. Vínculo unidade↔contrato por id ──────────────────────────────
-- `unidades_atendidas` guardava NOMES de unidade: renomear uma unidade
-- desvinculava seus contratos em silêncio. Passa a guardar ids.
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS unidade_ids UUID[] NOT NULL DEFAULT '{}';

-- A policy de leitura de contratos comparava o NOME da unidade do usuário
-- contra o array de nomes, então ela segura a coluna e impede o DROP.
-- É recriada logo abaixo, por id.
DROP POLICY IF EXISTS "contratos: select" ON public.contratos;

UPDATE public.contratos c
   SET unidade_ids = COALESCE((
     SELECT array_agg(u.id)
       FROM public.unidades u
      WHERE u.nome = ANY(c.unidades_atendidas)
   ), '{}');

-- Só descarta a coluna antiga se nenhum nome ficou pelo caminho.
DO $$
DECLARE perdidos INTEGER;
BEGIN
  SELECT count(*) INTO perdidos
    FROM public.contratos c
   WHERE COALESCE(array_length(c.unidades_atendidas, 1), 0)
      <> COALESCE(array_length(c.unidade_ids, 1), 0);
  IF perdidos > 0 THEN
    RAISE EXCEPTION 'Conversão abortada: % contrato(s) com unidade não encontrada por nome', perdidos;
  END IF;
  ALTER TABLE public.contratos DROP COLUMN unidades_atendidas;
END $$;

CREATE INDEX IF NOT EXISTS idx_contratos_unidade_ids ON public.contratos USING GIN (unidade_ids);

-- Mesma regra de antes, agora por id: operador enxerga os contratos que
-- atendem a unidade dele. Renomear a unidade deixa de escondê-los.
CREATE POLICY "contratos: select" ON public.contratos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')  OR
    public.has_role(auth.uid(), 'gestor') OR
    public.get_user_unidade_id() = ANY (unidade_ids)
  );

-- ── 8. RLS: multitenant por unidade ─────────────────────────────────
-- Admin/gestor enxergam e movimentam tudo. Operador abre, lê e movimenta
-- apenas chamados da própria unidade; excluir continua com admin/gestor.
DROP POLICY IF EXISTS "ocorrencias: select" ON public.chamados;
DROP POLICY IF EXISTS "ocorrencias: insert" ON public.chamados;
DROP POLICY IF EXISTS "ocorrencias: update" ON public.chamados;
DROP POLICY IF EXISTS "ocorrencias: delete" ON public.chamados;

CREATE POLICY "chamados: select" ON public.chamados
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')  OR
    public.has_role(auth.uid(), 'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

CREATE POLICY "chamados: insert" ON public.chamados
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')  OR
    public.has_role(auth.uid(), 'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

CREATE POLICY "chamados: update" ON public.chamados
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')  OR
    public.has_role(auth.uid(), 'gestor') OR
    unidade_id = public.get_user_unidade_id()
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin')  OR
    public.has_role(auth.uid(), 'gestor') OR
    unidade_id = public.get_user_unidade_id()
  );

CREATE POLICY "chamados: delete" ON public.chamados
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'gestor')
  );

-- Eventos acompanham a visibilidade do chamado. Sem UPDATE e sem DELETE:
-- o histórico não se reescreve (só some junto com o chamado, por cascade).
CREATE POLICY "chamado_eventos: select" ON public.chamado_eventos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id)
  );

CREATE POLICY "chamado_eventos: insert" ON public.chamado_eventos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id)
  );

-- ── 9. Anexos alinhados ao mesmo perfil ─────────────────────────────
-- Havia duas policies de DELETE sobrepostas ("anexos deletam", só admin, e
-- a de admin/gestor). Como policies permissivas são somadas com OR, a
-- primeira era peso morto.
DROP POLICY IF EXISTS "anexos deletam"              ON public.chamado_anexos;
DROP POLICY IF EXISTS "anexos: delete admin/gestor" ON public.chamado_anexos;
DROP POLICY IF EXISTS "anexos inserem"              ON public.chamado_anexos;
DROP POLICY IF EXISTS "anexos leem"                 ON public.chamado_anexos;

CREATE POLICY "chamado_anexos: select" ON public.chamado_anexos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id)
  );

CREATE POLICY "chamado_anexos: insert" ON public.chamado_anexos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id)
  );

CREATE POLICY "chamado_anexos: delete" ON public.chamado_anexos
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'gestor')
  );

-- ── 10. Mapa das comarcas ───────────────────────────────────────────
-- A função do mapa lia `public.ocorrencias` e filtrava pelos valores do enum
-- antigo ('Aberto', 'Em andamento', 'Aguardando peça'), que deixaram de
-- existir. Sem recriá-la aqui, o mapa institucional quebraria.
-- O tipo de retorno muda (coluna renomeada), então não dá para usar
-- CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.mapa_comarcas_resumo();

CREATE FUNCTION public.mapa_comarcas_resumo()
RETURNS TABLE (
  comarca_id        UUID,
  nome              TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  nivel             TEXT,
  unidades          INT,
  itens_vinculados  INT,
  quantidade_total  INT,
  valor_estimado    NUMERIC,
  cobertura         INT,
  chamados_abertos  INT,
  possui_derso      BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH unidades_validas AS (
    SELECT u.id, u.comarca_id, u.lat, u.lng,
           u.possui_derso, u.controle_acesso, u.vigilancia_eletronica
    FROM public.unidades u
    WHERE u.comarca_id IS NOT NULL AND u.lat IS NOT NULL AND u.lng IS NOT NULL
  ),
  por_comarca AS (
    SELECT
      c.id   AS comarca_id,
      c.nome AS nome,
      AVG(uv.lat) AS lat,
      AVG(uv.lng) AS lng,
      COUNT(DISTINCT uv.id)::INT AS unidades,
      BOOL_OR(uv.possui_derso)   AS possui_derso,
      SUM(
        (uv.possui_derso::INT)
        + (uv.controle_acesso::INT)
        + (uv.vigilancia_eletronica::INT)
      )::INT AS flags_cobertura
    FROM public.comarcas c
    JOIN unidades_validas uv ON uv.comarca_id = c.id
    GROUP BY c.id, c.nome
  ),
  equipamentos AS (
    SELECT u.comarca_id,
           COUNT(*)::INT AS itens_vinculados,
           COALESCE(SUM(ue.quantidade), 0)::INT AS quantidade_total,
           COALESCE(SUM(ue.quantidade * ec.valor_unitario), 0) AS valor_estimado
    FROM public.unidade_equipamentos ue
    JOIN public.unidades u              ON u.id  = ue.unidade_id
    JOIN public.equipamentos_catalogo ec ON ec.id = ue.equipamento_id
    GROUP BY u.comarca_id
  ),
  chamados_ag AS (
    -- Pendente = tudo que não foi fechado nem cancelado, a mesma definição
    -- de `isPendente` no front.
    SELECT u.comarca_id,
           COUNT(*)::INT AS chamados_abertos
    FROM public.chamados ch
    JOIN public.unidades u ON u.id = ch.unidade_id
    WHERE ch.status NOT IN ('Fechado', 'Cancelado')
    GROUP BY u.comarca_id
  )
  SELECT
    pc.comarca_id,
    pc.nome,
    pc.lat,
    pc.lng,
    CASE
      WHEN pc.unidades = 0 THEN 'sem_dados'
      WHEN ROUND((pc.flags_cobertura::NUMERIC / NULLIF(pc.unidades * 3, 0)) * 100) >= 90
        AND COALESCE(e.itens_vinculados, 0) > 0
        AND COALESCE(ch.chamados_abertos, 0) <= 1
        THEN 'adequado'
      WHEN ROUND((pc.flags_cobertura::NUMERIC / NULLIF(pc.unidades * 3, 0)) * 100) < 50
        OR COALESCE(ch.chamados_abertos, 0) >= 4
        OR COALESCE(e.itens_vinculados, 0) = 0
        THEN 'critico'
      ELSE 'parcial'
    END AS nivel,
    pc.unidades,
    COALESCE(e.itens_vinculados, 0)  AS itens_vinculados,
    COALESCE(e.quantidade_total, 0)  AS quantidade_total,
    COALESCE(e.valor_estimado, 0)    AS valor_estimado,
    COALESCE(
      ROUND((pc.flags_cobertura::NUMERIC / NULLIF(pc.unidades * 3, 0)) * 100)::INT,
      0
    )                                AS cobertura,
    COALESCE(ch.chamados_abertos, 0) AS chamados_abertos,
    pc.possui_derso
  FROM por_comarca pc
  LEFT JOIN equipamentos e  ON e.comarca_id  = pc.comarca_id
  LEFT JOIN chamados_ag  ch ON ch.comarca_id = pc.comarca_id;
$$;

GRANT EXECUTE ON FUNCTION public.mapa_comarcas_resumo() TO authenticated;
