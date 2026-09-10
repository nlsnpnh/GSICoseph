import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { StatusChamado } from "./chamados";

// =====================================================================
// Linha do tempo do chamado (public.chamado_eventos).
//
// So se escreve por INSERT: o historico nao tem update nem delete, nem na RLS
// nem aqui. Alterar um chamado nunca reescreve o que ja foi registrado.
// =====================================================================

export const TIPOS_EVENTO = [
  "Abertura", "Mensagem", "Status", "Contrato", "Anexo",
  "Atendimento", "Conclusão", "Fechamento", "Reabertura",
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export type ChamadoEvento = {
  id: string;
  chamado_id: string;
  tipo: TipoEvento;
  mensagem: string;
  status_anterior: StatusChamado | null;
  status_novo: StatusChamado | null;
  autor_nome: string;
  criado_em: string;   // instante ISO
};

const mapRow = (r: Tables<"chamado_eventos">): ChamadoEvento => ({
  id: r.id,
  chamado_id: r.chamado_id,
  tipo: r.tipo,
  mensagem: r.mensagem ?? "",
  status_anterior: r.status_anterior ?? null,
  status_novo: r.status_novo ?? null,
  autor_nome: r.autor_nome ?? "",
  criado_em: r.criado_em ?? "",
});

export function useChamadoEventos(chamadoId: string | undefined): ChamadoEvento[] {
  const { data } = useQuery({
    queryKey: ["chamado-eventos", chamadoId],
    enabled: Boolean(chamadoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamado_eventos")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}
