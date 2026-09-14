-- =====================================================================
-- Trilha de auditoria
--
-- Até aqui o sistema guardava só `created_at`/`updated_at` e, em algumas
-- tabelas, quem criou o registro. Não havia como reconstituir quem alterou o
-- quê e quando — nem o valor que existia antes. Para um sistema de segurança
-- institucional, isso é pressuposto de qualquer apuração.
--
-- Esta migration:
--   1. cria `auditoria`, que só aceita INSERT e só é lida por admin;
--   2. liga um trigger genérico em TODAS as tabelas de `public`;
--   3. grava um RETRATO de cada registro existente, ponto de partida da
--      reconstituição (o histórico anterior à ativação não existe);
--   4. cria as funções que as edge functions usam para dizer QUEM agiu —
--      com a service role, `auth.uid()` fica nulo dentro do trigger.
--
-- Roda numa transação só: ou tudo entra, ou nada. Os triggers e o retrato são
-- criados juntos, então nenhuma escrita concorrente cai no intervalo entre o
-- retrato e o início do registro.
--
-- Depois de aplicar, publique as edge functions `admin-delete-user` e
-- `bootstrap-admin` atualizadas. Sem elas o sistema continua funcionando, mas a
-- exclusão de usuário fica registrada sem autor.
-- =====================================================================

BEGIN;

-- ── 1. A tabela ─────────────────────────────────────────────────────
CREATE TABLE public.auditoria (
  id               BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ocorrido_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  tabela           TEXT        NOT NULL,
  operacao         TEXT        NOT NULL
                   CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE', 'RETRATO')),
  -- Texto, não UUID: `boletim_itens_catalogo` tem chave numérica.
  registro_id      TEXT,
  -- Nome legível do registro no momento do fato. Depois de uma exclusão, é o
  -- único jeito de a listagem dizer o que foi apagado sem abrir o JSON.
  registro_rotulo  TEXT,
  -- Sem FK para auth.users de propósito: excluir o usuário não pode apagar
  -- (nem anular) a autoria do que ele fez. Nome e papel são copiados pelo
  -- mesmo motivo.
  usuario_id       UUID,
  usuario_nome     TEXT,
  usuario_papel    TEXT,
  origem           TEXT        NOT NULL
                   CHECK (origem IN ('app', 'edge_function', 'autenticacao', 'banco', 'sistema')),
  antes            JSONB,
  depois           JSONB,
  campos_alterados TEXT[]      NOT NULL DEFAULT '{}',
  -- Agrupa o que mudou na mesma operação (ex.: excluir usuário apaga papéis e
  -- perfil de uma vez).
  transacao        BIGINT      NOT NULL DEFAULT txid_current()
);

CREATE INDEX idx_auditoria_ocorrido ON public.auditoria (ocorrido_em DESC, id DESC);
CREATE INDEX idx_auditoria_registro ON public.auditoria (tabela, registro_id, id);
CREATE INDEX idx_auditoria_usuario  ON public.auditoria (usuario_id, ocorrido_em DESC);

COMMENT ON TABLE public.auditoria IS
  'Trilha de auditoria. Só INSERT, feito pelo trigger registrar_auditoria(). Leitura restrita a admin.';

-- ── 2. Imutabilidade ────────────────────────────────────────────────
-- Três camadas, porque cada uma sozinha tem furo:
--   a) RLS sem policy de escrita — mas a service_role ignora RLS;
--   b) privilégios revogados — mas o dono da tabela os tem de volta;
--   c) trigger que recusa UPDATE, DELETE e TRUNCATE — vale até para a
--      service_role. Só quem pode desligar trigger (o dono do projeto, no SQL
--      Editor) passa daqui, e isso nenhuma trilha dentro do banco impede.
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria: select admin" ON public.auditoria
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.auditoria FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.auditoria TO authenticated, service_role;

CREATE FUNCTION public.auditoria_imutavel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'A trilha de auditoria não pode ser alterada nem apagada.'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER auditoria_sem_alteracao
  BEFORE UPDATE OR DELETE ON public.auditoria
  FOR EACH ROW EXECUTE FUNCTION public.auditoria_imutavel();

CREATE TRIGGER auditoria_sem_truncate
  BEFORE TRUNCATE ON public.auditoria
  FOR EACH STATEMENT EXECUTE FUNCTION public.auditoria_imutavel();

