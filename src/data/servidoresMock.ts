import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export const CARGOS = [
  "Agente de Segurança",
  "Técnico Judiciário",
  "Analista Judiciário",
  "Chefe de Seção",
  "Coordenador",
  "Supervisor de Segurança",
] as const;

export const REGIMES = ["Estatutário", "Comissionado", "Cedido", "Requisitado"] as const;

export const ESCALAS = [
  "Expediente (7h)", "12 x 72 horas", "12 x 48 horas", "12 x 36 horas",
] as const;

export const SITUACOES = ["Ativo", "Férias", "Licença", "Afastado", "Cedido", "Aposentado"] as const;
export type SituacaoFuncional = (typeof SITUACOES)[number];

export type ServidorSeg = {
  id: string;
  nome: string;
  matricula: string;
  cargo: (typeof CARGOS)[number];
  funcao_atual: string;
  unidade_id: string | null;
  regime: (typeof REGIMES)[number];
  escala: (typeof ESCALAS)[number];
  situacao: SituacaoFuncional;
  email: string;
  telefone: string;
  data_ingresso: string;
  data_nascimento: string;
  observacoes: string;
};

const KEY = ["servidores"];

const mapRow = (r: any): ServidorSeg => ({
  id: r.id,
  nome: r.nome ?? "",
  matricula: r.matricula ?? "",
  cargo: r.cargo,
  funcao_atual: r.funcao_atual ?? "",
  unidade_id: r.unidade_id ?? null,
  regime: r.regime,
  escala: r.escala,
  situacao: r.situacao,
  email: r.email ?? "",
  telefone: r.telefone ?? "",
  data_ingresso: r.data_ingresso ?? "",
  data_nascimento: r.data_nascimento ?? "",
  observacoes: r.observacoes ?? "",
});

export function useServidoresMock(): ServidorSeg[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("servidores").select("*").order("nome");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

const toPayload = (d: Omit<ServidorSeg, "id">) => ({
  ...d,
  data_ingresso: d.data_ingresso || null,
  data_nascimento: d.data_nascimento || null,
});

export async function addServidorMock(d: Omit<ServidorSeg, "id">) {
  const { error } = await supabase.from("servidores").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateServidorMock(id: string, d: Omit<ServidorSeg, "id">) {
  const { error } = await supabase.from("servidores").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeServidorMock(id: string) {
  const { error } = await supabase.from("servidores").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}

// ===== Helpers de indicadores =====
export function calcIdade(dataNascISO: string): number | null {
  if (!dataNascISO) return null;
  const d = new Date(dataNascISO + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function faixaEtaria(idade: number | null): string {
  if (idade == null) return "Não informada";
  if (idade < 30) return "Até 29";
  if (idade < 40) return "30-39";
  if (idade < 50) return "40-49";
  if (idade < 60) return "50-59";
  return "60+";
}

export function tempoServicoAnos(dataIngressoISO: string): number | null {
  if (!dataIngressoISO) return null;
  const d = new Date(dataIngressoISO + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diff * 10) / 10;
}
