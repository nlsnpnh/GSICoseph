// Camada de acesso a dados: tipos gerados do Supabase (types.ts) incompletos para
// varias tabelas/joins, entao o uso de `any` aqui e intencional. Fix definitivo:
// regenerar types.ts via `supabase gen types`.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { diffDiasISO, hojeISO } from "@/lib/dates";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { EMPRESAS } from "./terceirizados";

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

export function useContratos(): Contrato[] {
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
  // Dia contra dia (fuso de Rondonia): o contrato vale ate o fim da data de
  // vigencia, entao so vira "Vencido" no dia seguinte.
  const diffDays = diffDiasISO(hojeISO(), data_fim);
  if (diffDays < 0) return "Vencido";
  if (diffDays <= 90) return "A vencer";
  return "Vigente";
}
