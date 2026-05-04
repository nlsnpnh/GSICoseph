import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export const COMARCAS = [
  "Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal",
  "Rolim de Moura", "Jaru", "Guajará-Mirim", "Buritis", "Pimenta Bueno",
  "Ouro Preto do Oeste", "Machadinho do Oeste",
] as const;

export const TIPOS_UNIDADE = [
  "Fórum", "Sede Administrativa", "Anexo", "Depósito", "CEJUSC", "Juizado",
] as const;

export const CRITICIDADES = ["Baixo", "Médio", "Alto", "Crítico"] as const;
export type Criticidade = (typeof CRITICIDADES)[number];

export type UnidadePredial = {
  id: string;
  nome: string;
  comarca: string;
  endereco: string;
  telefone: string;
  responsavel_local: string;
  tipo: (typeof TIPOS_UNIDADE)[number];
  horario_funcionamento: string;
  possui_derso: boolean;
  controle_acesso: boolean;
  vigilancia_eletronica: boolean;
  criticidade: Criticidade;
  observacoes: string;
  imagem_url?: string;
  servidor_titular_id?: string | null;
  servidor_substituto_id?: string | null;
};

const KEY = ["unidades"];

const mapRow = (r: any): UnidadePredial => ({
  id: r.id,
  nome: r.nome ?? "",
  comarca: r.comarca ?? "",
  endereco: r.endereco ?? "",
  telefone: r.telefone ?? "",
  responsavel_local: r.responsavel_local ?? "",
  tipo: r.tipo,
  horario_funcionamento: r.horario_funcionamento ?? "",
  possui_derso: !!r.possui_derso,
  controle_acesso: !!r.controle_acesso,
  vigilancia_eletronica: !!r.vigilancia_eletronica,
  criticidade: r.criticidade,
  observacoes: r.observacoes ?? "",
  imagem_url: r.imagem_url ?? "",
  servidor_titular_id: r.servidor_titular_id ?? null,
  servidor_substituto_id: r.servidor_substituto_id ?? null,
});

export function useUnidadesMock(): UnidadePredial[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("nome");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

export async function addUnidade(u: Omit<UnidadePredial, "id">) {
  const { error } = await supabase.from("unidades").insert(u as any);
  if (error) throw error;
  invalidate();
}
export async function updateUnidade(id: string, u: Omit<UnidadePredial, "id">) {
  const { error } = await supabase.from("unidades").update(u as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeUnidade(id: string) {
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
