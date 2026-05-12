import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export type UnidadePredial = {
  id: string;
  nome: string;
  comarca_id: string | null;
  comarca_nome: string;
  endereco: string;
  telefone: string;
  responsavel_local: string;
  responsavel_substituto: string;
  possui_derso: boolean;
  controle_acesso: boolean;
  vigilancia_eletronica: boolean;
  observacoes: string;
  lat?: number | null;
  lng?: number | null;
};

const KEY = ["unidades"];

const mapRow = (r: any): UnidadePredial => ({
  id: r.id,
  nome: r.nome ?? "",
  comarca_id: r.comarca_id ?? null,
  comarca_nome: (r.comarcas as any)?.nome ?? "",
  endereco: r.endereco ?? "",
  telefone: r.telefone ?? "",
  responsavel_local: r.responsavel_local ?? "",
  responsavel_substituto: r.responsavel_substituto ?? "",
  possui_derso: !!r.possui_derso,
  controle_acesso: !!r.controle_acesso,
  vigilancia_eletronica: !!r.vigilancia_eletronica,
  observacoes: r.observacoes ?? "",
  lat: r.lat ?? null,
  lng: r.lng ?? null,
});

export function useUnidadesMock(): UnidadePredial[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("*, comarcas(nome)")
        .order("nome");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

export async function addUnidade(u: Omit<UnidadePredial, "id" | "comarca_nome">) {
  const { comarca_id, ...rest } = u;
  const { error } = await supabase.from("unidades").insert({ ...rest, comarca_id } as any);
  if (error) throw error;
  invalidate();
}
export async function updateUnidade(id: string, u: Omit<UnidadePredial, "id" | "comarca_nome">) {
  const { comarca_id, ...rest } = u;
  const { error } = await supabase.from("unidades").update({ ...rest, comarca_id } as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeUnidade(id: string) {
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
