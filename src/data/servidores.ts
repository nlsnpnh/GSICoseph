// Camada de acesso a dados: tipos gerados do Supabase (types.ts) incompletos para
// varias tabelas/joins, entao o uso de `any` aqui e intencional. Fix definitivo:
// regenerar types.ts via `supabase gen types`.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { addAnosISO, anosCompletosISO, diffDiasISO, hojeISO, isISODate } from "@/lib/dates";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export const CARGOS = [
  "Agente de Segurança",
  "Técnico Judiciário",
  "Analista Judiciário",
  "Chefe de Seção",
  "Coordenador",
  "Supervisor de Segurança",
  "Operacional",
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
  abono_permanencia: boolean;
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
  abono_permanencia: !!r.abono_permanencia,
  email: r.email ?? "",
  telefone: r.telefone ?? "",
  data_ingresso: r.data_ingresso ?? "",
  data_nascimento: r.data_nascimento ?? "",
  observacoes: r.observacoes ?? "",
});

export function useServidores(): ServidorSeg[] {
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

export async function addServidor(d: Omit<ServidorSeg, "id">) {
  const { error } = await supabase.from("servidores").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateServidor(id: string, d: Omit<ServidorSeg, "id">) {
  const { error } = await supabase.from("servidores").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeServidor(id: string) {
  const { error } = await supabase.from("servidores").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}

// ===== Helpers de indicadores =====
export function calcIdade(dataNascISO: string): number | null {
  if (!isISODate(dataNascISO)) return null;
  return anosCompletosISO(dataNascISO, hojeISO());
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
  if (!isISODate(dataIngressoISO)) return null;
  const hoje = hojeISO();
  if (hoje < dataIngressoISO) return 0; // ingresso futuro: sem tempo de servico
  // Anos completos + a fracao ja corrida do ano em curso. Usar a duracao real
  // do ano (e nao a media de 365,25 dias) faz o aniversario cair exato: no 10o
  // aniversario o resultado e 10, nao 9,9.
  const anos = anosCompletosISO(dataIngressoISO, hoje);
  const ultimoAniversario = addAnosISO(dataIngressoISO, anos);
  const proximoAniversario = addAnosISO(dataIngressoISO, anos + 1);
  const fracao =
    diffDiasISO(ultimoAniversario, hoje) /
    diffDiasISO(ultimoAniversario, proximoAniversario);
  return Math.floor((anos + fracao) * 10) / 10;
}
