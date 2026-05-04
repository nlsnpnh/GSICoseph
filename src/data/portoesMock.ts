import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export const TIPOS_PORTAO = ["Pedestre", "Veicular", "Misto", "Emergência", "Carga/Descarga"] as const;
export type TipoPortao = (typeof TIPOS_PORTAO)[number];

export const AUTOMATIZACOES = [
  "Manual", "Motor deslizante", "Motor basculante", "Pivotante", "Eclusa",
] as const;

export const CONTROLES_ACESSO = [
  "Nenhum", "Cartão RFID", "Biometria", "Reconhecimento facial",
  "Senha (teclado)", "Controle remoto", "Operador",
] as const;

export const SITUACOES_OP = [
  "Operacional", "Operacional com restrição", "Inoperante", "Em manutenção", "Desativado",
] as const;
export type SituacaoOp = (typeof SITUACOES_OP)[number];

export const PRIORIDADES_MANUT = ["Nenhuma", "Baixa", "Média", "Alta", "Urgente"] as const;
export type PrioridadeManut = (typeof PRIORIDADES_MANUT)[number];

export type PortaoAcesso = {
  id: string;
  unidade_id: string;
  identificacao: string;
  tipo: TipoPortao;
  localizacao: string;
  automatizacao: (typeof AUTOMATIZACOES)[number];
  camera_associada: string;
  interfone: boolean;
  controle_acesso: (typeof CONTROLES_ACESSO)[number];
  situacao: SituacaoOp;
  necessidade_manutencao: PrioridadeManut;
  descricao_manutencao: string;
  observacoes: string;
};

const KEY = ["portoes"];

const mapRow = (r: any): PortaoAcesso => ({
  id: r.id,
  unidade_id: r.unidade_id ?? "",
  identificacao: r.identificacao ?? "",
  tipo: r.tipo,
  localizacao: r.localizacao ?? "",
  automatizacao: r.automatizacao,
  camera_associada: r.camera_associada ?? "",
  interfone: !!r.interfone,
  controle_acesso: r.controle_acesso,
  situacao: r.situacao,
  necessidade_manutencao: r.necessidade_manutencao,
  descricao_manutencao: r.descricao_manutencao ?? "",
  observacoes: r.observacoes ?? "",
});

export function usePortoesMock(): PortaoAcesso[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("portoes").select("*").order("identificacao");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

const toPayload = (d: Omit<PortaoAcesso, "id">) => ({
  ...d,
  unidade_id: d.unidade_id || null,
});

export async function addPortao(d: Omit<PortaoAcesso, "id">) {
  const { error } = await supabase.from("portoes").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updatePortao(id: string, d: Omit<PortaoAcesso, "id">) {
  const { error } = await supabase.from("portoes").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removePortao(id: string) {
  const { error } = await supabase.from("portoes").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
