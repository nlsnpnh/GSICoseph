// Camada de dados do módulo Orçamento (Acompanhamento da Execução Orçamentária GSI).
// Segue o padrão de planejamento.ts: cliente Supabase via cast (types.ts não cobre as tabelas).
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

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export type AcaoCodigo = "4078" | "4079" | "4080";

// Ordem das abas conforme solicitado: 4078, 4080, 4079.
export const ACOES: { codigo: AcaoCodigo; label: string; titulo: string }[] = [
  {
    codigo: "4078",
    label: "4078 - COSEPH",
    titulo:
      "Gerir atividades de segurança pessoal e patrimonial do Poder Judiciário do Estado de Rondônia.",
  },
  {
    codigo: "4080",
    label: "4080 - ABM",
    titulo:
      "Desenvolver e executar atividades visando a segurança contra incêndio e pânico das edificações do Poder Judiciário do Estado de Rondônia.",
  },
  {
    codigo: "4079",
    label: "4079 - ASMIL",
    titulo:
      "Prover segurança institucional através do emprego de policiais militares agregados e por meio de policiamento do convênio da DERSO.",
  },
];

export const acaoLabel = (c: AcaoCodigo) => ACOES.find((a) => a.codigo === c)?.label ?? c;

// ─── Tabela orcamento_acoes (abas 4078 / 4079 / 4080) ───────────────────

export type OrcamentoAcao = {
  id: string;
  ano: number;
  acao: AcaoCodigo;
  ordem: number;
  ed: string | null;
  sl: string | null;
  fonte: string | null;
  objeto: string | null;
  dotacao: number;
  empenho: number;
  reforco_empenho: number;
  anulacao_empenho: number;
  saldo_dotacao: number;
  liquidado: number;
  saldo_empenho: number;
  protocolo: string | null;
  nota_empenho: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
};

export type OrcamentoAcaoPatch = Partial<
  Omit<OrcamentoAcao, "id" | "ano" | "acao" | "created_at" | "updated_at">
>;

const KEY_ACOES = ["orcamento_acoes"];
const KEY_SUPERAVIT = ["orcamento_superavit"];
const KEY_ANOS = ["orcamento_anos"];

/** Anos distintos existentes (para o seletor de ano). Sempre inclui 2026 e o ano atual. */
export function useAnosOrcamento() {
  return useQuery({
    queryKey: KEY_ANOS,
    queryFn: async (): Promise<number[]> => {
      const data = await fetchAllRows(() =>
        sb.from("orcamento_acoes").select("ano").order("ano", { ascending: false }),
      );
      const set = new Set<number>((data ?? []).map((r: any) => Number(r.ano)));
      set.add(new Date().getFullYear());
      set.add(2026);
      return Array.from(set).sort((a, b) => b - a);
    },
  });
}

/** Todos os itens de ação de um ano, ordenados por ação e ordem. */
export function useOrcamentoAcoes(ano: number) {
  return useQuery({
    queryKey: [...KEY_ACOES, ano],
    enabled: !!ano,
    queryFn: async (): Promise<OrcamentoAcao[]> => {
      const data = await fetchAllRows(() =>
        sb.from("orcamento_acoes").select("*").eq("ano", ano).order("acao").order("ordem"),
      );
      return (data ?? []).map((r: any) => ({
        ...r,
        dotacao: n(r.dotacao),
        empenho: n(r.empenho),
        reforco_empenho: n(r.reforco_empenho),
        anulacao_empenho: n(r.anulacao_empenho),
        saldo_dotacao: n(r.saldo_dotacao),
        liquidado: n(r.liquidado),
        saldo_empenho: n(r.saldo_empenho),
      })) as OrcamentoAcao[];
    },
  });
}

export function useSalvarAcoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: (OrcamentoAcaoPatch & { id: string })[]) => {
      for (const r of rows) {
        const { id, ...patch } = r;
        const { error } = await sb
          .from("orcamento_acoes")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_ACOES }),
  });
}

export function useCriarAcaoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ano: number; acao: AcaoCodigo; ordem: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("orcamento_acoes").insert({
        ano: input.ano,
        acao: input.acao,
        ordem: input.ordem,
        objeto: "Nova despesa",
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_ACOES }),
  });
}

export function useExcluirAcaoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("orcamento_acoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_ACOES }),
  });
}

// ─── Tabela orcamento_superavit (aba Superávit 2026) ────────────────────

export type OrcamentoSuperavit = {
  id: string;
  ano: number;
  acao: AcaoCodigo;
  ordem: number;
  especificacao: string | null;
  elemento_despesa: string | null;
  subelemento: string | null;
  unidade_medida: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number;
  exercicio: string | null;
  envolve_pca: string | null;
  data_maxima: string | null;
  justificativa: string | null;
  created_at: string;
  updated_at: string;
};

export type OrcamentoSuperavitPatch = Partial<
  Omit<OrcamentoSuperavit, "id" | "ano" | "created_at" | "updated_at">
>;

export function useOrcamentoSuperavit(ano: number) {
  return useQuery({
    queryKey: [...KEY_SUPERAVIT, ano],
    enabled: !!ano,
    queryFn: async (): Promise<OrcamentoSuperavit[]> => {
      const data = await fetchAllRows(() =>
        sb.from("orcamento_superavit").select("*").eq("ano", ano).order("acao").order("ordem"),
      );
      return (data ?? []).map((r: any) => ({
        ...r,
        quantidade: r.quantidade == null ? null : n(r.quantidade),
        valor_unitario: r.valor_unitario == null ? null : n(r.valor_unitario),
        valor_total: n(r.valor_total),
      })) as OrcamentoSuperavit[];
    },
  });
}

