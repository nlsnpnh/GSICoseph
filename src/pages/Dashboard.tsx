import { useEffect, useMemo, useState } from "react";
import {
  Building2, Landmark, Users, UserCog, Camera, DoorOpen, Cpu, Bell,
  AlertOctagon, FileSearch, FileBarChart2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MapaComarcasCard } from "@/components/dashboard/MapaComarcasCard";
import { ServidoresPorComarca, EquipamentosDonut, OcorrenciasPorMes, ContratosVigencia } from "@/components/dashboard/MiniCharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUnidadesMock, COMARCAS, CRITICIDADES } from "@/data/unidadesMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { usePortoesMock } from "@/data/portoesMock";
import { usePeriod, applyPeriod, type Period } from "@/contexts/PeriodContext";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  admin:    "Administrador",
  gestor:   "Gestor",
  operador: "Operador",
};

const ACOES_RAPIDAS = [
  { label: "Registrar Unidade",    icon: Building2,      to: "/unidades",   color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/40"   },
  { label: "Registrar Ocorrência", icon: AlertOctagon,   to: "/ocorrencias", color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/40"     },
  { label: "Consultar Contrato",   icon: FileSearch,     to: "/contratos",  color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/40" },
  { label: "Gerar Relatório",      icon: FileBarChart2,  to: "/relatorios", color: "text-green-600",  bg: "bg-green-50 dark:bg-green-950/40" },
];

export default function Dashboard() {
  useEffect(() => { document.title = "Painel Executivo | COSEPH TJRO"; }, []);
  const navigate = useNavigate();
  const { user, roles, nomeCompleto } = useAuth();
  const [updated, setUpdated] = useState(() => format(new Date(), "dd/MM/yyyy HH:mm"));

  const emailUser    = (user?.email ?? "").split("@")[0];
  const nomeExibido  = nomeCompleto ?? (emailUser.charAt(0).toUpperCase() + emailUser.slice(1));
  const primeiroNome = nomeExibido.split(" ")[0];
  const iniciais     = nomeExibido.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
  const roleLabel    = ROLE_LABEL[roles[0]] ?? roles[0] ?? "—";

  const [filterComarca, setFilterComarca] = useState("todas");
  const [filterUnidade, setFilterUnidade] = useState("todas");
  const [filterStatus, setFilterStatus]   = useState("todos");

  const unidadesRaw     = useUnidadesMock();
  const servidoresRaw   = useServidoresMock();
  const terceirizadosRaw = useTerceirizadosMock();
  const equipamentosRaw = useEquipamentosMock();
  const portoes         = usePortoesMock();
  const { period, setPeriod, factor } = usePeriod();

  const unidades = useMemo(() =>
    unidadesRaw
      .filter((u) => filterComarca === "todas" || u.comarca === filterComarca)
      .filter((u) => filterStatus  === "todos"  || u.criticidade === filterStatus),
    [unidadesRaw, filterComarca, filterStatus],
  );

  const unidadeIds = useMemo(() => new Set(unidades.map((u) => u.id)), [unidades]);

  const unidadesOpcoes = useMemo(() =>
    unidadesRaw.filter((u) => filterComarca === "todas" || u.comarca === filterComarca),
    [unidadesRaw, filterComarca],
  );

  const servidores    = useMemo(() => servidoresRaw.filter((s) =>
    filterComarca === "todas" || s.comarca === filterComarca), [servidoresRaw, filterComarca]);
  const terceirizados = useMemo(() => terceirizadosRaw.filter((t) =>
    filterComarca === "todas" || t.comarca === filterComarca), [terceirizadosRaw, filterComarca]);
  const equipamentos  = useMemo(() => equipamentosRaw.filter((e) =>
    filterUnidade === "todas" || e.unidade_id === filterUnidade), [equipamentosRaw, filterUnidade]);

  const handleRefresh = () => setUpdated(format(new Date(), "dd/MM/yyyy HH:mm"));

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
      {/* Cabeçalho unificado: título + filtros + usuário */}
      <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
        {/* Linha superior: título e usuário */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel Executivo</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Visão geral da segurança institucional do TJRO</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {iniciais}
            </div>
            <div className="leading-tight text-right">
              <p className="text-sm font-semibold text-foreground">{primeiroNome}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Linha inferior: filtros e última atualização */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-semibold text-muted-foreground">Filtros:</span>

          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os dados</SelectItem>
              <SelectItem value="mes">Último mês</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterComarca} onValueChange={(v) => { setFilterComarca(v); setFilterUnidade("todas"); }}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Comarca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as comarcas</SelectItem>
              {COMARCAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterUnidade} onValueChange={setFilterUnidade}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as unidades</SelectItem>
              {unidadesOpcoes.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {CRITICIDADES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleRefresh} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">
              Última atualização: <strong className="text-foreground">{updated}</strong>
            </span>
          </div>
        </div>
      </div>

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

      {/* Mapa à esquerda; Alertas à direita */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <MapaComarcasCard />
        <AlertsPanel />
      </div>

      {/* 4 gráficos em linha abaixo do mapa */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ServidoresPorComarca />
        <EquipamentosDonut />
        <OcorrenciasPorMes />
        <ContratosVigencia />
      </div>

      {/* Ações Rápidas */}
      <div>
        <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-foreground">
          Ações Rápidas
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACOES_RAPIDAS.map(({ label, icon: Icon, to, color, bg }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex items-center gap-3 rounded-lg border border-border p-4 text-left shadow-sm transition-colors hover:bg-muted/50 ${bg}`}
            >
              <span className={`rounded-md p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
