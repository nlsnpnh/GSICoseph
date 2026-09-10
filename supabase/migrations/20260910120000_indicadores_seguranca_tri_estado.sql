-- =====================================================================
-- Indicadores de segurança da unidade: booleano -> tri-estado.
--
-- `possui_derso`, `controle_acesso` e `vigilancia_eletronica` eram
-- `BOOLEAN NOT NULL DEFAULT false`. Com isso, "esta unidade não tem CFTV" e
-- "ninguém respondeu se tem CFTV" ficavam gravados exatamente igual — e a
-- função do mapa lia os dois como cobertura zero, pintando de vermelho
-- comarcas cujo cadastro apenas nunca foi preenchido.
--
-- Passam a aceitar NULL = "não informado". A cobertura só considera as
-- unidades que responderam; comarca sem nenhuma resposta vira 'sem_dados'
-- (cinza) em vez de 'critico' (vermelho).
-- =====================================================================

-- ── 1. Abre espaço para o "não informado" ───────────────────────────
ALTER TABLE public.unidades
  ALTER COLUMN possui_derso          DROP NOT NULL,
  ALTER COLUMN possui_derso          DROP DEFAULT,
  ALTER COLUMN controle_acesso       DROP NOT NULL,
  ALTER COLUMN controle_acesso       DROP DEFAULT,
  ALTER COLUMN vigilancia_eletronica DROP NOT NULL,
  ALTER COLUMN vigilancia_eletronica DROP DEFAULT;

-- ── 2. Converte só o que nunca foi respondido ───────────────────────
-- Unidade com os TRÊS desmarcados é a assinatura de quem nunca abriu a seção
-- Segurança do cadastro — no banco atual a distribuição é bimodal, sem
-- meio-termo: ou a unidade tem os três respondidos, ou nenhum.
-- Unidade com 1 ou 2 marcados foi revisada por alguém, então ali o `false`
-- é resposta legítima e permanece.
UPDATE public.unidades
   SET possui_derso = NULL, controle_acesso = NULL, vigilancia_eletronica = NULL
 WHERE possui_derso = false
   AND controle_acesso = false
   AND vigilancia_eletronica = false;

-- ── 3. Mapa: ignora quem não respondeu ──────────────────────────────
-- Antes, `flags_cobertura` somava booleanos sobre TODAS as unidades e dividia
-- por `unidades * 3`. Agora o denominador conta apenas as unidades que
-- responderam, e uma comarca sem nenhuma resposta não tem cobertura a exibir.
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
           u.possui_derso, u.controle_acesso, u.vigilancia_eletronica,
           -- Respondida = pelo menos um dos três saiu do "não informado".
           (u.possui_derso IS NOT NULL
             OR u.controle_acesso IS NOT NULL
             OR u.vigilancia_eletronica IS NOT NULL) AS respondida
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
      COUNT(DISTINCT uv.id) FILTER (WHERE uv.respondida)::INT AS respondidas,
      BOOL_OR(COALESCE(uv.possui_derso, false)) AS possui_derso,
      -- NULL não conta nem no numerador nem no denominador.
      COALESCE(SUM(
        COALESCE(uv.possui_derso::INT, 0)
        + COALESCE(uv.controle_acesso::INT, 0)
        + COALESCE(uv.vigilancia_eletronica::INT, 0)
      ), 0)::INT AS flags_cobertura
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
    SELECT u.comarca_id,
           COUNT(*)::INT AS chamados_abertos
    FROM public.chamados ch
    JOIN public.unidades u ON u.id = ch.unidade_id
    WHERE ch.status NOT IN ('Fechado', 'Cancelado')
    GROUP BY u.comarca_id
  ),
  calculado AS (
    SELECT pc.*,
           COALESCE(e.itens_vinculados, 0)  AS itens_vinculados,
           COALESCE(e.quantidade_total, 0)  AS quantidade_total,
           COALESCE(e.valor_estimado, 0)    AS valor_estimado,
           COALESCE(ch.chamados_abertos, 0) AS chamados_abertos,
           CASE WHEN pc.respondidas = 0 THEN NULL
                ELSE ROUND((pc.flags_cobertura::NUMERIC / (pc.respondidas * 3)) * 100)::INT
           END AS cobertura
    FROM por_comarca pc
    LEFT JOIN equipamentos e  ON e.comarca_id  = pc.comarca_id
    LEFT JOIN chamados_ag  ch ON ch.comarca_id = pc.comarca_id
  )
  SELECT
    c.comarca_id,
    c.nome,
    c.lat,
    c.lng,
    CASE
      -- Sem unidade, ou com unidades mas nenhuma resposta: não há o que julgar.
      WHEN c.unidades = 0 OR c.cobertura IS NULL THEN 'sem_dados'
      WHEN c.cobertura >= 90
        AND c.itens_vinculados > 0
        AND c.chamados_abertos <= 1
        THEN 'adequado'
      WHEN c.cobertura < 50
        OR c.chamados_abertos >= 4
        OR c.itens_vinculados = 0
        THEN 'critico'
      ELSE 'parcial'
    END AS nivel,
    c.unidades,
    c.itens_vinculados,
    c.quantidade_total,
    c.valor_estimado,
    COALESCE(c.cobertura, 0) AS cobertura,
    c.chamados_abertos,
    c.possui_derso
  FROM calculado c;
$$;

GRANT EXECUTE ON FUNCTION public.mapa_comarcas_resumo() TO authenticated;
