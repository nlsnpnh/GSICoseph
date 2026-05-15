import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Criticidade } from "@/data/mockDashboard";

export type MapaComarcaResumo = {
  comarcaId: string;
  nome: string;
  lat: number;
  lng: number;
  nivel: Criticidade;
  unidades: number;
  itensVinculados: number;
  quantidadeTotal: number;
  valorEstimado: number;
  cobertura: number;
  ocorrenciasAbertas: number;
  possuiDerso: boolean;
};

export type MapaUnidadePonto = {
  id: string;
  nome: string;
  comarcaId: string | null;
  lat: number;
  lng: number;
};

export function useMapaComarcasResumo(): MapaComarcaResumo[] {
  const { data } = useQuery({
    queryKey: ["mapa_comarcas_resumo"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("mapa_comarcas_resumo" as any);
      if (error) throw error;
      return (data ?? []).map((r: any): MapaComarcaResumo => ({
        comarcaId: r.comarca_id,
        nome: r.nome,
        lat: Number(r.lat),
        lng: Number(r.lng),
        nivel: r.nivel as Criticidade,
        unidades: r.unidades ?? 0,
        itensVinculados: r.itens_vinculados ?? 0,
        quantidadeTotal: r.quantidade_total ?? 0,
        valorEstimado: Number(r.valor_estimado ?? 0),
        cobertura: r.cobertura ?? 0,
        ocorrenciasAbertas: r.ocorrencias_abertas ?? 0,
        possuiDerso: !!r.possui_derso,
      }));
    },
  });
  return data ?? [];
}

export function useMapaUnidadesPontos(): MapaUnidadePonto[] {
  const { data } = useQuery({
    queryKey: ["mapa_unidades_pontos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("mapa_unidades_pontos" as any);
      if (error) throw error;
      return (data ?? []).map((r: any): MapaUnidadePonto => ({
        id: r.id,
        nome: r.nome,
        comarcaId: r.comarca_id ?? null,
        lat: Number(r.lat),
        lng: Number(r.lng),
      }));
    },
  });
  return data ?? [];
}
