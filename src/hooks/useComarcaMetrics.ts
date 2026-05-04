import { useMemo } from "react";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";
import { useComarcas } from "@/data/api";
import type { Criticidade } from "@/data/mockDashboard";

export type ComarcaMetric = {
  nome: string;
  lat: number;
  lng: number;
  nivel: Criticidade;
  unidades: number;
  equipamentos: number;
  operacionais: number;
  pctOperacional: number;
  ocorrenciasAbertas: number;
  possuiDerso: boolean;
};

export function useComarcaMetrics(): ComarcaMetric[] {
  const { data: comarcasDB = [] } = useComarcas();
  const unidades    = useUnidadesMock();
  const equipamentos = useEquipamentosMock();
  const ocorrencias  = useOcorrenciasMock();

  return useMemo(() => {
    // Só comarcas com coordenadas cadastradas aparecem no mapa
    const comarcasComCoords = comarcasDB.filter(
      (c) => c.lat != null && c.lng != null
    );

    const unidadesPorComarca = new Map<string, typeof unidades>();
    for (const u of unidades) {
      const arr = unidadesPorComarca.get(u.comarca) ?? [];
      arr.push(u);
      unidadesPorComarca.set(u.comarca, arr);
    }

    const equipPorUnidade = new Map<string, typeof equipamentos>();
    for (const e of equipamentos) {
      const arr = equipPorUnidade.get(e.unidade_id) ?? [];
      arr.push(e);
      equipPorUnidade.set(e.unidade_id, arr);
    }

    const ocorrPorUnidade = new Map<string, number>();
    for (const o of ocorrencias) {
      if (o.status === "Aberto" || o.status === "Em andamento" || o.status === "Aguardando peça") {
        ocorrPorUnidade.set(o.unidade_id, (ocorrPorUnidade.get(o.unidade_id) ?? 0) + 1);
      }
    }

    return comarcasComCoords.map((c) => {
      const us = unidadesPorComarca.get(c.nome) ?? [];
      let totalEq = 0;
      let opEq = 0;
      let ocoAbertas = 0;
      let possuiDerso = false;

      for (const u of us) {
        if (u.possui_derso) possuiDerso = true;
        const eqs = equipPorUnidade.get(u.id) ?? [];
        totalEq += eqs.length;
        opEq += eqs.filter((e) => e.status === "Operacional").length;
        ocoAbertas += ocorrPorUnidade.get(u.id) ?? 0;
      }

      const pct = totalEq > 0 ? (opEq / totalEq) * 100 : -1;

      let nivel: Criticidade;
      if (us.length === 0) {
        nivel = "sem_dados";
      } else if (pct < 0) {
        nivel = ocoAbertas > 2 ? "critico" : "parcial";
      } else if (pct >= 90 && ocoAbertas <= 1 && possuiDerso) {
        nivel = "adequado";
      } else if (pct < 60 || ocoAbertas >= 4) {
        nivel = "critico";
      } else {
        nivel = "parcial";
      }

      return {
        nome: c.nome,
        lat: c.lat!,
        lng: c.lng!,
        nivel,
        unidades: us.length,
        equipamentos: totalEq,
        operacionais: opEq,
        pctOperacional: pct < 0 ? 0 : Math.round(pct),
        ocorrenciasAbertas: ocoAbertas,
        possuiDerso,
      };
    });
  }, [comarcasDB, unidades, equipamentos, ocorrencias]);
}
