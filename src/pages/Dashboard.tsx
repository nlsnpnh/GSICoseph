import { useEffect, useMemo } from "react";
import {
  Building2, Landmark, Users, UserCog, Camera, DoorOpen, Cpu, Bell,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MapaComarcasCard } from "@/components/dashboard/MapaComarcasCard";
import { ServidoresPorComarca, EquipamentosDonut } from "@/components/dashboard/MiniCharts";
import { ModulosSistema } from "@/components/dashboard/ModulosSistema";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { usePortoesMock } from "@/data/portoesMock";
import { usePeriod, applyPeriod } from "@/contexts/PeriodContext";

export default function Dashboard() {
  useEffect(() => { document.title = "Painel Executivo | COSEPH TJRO"; }, []);
  const updated = format(new Date(), "dd/MM/yyyy HH:mm");

  const unidades = useUnidadesMock();
  const servidores = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const equipamentos = useEquipamentosMock();
  const portoes = usePortoesMock();
  const { factor, label: periodLabel } = usePeriod();

  const stats = useMemo(() => {
    const comarcasComDerso = new Set(unidades.filter((u) => u.possui_derso).map((u) => u.comarca)).size;
    const countTipo = (t: string) => equipamentos.filter((e) => e.tipo === t).length;
    const f = (n: number) => applyPeriod(n, factor);
    return {
      unidades: f(unidades.length),
      comarcasDerso: f(comarcasComDerso),
      servidoresAtivos: f(servidores.filter((s) => s.situacao === "Ativo").length),
      terceirizadosAtivos: f(terceirizados.filter((t) => t.situacao === "Ativo").length),
      cameras: f(countTipo("Câmera")),
      catracas: f(countTipo("Catraca")),
      portoesAuto: f(portoes.filter((p) => p.automatizacao !== "Manual").length),
      alarmesSensores: f(equipamentos.filter((e) => e.tipo === "Alarme" || e.tipo === "Sensor" || e.tipo === "Botão de pânico").length),
    };
  }, [unidades, servidores, terceirizados, equipamentos, portoes, factor]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Painel Executivo"
        description="Visão geral da segurança institucional do TJRO"
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground md:inline-flex">
              Período: <strong className="ml-1 font-semibold">{periodLabel}</strong>
            </span>
            <span className="hidden rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground md:inline-flex">
              Atualizado em: {updated}
            </span>
          </div>
        }
      />

      {/* 8 stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Unidades Prediais Monitoradas" value={stats.unidades} icon={Building2} tone="info" href="/unidades" hrefLabel="Ver unidades" />
        <StatCard label="Comarcas Atendidas com DERSO" value={stats.comarcasDerso} icon={Landmark} tone="success" href="/comarcas" hrefLabel="Ver comarcas" />
        <StatCard label="Servidores da Segurança" value={stats.servidoresAtivos} icon={Users} tone="accent" href="/servidores" hrefLabel="Ver servidores" />
        <StatCard label="Terceirizados Ativos" value={stats.terceirizadosAtivos} icon={UserCog} tone="primary" href="/terceirizados" hrefLabel="Ver terceirizados" />
        <StatCard label="Câmeras Total" value={stats.cameras} icon={Camera} tone="destructive" href="/equipamentos" hrefLabel="Ver equipamentos" />
        <StatCard label="Catracas Total" value={stats.catracas} icon={Cpu} tone="warning" href="/equipamentos" hrefLabel="Ver equipamentos" />
        <StatCard label="Portões Automatizados" value={stats.portoesAuto} icon={DoorOpen} tone="info" href="/portoes" hrefLabel="Ver acessos" />
        <StatCard label="Alarmes e Sensores" value={stats.alarmesSensores} icon={Bell} tone="destructive" href="/equipamentos" hrefLabel="Ver equipamentos" />
      </div>

      {/* Mapa à esquerda; Alertas + (Servidores | Equipamentos) à direita */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <MapaComarcasCard />
        <div className="flex flex-col gap-4">
          <AlertsPanel />
          <div className="grid gap-4 sm:grid-cols-2">
            <ServidoresPorComarca />
            <EquipamentosDonut />
          </div>
        </div>
      </div>

      <ModulosSistema />
    </div>
  );
}
