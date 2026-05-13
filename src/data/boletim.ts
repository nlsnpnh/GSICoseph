import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as unknown as { from: (t: string) => any };

export type BoletimItem = {
  item_number: number;
  descricao: string;
  categoria: string | null;
};

/** Catálogo fixo dos 15 indicadores do Boletim Operacional (fonte de verdade no frontend). */
export const BOLETIM_ITENS_FIXOS: BoletimItem[] = [
  { item_number: 1,  descricao: "Número de acautelamento de armas de FOGO",                                                                            categoria: "arma_fogo" },
  { item_number: 2,  descricao: "Número de acautelamento de armas BRANCAS",                                                                            categoria: "arma_branca" },
  { item_number: 3,  descricao: "Registros de roubos e furtos ocorridos na unidade",                                                                   categoria: "roubo_furto" },
  { item_number: 4,  descricao: "Ocorrências de incidentes de segurança",                                                                              categoria: "incidente" },
  { item_number: 5,  descricao: "Extravio de cartões de acesso a serviço/visitantes",                                                                  categoria: "acesso" },
  { item_number: 6,  descricao: "Relutância no controle de acesso/identificação",                                                                      categoria: "relutancia" },
  { item_number: 7,  descricao: "Falhas em equipamentos de segurança, informando número do chamado",                                                   categoria: "falha_equipamento" },
  { item_number: 8,  descricao: "Acessos concedidos a áreas sensíveis, como faciais de gabinetes e salas racks",                                       categoria: "acesso_sensivel" },
  { item_number: 9,  descricao: "Número de servidores do TJRO que atuam no Núcleo de Segurança, incluindo o supervisor(a) de segurança",               categoria: "efetivo" },
  { item_number: 10, descricao: "Número de funcionários terceirizados que auxiliam o NUSEG no serviço de portaria/recepção 44 horas",                  categoria: "efetivo" },
  { item_number: 11, descricao: "Número de funcionários terceirizados que auxiliam o NUSEG no serviço de portaria/recepção 12x36 horas",               categoria: "efetivo" },
  { item_number: 12, descricao: "Número de policial DERSO existente na unidade",                                                                       categoria: "efetivo" },
  { item_number: 13, descricao: "Número de pessoas autorizadas pelo Juiz Diretor a acessar a unidade predial fora do horário de expediente",           categoria: "autorizacao" },
  { item_number: 14, descricao: "Número de acionamentos ocorridos fora do horário de expediente",                                                      categoria: "acionamento" },
  { item_number: 15, descricao: "Reuniões de alinhamento realizadas pelo núcleo local com os agentes de portaria/AFS",                                 categoria: "reuniao" },
];

export type BoletimLancamento = {
  id: string;
  unidade_id: string;
  ano: number;
  mes: number;
  item_number: number;
  quantidade: number;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BoletimLancamentoComUnidade = BoletimLancamento & {
  unidade_nome: string;
  comarca_nome: string;
};

const KEY_CATALOGO = ["boletim_itens_catalogo"];
const KEY_LANC = ["boletim_mensal"];

/** 15 itens fixos do boletim — sempre retorna a constante local (independe do banco). */
export function useBoletimItens() {
  return { data: BOLETIM_ITENS_FIXOS, isLoading: false } as const;
}

/** Lançamentos de um mês/ano para uma unidade (15 ou menos linhas). */
export function useBoletimMes(unidadeId: string | null, ano: number, mes: number) {
  return useQuery({
    queryKey: [...KEY_LANC, "mes", unidadeId, ano, mes],
    enabled: !!unidadeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("boletim_mensal")
        .select("*")
        .eq("unidade_id", unidadeId)
        .eq("ano", ano)
        .eq("mes", mes)
        .order("item_number");
      if (error) throw error;
      return (data ?? []) as BoletimLancamento[];
    },
  });
}

export type BoletimFiltros = {
  ano?: number | null;
  mes?: number | null;
  unidadeId?: string | null;
  comarcaId?: string | null;
  itemNumber?: number | null;
};

