import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { addDiasISO } from "@/lib/dates";
import {
  inicioDoDiaRondonia, termoDeBusca,
  type EntradaAuditoria, type Operacao, type Origem, type ResolverNome,
} from "@/lib/auditoria";
import { useUnidades } from "./unidades";
import { useContratos } from "./contratos";
import { useEquipamentosCatalogo } from "./equipamentos";
import { useComarcas } from "./api";

// =====================================================================
// Trilha de auditoria (public.auditoria).
//
// Só leitura, e só admin: quem escreve é o trigger do banco. A tabela só
// cresce, então a paginação é no servidor — nunca "baixa tudo e filtra".
// =====================================================================

export const TAMANHO_PAGINA_AUDITORIA = 50;

// O PostgREST devolve no máximo 1000 linhas por requisição.
const LOTE_EXPORTACAO = 1000;
const LIMITE_EXPORTACAO = 20_000;

export type FiltrosAuditoria = {
  /** YYYY-MM-DD ou "" */
  de: string;
  ate: string;
  /** "" = todas */
  tabela: string;
  usuarioId: string;
  /** "" = todas as mudanças, sem o retrato inicial */
  operacao: Operacao | "";
  busca: string;
};

export const FILTROS_VAZIOS: FiltrosAuditoria = {
  de: "", ate: "", tabela: "", usuarioId: "", operacao: "", busca: "",
};

const mapRow = (r: Tables<"auditoria">): EntradaAuditoria => ({
  id: r.id,
  ocorrido_em: r.ocorrido_em,
  tabela: r.tabela,
  operacao: r.operacao as Operacao,
  registro_id: r.registro_id,
  registro_rotulo: r.registro_rotulo,
  usuario_id: r.usuario_id,
  usuario_nome: r.usuario_nome,
  usuario_papel: r.usuario_papel,
  origem: r.origem as Origem,
  antes: (r.antes as Record<string, unknown> | null) ?? null,
  depois: (r.depois as Record<string, unknown> | null) ?? null,
  campos_alterados: r.campos_alterados ?? [],
});

function consultar(f: FiltrosAuditoria, contar: boolean) {
  let q = supabase
    .from("auditoria")
    .select("*", contar ? { count: "exact" } : undefined)
    .order("id", { ascending: false });

  // O retrato é o ponto de partida, não um ato de alguém: fica fora da
  // listagem até ser pedido, senão soterra as mudanças reais.
  q = f.operacao ? q.eq("operacao", f.operacao) : q.neq("operacao", "RETRATO");

  // "Dia" é o de Rondônia: a janela vai da meia-noite de `de` até a
  // meia-noite do dia seguinte a `ate`.
  if (f.de) q = q.gte("ocorrido_em", inicioDoDiaRondonia(f.de));
  if (f.ate) q = q.lt("ocorrido_em", inicioDoDiaRondonia(addDiasISO(f.ate, 1)));
  if (f.tabela) q = q.eq("tabela", f.tabela);
  if (f.usuarioId) q = q.eq("usuario_id", f.usuarioId);

  const termo = termoDeBusca(f.busca);
  if (termo) {
    q = q.or(
      `registro_rotulo.ilike.*${termo}*,usuario_nome.ilike.*${termo}*,registro_id.eq.${termo}`,
    );
  }
  return q;
}

export function useAuditoria(f: FiltrosAuditoria, pagina: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["auditoria", f, pagina],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const inicio = (pagina - 1) * TAMANHO_PAGINA_AUDITORIA;
      const { data, error, count } = await consultar(f, true)
        .range(inicio, inicio + TAMANHO_PAGINA_AUDITORIA - 1);
      if (error) throw error;
      return { entradas: (data ?? []).map(mapRow), total: count ?? 0 };
    },
  });
  return {
    entradas: data?.entradas ?? [],
    total: data?.total ?? 0,
    carregando: isLoading,
    erro: error as Error | null,
  };
}

/** Tudo que aconteceu com um registro, do retrato inicial até hoje. */
export function useHistoricoRegistro(tabela: string | undefined, registroId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ["auditoria-registro", tabela, registroId],
    enabled: Boolean(tabela && registroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .eq("tabela", tabela!)
        .eq("registro_id", registroId!)
        .order("id", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return { entradas: data ?? [], carregando: isLoading };
}

/** Tabelas de `public` sem o trigger — mudanças nelas não entram na trilha. */
export function useTabelasDescobertas(): string[] {
  const { data } = useQuery({
    queryKey: ["auditoria-descobertas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("auditoria_tabelas_descobertas");
      if (error) throw error;
      return (data ?? []) as string[];
    },
  });
  return data ?? [];
}

/**
 * Todas as entradas que passam no filtro, em lotes. Devolve também se bateu
 * no teto — a planilha precisa avisar que não está completa.
 */
export async function buscarParaExportar(f: FiltrosAuditoria) {
  const entradas: EntradaAuditoria[] = [];
  for (let inicio = 0; inicio < LIMITE_EXPORTACAO; inicio += LOTE_EXPORTACAO) {
    const { data, error } = await consultar(f, false).range(inicio, inicio + LOTE_EXPORTACAO - 1);
    if (error) throw error;
    entradas.push(...(data ?? []).map(mapRow));
    if (!data || data.length < LOTE_EXPORTACAO) return { entradas, truncado: false };
  }
  return { entradas, truncado: true };
}

export type UsuarioAuditoria = { id: string; nome: string };

export function useUsuariosAuditoria(): UsuarioAuditoria[] {
  const { data } = useQuery({
    queryKey: ["auditoria-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome_completo, email");
      if (error) throw error;
      return (data ?? [])
        .map((p) => ({ id: p.user_id, nome: p.nome_completo || p.email || p.user_id }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },
  });
  return data ?? [];
}

/**
 * Traduz os ids que aparecem nos registros (unidade, comarca, contrato,
 * equipamento, usuário) para nomes. Id sem correspondência — registro já
 * excluído, por exemplo — fica encurtado, não some.
 */
export function useResolverNomes(): ResolverNome {
  const unidades = useUnidades();
  const { data: comarcas = [] } = useComarcas();
  const contratos = useContratos();
  const equipamentos = useEquipamentosCatalogo();
  const usuarios = useUsuariosAuditoria();

  return useMemo(() => {
    const nomes = new Map<string, string>();
    unidades.forEach((u) => nomes.set(u.id, u.nome));
    comarcas.forEach((c) => nomes.set(c.id, c.nome));
    contratos.forEach((c) => nomes.set(c.id, `Contrato ${c.numero}`));
    equipamentos.forEach((e) => nomes.set(e.id, e.descricao));
    usuarios.forEach((u) => nomes.set(u.id, u.nome));
    return (id: string) => nomes.get(id);
  }, [unidades, comarcas, contratos, equipamentos, usuarios]);
}
