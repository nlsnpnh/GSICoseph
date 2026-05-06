import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { COMARCAS } from "./unidadesMock";

export const EMPRESAS = [
  "AFS Empreendimentos", "SegService", "Grupo Protege", "TechSeg", "Portões RO", "Vigilância Total",
] as const;

export const FUNCOES = [
  "Agente de Portaria",
] as const;

export const ESCALAS_TERC = [
  "12x36 horas", "44 horas",
] as const;

export const TURNOS = ["Diurno", "Noturno", "Integral", "Revezamento"] as const;

export const SITUACOES_TERC = ["Ativo", "Afastado", "Substituído", "Desligado"] as const;
export type SituacaoTerc = (typeof SITUACOES_TERC)[number];

export type Terceirizado = {
  id: string;
  nome: string;
  cpf: string;
  empresa: string;
  contrato: string;
  funcao: (typeof FUNCOES)[number];
  posto_trabalho: string;
  unidade: string;
  comarca: (typeof COMARCAS)[number];
  escala: (typeof ESCALAS_TERC)[number];
  turno: (typeof TURNOS)[number];
  situacao: SituacaoTerc;
  certificacoes: string;
  validade_certificacao: string;
  curso_libras: boolean;
  observacoes: string;
};

const KEY = ["terceirizados"];

const mapRow = (r: any): Terceirizado => ({
  id: r.id,
  nome: r.nome ?? "",
  cpf: r.cpf ?? "",
  empresa: r.empresa,
  contrato: r.contrato ?? "",
  funcao: r.funcao,
  posto_trabalho: r.posto_trabalho ?? "",
  unidade: r.unidade ?? "",
  comarca: r.comarca,
  escala: r.escala,
  turno: r.turno,
  situacao: r.situacao,
  certificacoes: r.certificacoes ?? "",
  validade_certificacao: r.validade_certificacao ?? "",
  curso_libras: r.curso_libras ?? false,
  observacoes: r.observacoes ?? "",
});

export function useTerceirizadosMock(): Terceirizado[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("terceirizados").select("*").order("nome");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

const toPayload = (d: Omit<Terceirizado, "id">) => ({
  ...d,
  validade_certificacao: d.validade_certificacao || null,
});

export async function addTerceirizado(d: Omit<Terceirizado, "id">) {
  const { error } = await supabase.from("terceirizados").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateTerceirizado(id: string, d: Omit<Terceirizado, "id">) {
  const { error } = await supabase.from("terceirizados").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeTerceirizado(id: string) {
  const { error } = await supabase.from("terceirizados").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