/** Listagem com filtros (todos opcionais). Inclui unidade e comarca. */
export function useBoletimList(f: BoletimFiltros = {}) {
  return useQuery({
    queryKey: [...KEY_LANC, "list", f],
    queryFn: async () => {
      let q = sb
        .from("boletim_mensal")
        .select("*, unidades(nome, comarca_id, comarcas(nome))")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false })
        .order("item_number");
      if (f.ano)        q = q.eq("ano", f.ano);
      if (f.mes)        q = q.eq("mes", f.mes);
      if (f.unidadeId)  q = q.eq("unidade_id", f.unidadeId);
      if (f.itemNumber) q = q.eq("item_number", f.itemNumber);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []).map((r: any): BoletimLancamentoComUnidade => ({
        id: r.id,
        unidade_id: r.unidade_id,
        ano: r.ano,
        mes: r.mes,
        item_number: r.item_number,
        quantidade: r.quantidade,
        observacoes: r.observacoes,
        created_by: r.created_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
        unidade_nome: r.unidades?.nome ?? "",
        comarca_nome: r.unidades?.comarcas?.nome ?? "",
      }));
      if (f.comarcaId) {
        rows = rows.filter((r: any, i: number) =>
          (data?.[i] as any)?.unidades?.comarca_id === f.comarcaId,
        );
      }
      return rows;
    },
  });
}

export type BoletimUpsertEntry = {
  item_number: number;
  quantidade: number;
  observacoes: string;
};

/** UPSERT em lote dos 15 itens de um mês/ano/unidade. */
export function useUpsertBoletim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      unidade_id: string;
      ano: number;
      mes: number;
      itens: BoletimUpsertEntry[];
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const rows = input.itens.map((it) => ({
        unidade_id: input.unidade_id,
        ano: input.ano,
        mes: input.mes,
        item_number: it.item_number,
        quantidade: it.quantidade ?? 0,
        observacoes: it.observacoes ?? "",
        created_by: u.user?.id ?? null,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await sb
        .from("boletim_mensal")
        .upsert(rows, { onConflict: "unidade_id,ano,mes,item_number" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_LANC }),
  });
}

/** Agregação para o card "Resultados Operacionais" (itens 1, 2, 3, 4, 6). */
export const RESULTADOS_OPERACIONAIS_ITEMS: { item: number; label: string; color: string }[] = [
  { item: 1, label: "Armas de Fogo",   color: "hsl(0 75% 55%)"   },
  { item: 2, label: "Armas Brancas",   color: "hsl(30 80% 55%)"  },
  { item: 3, label: "Roubos e Furtos", color: "hsl(270 65% 55%)" },
  { item: 4, label: "Incidentes",      color: "hsl(217 91% 55%)" },
  { item: 6, label: "Relutância",      color: "hsl(42 95% 55%)"  },
];

export type ResultadosOperacionaisFiltros = {
  ano?: number;
  mes?: number | null;       // null = ano inteiro
  unidadeId?: string | null;
  comarcaId?: string | null;
};

export function useResultadosOperacionais(f: ResultadosOperacionaisFiltros) {
  return useQuery({
    queryKey: [...KEY_LANC, "resultados", f],
    queryFn: async () => {
      const itens = RESULTADOS_OPERACIONAIS_ITEMS.map((x) => x.item);
      let q = sb
        .from("boletim_mensal")
        .select("item_number, quantidade, unidade_id, ano, mes, unidades(comarca_id)")
        .in("item_number", itens);
      if (f.ano)       q = q.eq("ano", f.ano);
      if (f.mes)       q = q.eq("mes", f.mes);
      if (f.unidadeId) q = q.eq("unidade_id", f.unidadeId);
      const { data, error } = await q;
      if (error) throw error;
      const filtered = (data ?? []).filter((r: any) =>
        !f.comarcaId || r.unidades?.comarca_id === f.comarcaId,
      );
      const acc = new Map<number, number>();
      for (const r of filtered) {
        acc.set(r.item_number, (acc.get(r.item_number) ?? 0) + (r.quantidade ?? 0));
      }
      return RESULTADOS_OPERACIONAIS_ITEMS.map((it) => ({
        item: it.item,
        label: it.label,
        color: it.color,
        total: acc.get(it.item) ?? 0,
      }));
    },
  });
}
