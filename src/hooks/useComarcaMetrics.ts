import { useMemo } from "react";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useUnidadeEquipamentos } from "@/data/equipamentos";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";
import { useComarcas } from "@/data/api";
import type { Criticidade } from "@/data/mockDashboard";

export type ComarcaMetric = {
  comarcaId: string;
  nome: string;
  lat: number;
  lng: number;
  nivel: Criticidade;
  unidades: number;
  itensVinculados: number;
  quantidadeTotal: number;
  valorEstimado: number;
  cobertura: number;
  ocorrenciasAbertas: number;
  possuiDerso: boolean;
};

export function useComarcaMetrics(): ComarcaMetric[] {
  const { data: comarcasDB = [] } = useComarcas();
  const unidades = useUnidadesMock();
  const distribuicao = useUnidadeEquipamentos();
  const ocorrencias = useOcorrenciasMock();

  return useMemo(() => {
    const unidadesPorComarca = new Map<string, typeof unidades>();
    for (const u of unidades) {
      if (!u.comarca_id) continue;
      const arr = unidadesPorComarca.get(u.comarca_id) ?? [];
      arr.push(u);
      unidadesPorComarca.set(u.comarca_id, arr);
    }

    const distPorUnidade = new Map<string, typeof distribuicao>();
    for (const d of distribuicao) {
      const arr = distPorUnidade.get(d.unidade_id) ?? [];
      arr.push(d);
      distPorUnidade.set(d.unidade_id, arr);
    }

    const ocoPorUnidade = new Map<string, number>();
    for (const o of ocorrencias) {
      if (o.status === "Aberto" || o.status === "Em andamento" || o.status === "Aguardando peça") {
        ocoPorUnidade.set(o.unidade_id, (ocoPorUnidade.get(o.unidade_id) ?? 0) + 1);
      }
    }

    const result: ComarcaMetric[] = [];

    for (const c of comarcasDB) {
      const us = unidadesPorComarca.get(c.id) ?? [];

      const comCoords = us.filter((u) => u.lat != null && u.lng != null);
      if (comCoords.length === 0) continue;

      const lat = comCoords.reduce((s, u) => s + u.lat!, 0) / comCoords.length;
      const lng = comCoords.reduce((s, u) => s + u.lng!, 0) / comCoords.length;

      let itensVinculados = 0;
      let quantidadeTotal = 0;
      let valorEstimado = 0;
      let ocoAbertas = 0;
      let possuiDerso = false;
      let flagsCobertura = 0;

      for (const u of us) {
        if (u.possui_derso) { possuiDerso = true; flagsCobertura++; }
        if (u.controle_acesso) flagsCobertura++;
        if (u.vigilancia_eletronica) flagsCobertura++;

        const ds = distPorUnidade.get(u.id) ?? [];
        itensVinculados += ds.length;
        for (const d of ds) {
          quantidadeTotal += d.quantidade;
          valorEstimado += d.quantidade * d.valor_unitario;
        }
        ocoAbertas += ocoPorUnidade.get(u.id) ?? 0;
      }

      const cobertura = us.length > 0 ? (flagsCobertura / (us.length * 3)) * 100 : 0;

      let nivel: Criticidade;
      if (us.length === 0) {
        nivel = "sem_dados";
      } else if (cobertura >= 90 && itensVinculados > 0 && ocoAbertas <= 1) {
        nivel = "adequado";
      } else if (cobertura < 50 || ocoAbertas >= 4 || itensVinculados === 0) {
        nivel = "critico";
      } else {
        nivel = "parcial";
      }

      result.push({
        comarcaId: c.id,
        nome: c.nome,
        lat,
        lng,
        nivel,
        unidades: us.length,
        itensVinculados,
        quantidadeTotal,
        valorEstimado,
        cobertura: Math.round(cobertura),
        ocorrenciasAbertas: ocoAbertas,
        possuiDerso,
      });
    }

    return result;
  }, [comarcasDB, unidades, distribuicao, ocorrencias]);
}
