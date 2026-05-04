import { useMemo } from "react";
import { useContratosMock } from "@/data/contratosMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";
import { usePortoesMock } from "@/data/portoesMock";

export type Alerta = {
  tipo: "critical" | "warning" | "info";
  label: string;
  count: number;
  unidade: string;
};

export function useAlertas(): Alerta[] {
  const contratos    = useContratosMock();
  const equipamentos = useEquipamentosMock();
  const ocorrencias  = useOcorrenciasMock();
  const portoes      = usePortoesMock();

  return useMemo(() => {
    const hoje = new Date();
    const em90dias = new Date(hoje);
    em90dias.setDate(em90dias.getDate() + 90);

    const contratosVencidos  = contratos.filter((c) => new Date(c.data_fim) < hoje).length;
    const contratosVencendo  = contratos.filter((c) => {
      const fim = new Date(c.data_fim);
      return fim >= hoje && fim <= em90dias;
    }).length;
    const equipInoperantes   = equipamentos.filter((e) => e.status === "Inoperante").length;
    const garantiasVencendo  = equipamentos.filter((e) => {
      if (!e.garantia_ate) return false;
      const fim = new Date(e.garantia_ate);
      return fim >= hoje && fim <= em90dias;
    }).length;
    const garantiasVencidas  = equipamentos.filter((e) => {
      if (!e.garantia_ate) return false;
      return new Date(e.garantia_ate) < hoje;
    }).length;
    const manutVencidas      = ocorrencias.filter((o) => {
      if (!o.prazo || o.status === "Concluído" || o.status === "Cancelado") return false;
      return new Date(o.prazo) < hoje;
    }).length;
    const portoesUrgentes    = portoes.filter((p) =>
      p.necessidade_manutencao === "Alta" || p.necessidade_manutencao === "Urgente"
    ).length;

    return [
      contratosVencidos > 0 && {
        tipo: "critical" as const,
        label: "Contratos vencidos",
        count: contratosVencidos,
        unidade: contratosVencidos === 1 ? "contrato" : "contratos",
      },
      contratosVencendo > 0 && {
        tipo: "warning" as const,
        label: "Contratos vencendo em 90 dias",
        count: contratosVencendo,
        unidade: contratosVencendo === 1 ? "contrato" : "contratos",
      },
      equipInoperantes > 0 && {
        tipo: "critical" as const,
        label: "Equipamentos inoperantes",
        count: equipInoperantes,
        unidade: equipInoperantes === 1 ? "equipamento" : "equipamentos",
      },
      manutVencidas > 0 && {
        tipo: "warning" as const,
        label: "Manutenções com prazo vencido",
        count: manutVencidas,
        unidade: manutVencidas === 1 ? "registro" : "registros",
      },
      portoesUrgentes > 0 && {
        tipo: "warning" as const,
        label: "Portões com manutenção urgente/alta",
        count: portoesUrgentes,
        unidade: portoesUrgentes === 1 ? "portão" : "portões",
      },
      garantiasVencidas > 0 && {
        tipo: "warning" as const,
        label: "Garantias de equipamentos vencidas",
        count: garantiasVencidas,
        unidade: garantiasVencidas === 1 ? "equipamento" : "equipamentos",
      },
      garantiasVencendo > 0 && {
        tipo: "info" as const,
        label: "Garantias vencendo em 90 dias",
        count: garantiasVencendo,
        unidade: garantiasVencendo === 1 ? "equipamento" : "equipamentos",
      },
    ].filter(Boolean) as Alerta[];
  }, [contratos, equipamentos, ocorrencias, portoes]);
}
