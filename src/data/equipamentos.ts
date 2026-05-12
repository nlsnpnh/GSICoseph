import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export type EquipamentoCatalogo = {
  id: string;
  item_num: number;
  descricao: string;
  unidade_medida: string;
  qtd_contrato: number;
  valor_unitario: number;
  valor_total: number;
  contrato_numero: string;
};

export type UnidadeEquipamento = {
  id: string;
  unidade_id: string;
  equipamento_id: string;
  quantidade: number;
  observacoes: string;
  item_num: number;
  descricao: string;
  unidade_medida: string;
  valor_unitario: number;
  unidade_nome: string;
  comarca_nome: string;
};

const KEY_CAT = ["equipamentos_catalogo"];
const KEY_DIST = ["unidade_equipamentos"];

export function useEquipamentosCatalogo(): EquipamentoCatalogo[] {
  const { data } = useQuery({
    queryKey: KEY_CAT,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos_catalogo")
        .select("*")
        .order("item_num");
      if (error) throw error;
      return (data ?? []).map((r: any): EquipamentoCatalogo => ({
        id: r.id,
        item_num: r.item_num,
        descricao: r.descricao ?? "",
        unidade_medida: r.unidade_medida ?? "",
        qtd_contrato: r.qtd_contrato ?? 0,
        valor_unitario: Number(r.valor_unitario ?? 0),
        valor_total: Number(r.valor_total ?? 0),
        contrato_numero: r.contrato_numero ?? "",
      }));
    },
  });
  return data ?? [];
}

export function useUnidadeEquipamentos(): UnidadeEquipamento[] {
  const { data } = useQuery({
    queryKey: KEY_DIST,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidade_equipamentos")
        .select(`
          id, unidade_id, equipamento_id, quantidade, observacoes,
          equipamentos_catalogo (item_num, descricao, unidade_medida, valor_unitario),
          unidades (nome, comarcas (nome))
        `)
        .order("unidade_id");
      if (error) throw error;
      return (data ?? []).map((r: any): UnidadeEquipamento => ({
        id: r.id,
        unidade_id: r.unidade_id,
        equipamento_id: r.equipamento_id,
        quantidade: r.quantidade,
        observacoes: r.observacoes ?? "",
        item_num: r.equipamentos_catalogo?.item_num ?? 0,
        descricao: r.equipamentos_catalogo?.descricao ?? "",
        unidade_medida: r.equipamentos_catalogo?.unidade_medida ?? "",
        valor_unitario: Number(r.equipamentos_catalogo?.valor_unitario ?? 0),
        unidade_nome: r.unidades?.nome ?? "",
        comarca_nome: r.unidades?.comarcas?.nome ?? "",
      }));
    },
  });
  return data ?? [];
}

const invalidateDist = () => queryClient.invalidateQueries({ queryKey: KEY_DIST });

export async function addUnidadeEquipamento(d: {
  unidade_id: string;
  equipamento_id: string;
  quantidade: number;
  observacoes?: string;
}) {
  const { error } = await supabase.from("unidade_equipamentos").insert({
    unidade_id: d.unidade_id,
    equipamento_id: d.equipamento_id,
    quantidade: d.quantidade,
    observacoes: d.observacoes ?? "",
  });
  if (error) throw error;
  invalidateDist();
}

export async function updateUnidadeEquipamento(id: string, d: {
  quantidade: number;
  observacoes?: string;
}) {
  const { error } = await supabase
    .from("unidade_equipamentos")
    .update({ quantidade: d.quantidade, observacoes: d.observacoes ?? "" })
    .eq("id", id);
  if (error) throw error;
  invalidateDist();
}

export async function removeUnidadeEquipamento(id: string) {
  const { error } = await supabase.from("unidade_equipamentos").delete().eq("id", id);
  if (error) throw error;
  invalidateDist();
}
