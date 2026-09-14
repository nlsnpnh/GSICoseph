-- =====================================================================
-- Conferência da trilha de auditoria (migration 20260914120000).
--
-- Rode UM BLOCO POR VEZ no SQL Editor: ele mostra só o resultado do último
-- comando executado. Nada aqui altera dados — os testes de escrita rodam
-- dentro de BEGIN ... ROLLBACK.
-- =====================================================================


-- ── Bloco 1: cobertura ──────────────────────────────────────────────
-- Esperado: todas as linhas com auditada = true.
SELECT c.relname AS tabela,
       EXISTS (
         SELECT 1 FROM pg_trigger t
          WHERE t.tgrelid = c.oid AND t.tgname = 'auditoria_registro'
       ) AS auditada
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> 'auditoria'
 ORDER BY auditada, tabela;


-- ── Bloco 2: retrato inicial ────────────────────────────────────────
-- Esperado: uma linha por tabela, com a mesma contagem de registros dela.
SELECT tabela, count(*) AS registros
  FROM public.auditoria
 WHERE operacao = 'RETRATO'
 GROUP BY tabela
 ORDER BY tabela;


-- ── Bloco 3: inclusão, alteração e exclusão geram registro ─────────
-- Esperado: 3 linhas — INSERT, UPDATE com campos_alterados = {nome}, DELETE.
-- O UPDATE que só toca updated_at NÃO pode aparecer.
BEGIN;
  INSERT INTO public.comarcas (nome) VALUES ('__teste_auditoria__');
  UPDATE public.comarcas SET nome = '__teste_auditoria_2__' WHERE nome = '__teste_auditoria__';
  UPDATE public.comarcas SET updated_at = updated_at WHERE nome = '__teste_auditoria_2__';
  DELETE FROM public.comarcas WHERE nome = '__teste_auditoria_2__';

  SELECT operacao, registro_rotulo, campos_alterados, origem
    FROM public.auditoria
   WHERE transacao = txid_current()
   ORDER BY id;
ROLLBACK;


-- ── Bloco 4: usuário comum não lê a trilha ──────────────────────────
-- Simula um usuário autenticado sem papel de admin.
-- Esperado: 0.
BEGIN;
  SET LOCAL ROLE authenticated;
  SELECT set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}',
    true
  );
  SELECT count(*) AS visiveis FROM public.auditoria;
ROLLBACK;


-- ── Bloco 5: a trilha não se altera ─────────────────────────────────
-- Esperado: ERRO "A trilha de auditoria não pode ser alterada nem apagada."
BEGIN;
  UPDATE public.auditoria SET tabela = tabela
   WHERE id = (SELECT min(id) FROM public.auditoria);
ROLLBACK;


-- ── Bloco 6: nem apagar ─────────────────────────────────────────────
-- Esperado: o mesmo ERRO.
BEGIN;
  DELETE FROM public.auditoria
   WHERE id = (SELECT min(id) FROM public.auditoria);
ROLLBACK;
