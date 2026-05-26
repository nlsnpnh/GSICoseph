import { useMemo } from "react";
import { useContratosMock } from "@/data/contratosMock";
import { useEquipamentosCatalogo, useUnidadeEquipamentos } from "@/data/equipamentos";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useOcorrenciasMock, calcSla } from "@/data/ocorrenciasMock";

export type Alerta = {
  tipo: "critical" | "warning" | "info";
  label: string;
  count: number;
  unidade: string;
  href: string;
};

export function useAlertas(): Alerta[] {
  const contratos    = useContratosMock();
  const catalogo     = useEquipamentosCatalogo();
  const distribuicao = useUnidadeEquipamentos();
  const unidades     = useUnidadesMock();
  const ocorrencias  = useOcorrenciasMock();

  return useMemo(() => {
    const hoje = new Date();
    const em90dias = new Date(hoje);
    em90dias.setDate(em90dias.getDate() + 90);

    const contratosVencidos = contratos.filter((c) => new Date(c.data_fim) < hoje).length;
    const contratosVencendo = contratos.filter((c) => {
      const fim = new Date(c.data_fim);
      return fim >= hoje && fim <= em90dias;
    }).length;

    const manutVencidas = ocorrencias.filter((o) => calcSla(o).indicador === "Atrasado").length;

    // Unidades sem nenhum equipamento do contrato vinculado
    const comVinculo = new Set(distribuicao.map((d) => d.unidade_id));
    const unidadesSemEquip = unidades.filter((u) => !comVinculo.has(u.id)).length;

    // Itens do catálogo sem distribuição em nenhuma unidade
    const itensComVinculo = new Set(distribuicao.map((d) => d.item_num));
    const itensSemDistribuicao = catalogo.filter((c) => !itensComVinculo.has(c.item_num)).length;

    // Divergências entre catálogo e soma das unidades
    const distPorItem = new Map<number, number>();
    for (const d of distribuicao) {
      distPorItem.set(d.item_num, (distPorItem.get(d.item_num) ?? 0) + d.quantidade);
    }
    const itensDivergentes = catalogo.filter(
      (c) => (distPorItem.get(c.item_num) ?? 0) !== c.qtd_contrato,
    ).length;

    return [
      contratosVencidos > 0 && {
        tipo: "critical" as const,
        label: "Contratos vencidos",
        count: contratosVencidos,
        unidade: contratosVencidos === 1 ? "contrato" : "contratos",
        href: "/consultas?q=contratos-vencidos",
      },
      contratosVencendo > 0 && {
        tipo: "warning" as const,
        label: "Contratos vencendo em 90 dias",
        count: contratosVencendo,
        unidade: contratosVencendo === 1 ? "contrato" : "contratos",
        href: "/consultas?q=contratos-vencendo",
      },
      manutVencidas > 0 && {
        tipo: "warning" as const,
        label: "Manutenções com prazo vencido",
        count: manutVencidas,
        unidade: manutVencidas === 1 ? "registro" : "registros",
        href: "/consultas?q=ocorrencias-prazo-vencido",
      },
      unidadesSemEquip > 0 && {
        tipo: "warning" as const,
        label: "Unidades sem equipamentos cadastrados",
        count: unidadesSemEquip,
        unidade: unidadesSemEquip === 1 ? "unidade" : "unidades",
        href: "/consultas?q=unidades-sem-equipamentos",
      },
      itensSemDistribuicao > 0 && {
        tipo: "info" as const,
        label: "Itens do catálogo sem distribuição",
        count: itensSemDistribuicao,
        unidade: itensSemDistribuicao === 1 ? "item" : "itens",
        href: "/consultas?q=itens-nao-distribuidos",
      },
      itensDivergentes > 0 && {
        tipo: "info" as const,
        label: "Itens com divergência contrato × distribuição",
        count: itensDivergentes,
        unidade: itensDivergentes === 1 ? "item" : "itens",
        href: "/consultas?q=divergencia-contrato",
      },
    ].filter(Boolean) as Alerta[];
  }, [contratos, catalogo, distribuicao, unidades, ocorrencias]);
}