-- ── 3. Rótulo legível de um registro ────────────────────────────────
-- Separado do trigger porque o retrato inicial usa a mesma regra.
CREATE FUNCTION public.auditoria_rotulo(p_tabela TEXT, p_linha JSONB)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v TEXT;
BEGIN
  CASE p_tabela
    WHEN 'chamados' THEN
      v := concat_ws(' — ', 'Chamado ' || (p_linha->>'numero'), p_linha->>'assunto');
    WHEN 'chamado_eventos' THEN
      v := concat_ws(' · ', p_linha->>'tipo', left(p_linha->>'mensagem', 60));
    WHEN 'chamado_anexos' THEN
      v := p_linha->>'nome_arquivo';
    WHEN 'contratos' THEN
      v := concat_ws(' — ', p_linha->>'numero', p_linha->>'empresa');
    WHEN 'portoes' THEN
      v := p_linha->>'identificacao';
    WHEN 'profiles' THEN
      v := COALESCE(p_linha->>'nome_completo', p_linha->>'email');
    WHEN 'user_roles' THEN
      -- Papel "de quem": o registro só tem o user_id do alvo.
      SELECT concat_ws(' de ', p_linha->>'role', COALESCE(p.nome_completo, p.email))
        INTO v
        FROM (SELECT 1) AS um
        LEFT JOIN public.profiles p ON p.user_id = (p_linha->>'user_id')::uuid;
    WHEN 'equipamentos_catalogo' THEN
      v := concat_ws(' — ', 'Item ' || (p_linha->>'item_num'), p_linha->>'descricao');
    WHEN 'boletim_itens_catalogo' THEN
      v := concat_ws(' — ', 'Item ' || (p_linha->>'item_number'), p_linha->>'descricao');
    WHEN 'boletim_mensal' THEN
      SELECT concat_ws(' · ',
               'Item ' || (p_linha->>'item_number'),
               lpad(p_linha->>'mes', 2, '0') || '/' || (p_linha->>'ano'),
               u.nome)
        INTO v
        FROM (SELECT 1) AS um
        LEFT JOIN public.unidades u ON u.id = (p_linha->>'unidade_id')::uuid;
    WHEN 'unidade_equipamentos' THEN
      SELECT concat_ws(' em ', e.descricao, u.nome)
        INTO v
        FROM (SELECT 1) AS um
        LEFT JOIN public.equipamentos_catalogo e ON e.id = (p_linha->>'equipamento_id')::uuid
        LEFT JOIN public.unidades u              ON u.id = (p_linha->>'unidade_id')::uuid;
    WHEN 'planejamento_acoes', 'orcamento_acoes', 'orcamento_superavit' THEN
      v := p_linha->>'acao';
    ELSE
      v := NULL;
  END CASE;

  RETURN NULLIF(COALESCE(
    NULLIF(v, ''),
    p_linha->>'nome',
    p_linha->>'descricao',
    p_linha->>'numero'
  ), '');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auditoria_rotulo(TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- ── 4. O trigger ────────────────────────────────────────────────────
-- TG_ARGV[0] é o nome da coluna-chave da tabela (quase sempre `id`).
CREATE FUNCTION public.registrar_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Colunas que mudam sozinhas, por trigger. Um UPDATE que só mexe nelas não
  -- é ato de ninguém: sem este filtro, cada mensagem num chamado duplicaria o
  -- log com uma "alteração" de ultima_movimentacao.
  v_ignorar  TEXT[] := ARRAY['updated_at', 'ultima_movimentacao'];
  v_chave    TEXT   := COALESCE(TG_ARGV[0], 'id');
  v_antes    JSONB;
  v_depois   JSONB;
  v_linha    JSONB;
  v_campos   TEXT[] := '{}';
  v_claims   JSONB;
  v_papel_jwt TEXT;
  v_origem   TEXT;
  v_usuario  UUID;
  v_nome     TEXT;
  v_papeis   TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN v_antes  := to_jsonb(OLD); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN v_depois := to_jsonb(NEW); END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(array_agg(k ORDER BY k), '{}')
      INTO v_campos
      FROM jsonb_object_keys(v_depois) AS k
     WHERE k <> ALL (v_ignorar)
       AND (v_antes -> k) IS DISTINCT FROM (v_depois -> k);
    IF cardinality(v_campos) = 0 THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Quem está agindo. O PostgREST conecta como `authenticator` e publica o
  -- JWT em request.jwt.claims; o GoTrue conecta como `supabase_auth_admin`
  -- (cadastro de acesso); o SQL Editor, como o dono do banco.
  v_claims    := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;
  v_papel_jwt := v_claims ->> 'role';
  v_origem := CASE
    WHEN v_papel_jwt = 'service_role'          THEN 'edge_function'
    WHEN v_papel_jwt IS NOT NULL               THEN 'app'
    WHEN session_user = 'supabase_auth_admin'  THEN 'autenticacao'
    ELSE 'banco'
  END;

  v_usuario := auth.uid();
  IF v_usuario IS NULL THEN
    -- Edge functions declaram o autor por set_config (ver funções abaixo).
    v_usuario := NULLIF(current_setting('auditoria.ator', true), '')::uuid;
  END IF;
  IF v_usuario IS NULL AND v_origem = 'autenticacao' AND TG_TABLE_NAME = 'profiles' THEN
    -- Perfil criado no cadastro: o autor é o próprio usuário que se cadastrou.
    v_usuario := (v_depois ->> 'user_id')::uuid;
  END IF;

  IF v_usuario IS NOT NULL THEN
    SELECT COALESCE(p.nome_completo, p.email) INTO v_nome
      FROM public.profiles p WHERE p.user_id = v_usuario;
    SELECT string_agg(r.role::text, ', ' ORDER BY r.role) INTO v_papeis
      FROM public.user_roles r WHERE r.user_id = v_usuario;
  END IF;

  v_linha := COALESCE(v_depois, v_antes);

  INSERT INTO public.auditoria (
    tabela, operacao, registro_id, registro_rotulo,
    usuario_id, usuario_nome, usuario_papel, origem,
    antes, depois, campos_alterados
  ) VALUES (
    TG_TABLE_NAME, TG_OP, v_linha ->> v_chave, public.auditoria_rotulo(TG_TABLE_NAME, v_linha),
    v_usuario, v_nome, v_papeis, v_origem,
    v_antes, v_depois, v_campos
  );

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_auditoria() FROM PUBLIC, anon, authenticated;

-- ── 5. Ligar a auditoria numa tabela ────────────────────────────────
-- Toda tabela nova precisa passar por aqui: `SELECT public.auditoria_ativar('x');`
-- A tela de auditoria avisa quando alguma ficou de fora.
CREATE FUNCTION public.auditoria_ativar(p_tabela TEXT, p_somente_exclusao BOOLEAN DEFAULT false)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_chave TEXT;
BEGIN
  SELECT a.attname INTO v_chave
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
   WHERE i.indrelid = format('public.%I', p_tabela)::regclass
     AND i.indisprimary
   LIMIT 1;

  EXECUTE format('DROP TRIGGER IF EXISTS auditoria_registro ON public.%I', p_tabela);
  EXECUTE format(
    'CREATE TRIGGER auditoria_registro AFTER %s ON public.%I '
    'FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria(%L)',
    CASE WHEN p_somente_exclusao THEN 'DELETE' ELSE 'INSERT OR UPDATE OR DELETE' END,
    p_tabela,
    COALESCE(v_chave, 'id')
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auditoria_ativar(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;

-- Tabelas de `public` sem o trigger. Alimenta o aviso da tela.
CREATE FUNCTION public.auditoria_tabelas_descobertas()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.relname::text
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname <> 'auditoria'
     AND public.has_role(auth.uid(), 'admin')
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger t
        WHERE t.tgrelid = c.oid AND t.tgname = 'auditoria_registro'
     )
   ORDER BY 1;
$$;

REVOKE EXECUTE ON FUNCTION public.auditoria_tabelas_descobertas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auditoria_tabelas_descobertas() TO authenticated;

-- ── 6. Ativação e retrato inicial ───────────────────────────────────
-- Varre as tabelas em vez de listá-las: `equipamentos_catalogo`, por exemplo,
-- existe no banco sem migration no repositório, e uma lista escrita à mão a
-- deixaria de fora.
DO $$
DECLARE
  t       RECORD;
  v_chave TEXT;
BEGIN
  FOR t IN
    SELECT c.relname AS nome
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> 'auditoria'
     ORDER BY c.relname
  LOOP
    -- chamado_eventos já é histórico que só cresce: auditar o INSERT seria
    -- duplicar a linha do tempo. Mas a exclusão de um chamado leva os eventos
    -- junto, por cascade — e isso precisa deixar rastro.
    PERFORM public.auditoria_ativar(t.nome, t.nome = 'chamado_eventos');

    SELECT a.attname INTO v_chave
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indrelid = format('public.%I', t.nome)::regclass AND i.indisprimary
     LIMIT 1;

    EXECUTE format(
      'INSERT INTO public.auditoria (tabela, operacao, registro_id, registro_rotulo, origem, depois) '
      'SELECT %L, ''RETRATO'', to_jsonb(r) ->> %L, public.auditoria_rotulo(%L, to_jsonb(r)), ''sistema'', to_jsonb(r) '
      'FROM public.%I r',
      t.nome, COALESCE(v_chave, 'id'), t.nome, t.nome
    );
  END LOOP;
END $$;

-- ── 7. Autoria nas edge functions ───────────────────────────────────
-- A service role não carrega usuário, e cada chamada do supabase-js é uma
-- transação separada — então o autor precisa ser declarado DENTRO da mesma
-- transação que faz a escrita. Estas funções fazem as duas coisas juntas.

-- Exclusão de usuário: apaga papéis e perfil registrando quem excluiu. Os
-- papéis saem antes do perfil para o rótulo ainda achar o nome do alvo.
CREATE FUNCTION public.admin_excluir_usuario(p_alvo UUID, p_ator UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('auditoria.ator', p_ator::text, true);
  DELETE FROM public.user_roles WHERE user_id = p_alvo;
  DELETE FROM public.profiles   WHERE user_id = p_alvo;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_excluir_usuario(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_excluir_usuario(UUID, UUID) TO service_role;

-- Primeiro admin. A checagem "já existe admin?" passa a acontecer na mesma
-- transação do INSERT, com a tabela travada — antes, dois cadastros
-- simultâneos podiam ambos passar pela checagem e virar admin.
CREATE FUNCTION public.bootstrap_promover_admin(p_usuario UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  PERFORM set_config('auditoria.ator', p_usuario::text, true);
  INSERT INTO public.user_roles (user_id, role) VALUES (p_usuario, 'admin');
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_promover_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_promover_admin(UUID) TO service_role;

COMMIT;
