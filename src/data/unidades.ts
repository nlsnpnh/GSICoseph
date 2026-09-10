// Camada de acesso a dados: tipos gerados do Supabase (types.ts) incompletos para
// varias tabelas/joins, entao o uso de `any` aqui e intencional. Fix definitivo:
// regenerar types.ts via `supabase gen types`.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

/**
 * Indicador de seguranca da unidade. `null` significa "nao informado" — nao
 * e o mesmo que `false` ("nao possui"), e o mapa trata os dois diferente.
 */
export type IndicadorSeguranca = boolean | null;

export type UnidadePredial = {
  id: string;
  nome: string;
  comarca_id: string | null;
  comarca_nome: string;
  endereco: string;
  telefone: string;
  responsavel_local: string;
  responsavel_substituto: string;
  possui_derso: IndicadorSeguranca;
  controle_acesso: IndicadorSeguranca;
  vigilancia_eletronica: IndicadorSeguranca;
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
  // `?? null` e nao `!!`: o coerce para booleano apagaria o "nao informado".
  possui_derso: r.possui_derso ?? null,
  controle_acesso: r.controle_acesso ?? null,
  vigilancia_eletronica: r.vigilancia_eletronica ?? null,
  observacoes: r.observacoes ?? "",
  lat: r.lat ?? null,
  lng: r.lng ?? null,
});

export function useUnidades(): UnidadePredial[] {
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