export function useSalvarSuperavit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: (OrcamentoSuperavitPatch & { id: string })[]) => {
      for (const r of rows) {
        const { id, ...patch } = r;
        const { error } = await sb
          .from("orcamento_superavit")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_SUPERAVIT }),
  });
}

export function useCriarSuperavitItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ano: number; acao: AcaoCodigo; ordem: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("orcamento_superavit").insert({
        ano: input.ano,
        acao: input.acao,
        ordem: input.ordem,
        especificacao: "Nova despesa",
        exercicio: String(input.ano),
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_SUPERAVIT }),
  });
}

export function useExcluirSuperavitItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("orcamento_superavit").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_SUPERAVIT }),
  });
}

/**
 * Abre um novo ano. Se `clonarDeAno` for informado, duplica APENAS a estrutura
 * (campos de texto) das duas tabelas, zerando todos os valores monetários.
 * Caso contrário, cria o ano vazio (sem linhas).
 */
export function useCriarAnoOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ano: number; clonarDeAno?: number | null }) => {
      // Não recria se já existir linha do ano em qualquer das tabelas.
      const [{ data: e1 }, { data: e2 }] = await Promise.all([
        sb.from("orcamento_acoes").select("id").eq("ano", input.ano).limit(1),
        sb.from("orcamento_superavit").select("id").eq("ano", input.ano).limit(1),
      ]);
      if ((e1 && e1.length > 0) || (e2 && e2.length > 0)) {
        throw new Error(`O ano ${input.ano} já existe.`);
      }

      if (!input.clonarDeAno) return; // ano vazio: nada a inserir

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;

      // Ações: copia só ED/SL/Fonte/Objeto; zera todos os valores.
      const origemAcoes = await fetchAllRows(() =>
        sb.from("orcamento_acoes").select("*").eq("ano", input.clonarDeAno).order("acao").order("ordem"),
      );
      if (origemAcoes.length > 0) {
        const novos = origemAcoes.map((r: any) => ({
          ano: input.ano,
          acao: r.acao,
          ordem: r.ordem,
          ed: r.ed,
          sl: r.sl,
          fonte: r.fonte,
          objeto: r.objeto,
          dotacao: 0,
          empenho: 0,
          reforco_empenho: 0,
          anulacao_empenho: 0,
          saldo_dotacao: 0,
          liquidado: 0,
          saldo_empenho: 0,
          protocolo: null,
          nota_empenho: null,
          observacao: null,
          created_by: uid,
        }));
        const { error } = await sb.from("orcamento_acoes").insert(novos);
        if (error) throw error;
      }

      // Superávit: copia descrição/elemento/subelemento/unidade/PCA/justificativa; zera valores.
      const origemSup = await fetchAllRows(() =>
        sb.from("orcamento_superavit").select("*").eq("ano", input.clonarDeAno).order("acao").order("ordem"),
      );
      if (origemSup.length > 0) {
        const novos = origemSup.map((r: any) => ({
          ano: input.ano,
          acao: r.acao,
          ordem: r.ordem,
          especificacao: r.especificacao,
          elemento_despesa: r.elemento_despesa,
          subelemento: r.subelemento,
          unidade_medida: r.unidade_medida,
          quantidade: null,
          valor_unitario: null,
          valor_total: 0,
          exercicio: String(input.ano),
          envolve_pca: r.envolve_pca,
          data_maxima: null,
          justificativa: r.justificativa,
          created_by: uid,
        }));
        const { error } = await sb.from("orcamento_superavit").insert(novos);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ACOES });
      qc.invalidateQueries({ queryKey: KEY_SUPERAVIT });
      qc.invalidateQueries({ queryKey: KEY_ANOS });
    },
  });
}

// ─── Agregação (aba Macrodesafios GSI = dashboard) ──────────────────────

export type ResumoAcao = {
  acao: AcaoCodigo;
  label: string;
  dotacao: number;
  empenho: number;
  liquidado: number;
  saldo: number;
  pctEmpenho: number; // 0-1
  pctLiquidacao: number;
  pctSaldo: number;
};

export function resumoPorAcao(itens: OrcamentoAcao[]): ResumoAcao[] {
  return ACOES.map((a) => {
    const rows = itens.filter((i) => i.acao === a.codigo);
    const sum = (k: keyof OrcamentoAcao) => rows.reduce((s, r) => s + n(r[k]), 0);
    const dotacao = sum("dotacao");
    const empenho = sum("empenho");
    const liquidado = sum("liquidado");
    const saldo = sum("saldo_dotacao");
    return {
      acao: a.codigo,
      label: a.label,
      dotacao,
      empenho,
      liquidado,
      saldo,
      pctEmpenho: dotacao ? empenho / dotacao : 0,
      pctLiquidacao: dotacao ? liquidado / dotacao : 0,
      pctSaldo: dotacao ? saldo / dotacao : 0,
    };
  });
}

export type TotalGeral = Omit<ResumoAcao, "acao" | "label">;

export function totalGeral(resumo: ResumoAcao[]): TotalGeral {
  const dotacao = resumo.reduce((s, r) => s + r.dotacao, 0);
  const empenho = resumo.reduce((s, r) => s + r.empenho, 0);
  const liquidado = resumo.reduce((s, r) => s + r.liquidado, 0);
  const saldo = resumo.reduce((s, r) => s + r.saldo, 0);
  return {
    dotacao,
    empenho,
    liquidado,
    saldo,
    pctEmpenho: dotacao ? empenho / dotacao : 0,
    pctLiquidacao: dotacao ? liquidado / dotacao : 0,
    pctSaldo: dotacao ? saldo / dotacao : 0,
  };
}

// Formatação compartilhada
export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
export const fmtBRL0 = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const fmtPct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
