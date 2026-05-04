import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { EMPRESAS } from "./terceirizadosMock";

export const STATUS_CONTRATO = ["Vigente", "A vencer", "Vencido", "Encerrado", "Suspenso"] as const;
export type StatusContrato = (typeof STATUS_CONTRATO)[number];

export type Aditivo        = { numero: string; data: string; descricao: string };
export type Apostilamento  = { numero: string; data: string; descricao: string };

export type Contrato = {
  id: string;
  numero: string;
  empresa: (typeof EMPRESAS)[number];
  objeto: string;
  data_inicio: string;
  data_fim: string;
  valor_mensal: number;
  valor_total: number;
  unidades_atendidas: string[];
  fiscal: string;
  gestor: string;
  sla: string;
  aditivos: Aditivo[];
  apostilamentos: Apostilamento[];
  observacoes: string;
};

const KEY = ["contratos"];

const mapRow = (r: any): Contrato => ({
  id: r.id,
  numero: r.numero ?? "",
  empresa: r.empresa,
  objeto: r.objeto ?? "",
  data_inicio: r.data_inicio ?? "",
  data_fim: r.data_fim ?? "",
  valor_mensal: Number(r.valor_mensal ?? 0),
  valor_total: Number(r.valor_total ?? 0),
  unidades_atendidas: r.unidades_atendidas ?? [],
  fiscal: r.fiscal ?? "",
  gestor: r.gestor ?? "",
  sla: r.sla ?? "",
  aditivos: Array.isArray(r.aditivos) ? r.aditivos : [],
  apostilamentos: Array.isArray(r.apostilamentos) ? r.apostilamentos : [],
  observacoes: r.observacoes ?? "",
});

export function useContratosMock(): Contrato[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("contratos").select("*").order("numero");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

const toPayload = (d: Omit<Contrato, "id">) => ({
  ...d,
  data_inicio: d.data_inicio || null,
  data_fim: d.data_fim || null,
  aditivos: d.aditivos as any,
  apostilamentos: d.apostilamentos as any,
});

export async function addContrato(d: Omit<Contrato, "id">) {
  const { error } = await supabase.from("contratos").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateContrato(id: string, d: Omit<Contrato, "id">) {
  const { error } = await supabase.from("contratos").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeContrato(id: string) {
  const { error } = await supabase.from("contratos").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}

export function statusFromVigencia(data_fim: string): StatusContrato {
  if (!data_fim) return "Vigente";
  const today = new Date();
  const fim = new Date(data_fim + "T00:00:00");
  const diffDays = Math.floor((fim.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "Vencido";
  if (diffDays <= 90) return "A vencer";
  return "Vigente";
}
