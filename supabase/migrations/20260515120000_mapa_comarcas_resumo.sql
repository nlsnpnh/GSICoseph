-- Resumo agregado por comarca para o mapa institucional.
-- Usa SECURITY DEFINER para ignorar o RLS por linha — expõe apenas métricas
-- agregadas (sem dados sensíveis individuais), permitindo que operadores
-- também vejam o nível real de segurança de todas as comarcas no mapa.

CREATE OR REPLACE FUNCTION public.mapa_comarcas_resumo()
RETURNS TABLE (
  comarca_id          UUID,
  nome                TEXT,
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  nivel               TEXT,
  unidades            INT,
  itens_vinculados    INT,
  quantidade_total    INT,
  valor_estimado      NUMERIC,
  cobertura           INT,
  ocorrencias_abertas INT,
  possui_derso        BOOLEAN
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
  ocorrencias_ag AS (
    SELECT u.comarca_id,
           COUNT(*)::INT AS ocorrencias_abertas
    FROM public.ocorrencias o
    JOIN public.unidades u ON u.id = o.unidade_id
    WHERE o.status IN ('Aberto', 'Em andamento', 'Aguardando peça')
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
        AND COALESCE(o.ocorrencias_abertas, 0) <= 1
        THEN 'adequado'
      WHEN ROUND((pc.flags_cobertura::NUMERIC / NULLIF(pc.unidades * 3, 0)) * 100) < 50
        OR COALESCE(o.ocorrencias_abertas, 0) >= 4
        OR COALESCE(e.itens_vinculados, 0) = 0
        THEN 'critico'
      ELSE 'parcial'
    END AS nivel,
    pc.unidades,
    COALESCE(e.itens_vinculados, 0)    AS itens_vinculados,
    COALESCE(e.quantidade_total, 0)    AS quantidade_total,
    COALESCE(e.valor_estimado, 0)      AS valor_estimado,
    COALESCE(
      ROUND((pc.flags_cobertura::NUMERIC / NULLIF(pc.unidades * 3, 0)) * 100)::INT,
      0
    )                                  AS cobertura,
    COALESCE(o.ocorrencias_abertas, 0) AS ocorrencias_abertas,
    pc.possui_derso
  FROM por_comarca pc
  LEFT JOIN equipamentos    e ON e.comarca_id = pc.comarca_id
  LEFT JOIN ocorrencias_ag  o ON o.comarca_id = pc.comarca_id;
$$;

GRANT EXECUTE ON FUNCTION public.mapa_comarcas_resumo() TO authenticated;


-- Pontos das unidades prediais (apenas coordenadas + nome + comarca) para
-- exibir os pins do mapa a qualquer usuário autenticado, sem expor dados
-- sensíveis como endereço, telefone ou responsáveis.
CREATE OR REPLACE FUNCTION public.mapa_unidades_pontos()
RETURNS TABLE (
  id         UUID,
  nome       TEXT,
  comarca_id UUID,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, comarca_id, lat, lng
  FROM public.unidades
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.mapa_unidades_pontos() TO authenticated;
