-- Operador passa a ver (somente leitura) os contratos que atendem a sua unidade.
-- Antes a policy de SELECT liberava apenas admin/gestor ("operador não acessa"),
-- então o Painel Executivo do operador exibia 0 contratos vigentes.
DROP POLICY IF EXISTS "contratos: select" ON public.contratos;

CREATE POLICY "contratos: select" ON public.contratos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'gestor') OR
    public.get_user_unidade_nome() = ANY (unidades_atendidas)
  );
