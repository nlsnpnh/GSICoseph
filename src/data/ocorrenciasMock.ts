import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { EMPRESAS } from "./terceirizadosMock";

export const TIPOS_OCORRENCIA = [
  "Chamado", "Falha", "Pendência",
  "Manutenção preventiva", "Manutenção corretiva", "Vistoria",
] as const;
export type TipoOcorrencia = (typeof TIPOS_OCORRENCIA)[number];

export const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"] as const;
export type PrioridadeOco = (typeof PRIORIDADES)[number];

export const STATUS_OCO = [
  "Aberto", "Em andamento", "Aguardando peça", "Concluído", "Cancelado",
] as const;
export type StatusOco = (typeof STATUS_OCO)[number];

export type OcorrenciaManut = {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  tipo: TipoOcorrencia;
  prioridade: PrioridadeOco;
  unidade_id: string;
  equipamento: string;
  empresa_responsavel: (typeof EMPRESAS)[number] | "Interno";
  responsavel_nome: string;
  data_abertura: string;
  prazo: string;
  data_conclusao: string;
  status: StatusOco;
  observacoes: string;
};

const KEY = ["ocorrencias"];

const mapRow = (r: any): OcorrenciaManut => ({
  id: r.id,
  protocolo: r.protocolo ?? "",
  titulo: r.titulo ?? "",
  descricao: r.descricao ?? "",
  tipo: r.tipo,
  prioridade: r.prioridade,
  unidade_id: r.unidade_id ?? "",
  equipamento: r.equipamento ?? "",
  empresa_responsavel: r.empresa_responsavel ?? "Interno",
  responsavel_nome: r.responsavel_nome ?? "",
  data_abertura: r.data_abertura ?? "",
  prazo: r.prazo ?? "",
  data_conclusao: r.data_conclusao ?? "",
  status: r.status,
  observacoes: r.observacoes ?? "",
});

export function useOcorrenciasMock(): OcorrenciaManut[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocorrencias")
        .select("*")
        .order("data_abertura", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

const toPayload = (d: Omit<OcorrenciaManut, "id" | "protocolo">) => ({
  ...d,
  unidade_id: d.unidade_id || null,
  data_abertura: d.data_abertura || null,
  prazo: d.prazo || null,
  data_conclusao: d.data_conclusao || null,
});

export async function addOcorrenciaMock(d: Omit<OcorrenciaManut, "id" | "protocolo">) {
  const { error } = await supabase.from("ocorrencias").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateOcorrenciaMock(id: string, d: Omit<OcorrenciaManut, "id" | "protocolo">) {
  const { error } = await supabase.from("ocorrencias").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeOcorrenciaMock(id: string) {
  const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
