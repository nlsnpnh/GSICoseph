// Camada de dados do módulo Planejamento (Plano Anual de Atividades COSEPH).
// Segue o padrão de boletim.ts: cliente Supabase via cast (types.ts não cobre a tabela).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as unknown as { from: (t: string) => any };

// Busca todas as linhas paginando de 1000 em 1000 (teto do PostgREST).
async function fetchAllRows(buildQuery: () => any): Promise<any[]> {
  const pageSize = 1000;
  const all: any[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

export type SetorKey = "assessoria_coseph" | "nop_adm" | "nop_ope" | "cim";

export const SETORES: { key: SetorKey; label: string; objetivo: string }[] = [
  {
    key: "assessoria_coseph",
    label: "Assessoria COSEPH",
    objetivo:
      "Assessorar a COSEPH no planejamento estratégico, monitoramento dos instrumentos de gestão, acompanhamento de indicadores, governança, produção de informações gerenciais e apoio à tomada de decisão da Administração Superior.",
  },
  {
    key: "nop_adm",
    label: "NOP ADM",
    objetivo:
      "Planejar, instruir, acompanhar e controlar processos administrativos, contratações, contratos, orçamento e instrumentos de gestão da Segurança Institucional, assegurando regularidade processual, eficiência administrativa e adequada aplicação dos recursos públicos.",
  },
  {
    key: "nop_ope",
    label: "NOP Operacional",
    objetivo:
      "Planejar, coordenar, supervisionar, padronizar e aperfeiçoar as atividades operacionais de segurança patrimonial, monitoramento eletrônico, controle de acesso, gestão de riscos e procedimentos operacionais, promovendo a integração entre NUSEGs, CIM e diretrizes da Segurança Institucional.",
  },
  {
    key: "cim",
    label: "CIM",
    objetivo:
      "Atuar como núcleo estratégico de videomonitoramento, inteligência preventiva e resposta rápida, garantindo a proteção institucional, a rastreabilidade das ocorrências e o apoio operacional às unidades de segurança do TJRO.",
  },
];

export type StatusPlanejamento =
  | "Não iniciada"
  | "Em andamento"
  | "Concluída"
  | "Atrasada"
  | "Suspensa";

export const STATUS_OPCOES: StatusPlanejamento[] = [
  "Não iniciada",
  "Em andamento",
  "Concluída",
  "Atrasada",
  "Suspensa",
];

export type PrioridadePlanejamento = "Alta" | "Média" | "Baixa";
export const PRIORIDADE_OPCOES: PrioridadePlanejamento[] = ["Alta", "Média", "Baixa"];

export type PlanejamentoAcao = {
  id: string;
  ano: number;
  setor: SetorKey;
  ordem: number;
  eixo: string | null;
  problema: string | null;
  publico_alvo: string | null;
  acao: string;
  etapas: string | null;
  responsavel: string | null;
  prazo_data: string | null;
  frequencia: string | null;
  prioridade: PrioridadePlanejamento | null;
  status: StatusPlanejamento;
  percentual: number;
  data_inicio: string | null;
  data_conclusao: string | null;
  indicador: string | null;
  evidencia_sei: string | null;
  link_documento: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const KEY = ["planejamento_acoes"];
const KEY_ANOS = ["planejamento_anos"];

/** Anos distintos existentes na tabela (para o seletor de ano). Sempre inclui o ano atual. */
export function useAnosPlanejamento() {
  return useQuery({
    queryKey: KEY_ANOS,
    queryFn: async (): Promise<number[]> => {
      const data = await fetchAllRows(() =>
        sb.from("planejamento_acoes").select("ano").order("ano", { ascending: false }),
      );
      const set = new Set<number>((data ?? []).map((r: any) => Number(r.ano)));
      set.add(new Date().getFullYear());
      set.add(2026);
      return Array.from(set).sort((a, b) => b - a);
    },
  });
}

/** Todas as ações de um ano, ordenadas por setor e ordem. */
export function usePlanejamentoAcoes(ano: number) {
  return useQuery({
    queryKey: [...KEY, ano],
    enabled: !!ano,
    queryFn: async (): Promise<PlanejamentoAcao[]> => {
      const data = await fetchAllRows(() =>
        sb
          .from("planejamento_acoes")
          .select("*")
          .eq("ano", ano)
          .order("setor")
          .order("ordem"),
      );
      return (data ?? []) as PlanejamentoAcao[];
    },
  });
}

/** Campos editáveis pela tela. */
export type PlanejamentoPatch = Partial<
  Pick<
    PlanejamentoAcao,
    | "status"
    | "percentual"
    | "responsavel"
    | "prazo_data"
    | "data_inicio"
    | "data_conclusao"
    | "link_documento"
    | "observacoes"
    | "prioridade"
    | "eixo"
    | "problema"
    | "publico_alvo"
    | "acao"
    | "etapas"
    | "frequencia"
    | "indicador"
    | "evidencia_sei"
  >
>;

/** Salva em lote as ações alteradas (botão "Salvar alterações"). */
export function useSalvarPlanejamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: (PlanejamentoPatch & { id: string })[]) => {
      for (const r of rows) {
        const { id, ...patch } = r;
        const { error } = await sb
          .from("planejamento_acoes")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Cria uma nova ação (admin). */
export function useCriarAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ano: number; setor: SetorKey; ordem: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("planejamento_acoes").insert({
        ano: input.ano,
        setor: input.setor,
        ordem: input.ordem,
        acao: "Nova ação",
        status: "Não iniciada",
        percentual: 0,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Remove uma ação (admin). */
export function useExcluirAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("planejamento_acoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Abre um novo ano. Se `clonarDeAno` for informado, duplica a estrutura daquele ano
 * (campos descritivos), zerando status/percentual/datas. Caso contrário, cria vazio.
 */
export function useCriarAno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ano: number; clonarDeAno?: number | null }) => {
      // Não recria se o ano já existir.
      const { data: existentes, error: e0 } = await sb
        .from("planejamento_acoes")
        .select("id")
        .eq("ano", input.ano)
        .limit(1);
      if (e0) throw e0;
      if (existentes && existentes.length > 0) {
        throw new Error(`O ano ${input.ano} já existe.`);
      }

      if (!input.clonarDeAno) return; // ano vazio: nada a inserir

      const origem = await fetchAllRows(() =>
        sb
          .from("planejamento_acoes")
          .select("*")
          .eq("ano", input.clonarDeAno)
          .order("setor")
          .order("ordem"),
      );
      if (!origem || origem.length === 0) return;

      const { data: u } = await supabase.auth.getUser();
      const novos = origem.map((r: any) => ({
        ano: input.ano,
        setor: r.setor,
        ordem: r.ordem,
        eixo: r.eixo,
        problema: r.problema,
        publico_alvo: r.publico_alvo,
        acao: r.acao,
        etapas: r.etapas,
        responsavel: r.responsavel,
        prazo_data: r.prazo_data,
        frequencia: r.frequencia,
        prioridade: r.prioridade,
        status: "Não iniciada",
        percentual: 0,
        data_inicio: null,
        data_conclusao: null,
        indicador: r.indicador,
        evidencia_sei: null,
        link_documento: null,
        observacoes: null,
        created_by: u.user?.id ?? null,
      }));
      const { error } = await sb.from("planejamento_acoes").insert(novos);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: KEY_ANOS });
    },
  });
}

// ─── Helpers de agregação (Painel Geral) ───────────────────────────────

export type ResumoSetor = {
  setor: SetorKey;
  label: string;
  total: number;
  naoIniciadas: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  suspensas: number;
  mediaExecucao: number; // 0-100
};

export function resumoPorSetor(acoes: PlanejamentoAcao[]): ResumoSetor[] {
  return SETORES.map((s) => {
    const doSetor = acoes.filter((a) => a.setor === s.key);
    const count = (st: StatusPlanejamento) => doSetor.filter((a) => a.status === st).length;
    const media =
      doSetor.length === 0
        ? 0
        : Math.round(doSetor.reduce((sum, a) => sum + (a.percentual ?? 0), 0) / doSetor.length);
    return {
      setor: s.key,
      label: s.label,
      total: doSetor.length,
      naoIniciadas: count("Não iniciada"),
      emAndamento: count("Em andamento"),
      concluidas: count("Concluída"),
      atrasadas: count("Atrasada"),
      suspensas: count("Suspensa"),
      mediaExecucao: media,
    };
  });
}
