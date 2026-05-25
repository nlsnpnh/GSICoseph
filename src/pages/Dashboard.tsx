import { useEffect, useMemo, useState } from "react";
import {
  Building2, Cpu, PowerOff, Siren, FileCheck, UserCog, Users, ClipboardList,
  AlertOctagon, FileSearch, FileBarChart2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MapaComarcasCard } from "@/components/dashboard/MapaComarcasCard";
import { ServidoresPorComarca, EquipamentosDonut, ResultadosOperacionaisPie, ContratosVigencia } from "@/components/dashboard/MiniCharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useComarcas } from "@/data/api";
import { useUnidadeEquipamentos } from "@/data/equipamentos";
import { useContratosMock } from "@/data/contratosMock";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";
import { useAlertas } from "@/hooks/useAlertas";
import { usePeriod, applyPeriod, type Period } from "@/contexts/PeriodContext";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  admin:    "Administrador",
  gestor:   "Gestor",
  operador: "Operador",
};

const ACOES_RAPIDAS = [
  { label: "Registrar Unidade",    icon: Building2,      to: "/unidades",   color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/40"   },
  { label: "Registrar Manutenção", icon: AlertOctagon,   to: "/ocorrencias", color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/40"     },
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

  const { data: comarcas = [] } = useComarcas();
  const unidadesRaw     = useUnidadesMock();
  const servidoresRaw   = useServidoresMock();
  const terceirizadosRaw = useTerceirizadosMock();
  const distribuicaoRaw = useUnidadeEquipamentos();
  const contratosRaw    = useContratosMock();
  const ocorrenciasRaw  = useOcorrenciasMock();
  const alertas         = useAlertas();
  const { period, setPeriod, factor } = usePeriod();

  const unidades = useMemo(() =>
    unidadesRaw.filter((u) => filterComarca === "todas" || u.comarca_id === filterComarca),
    [unidadesRaw, filterComarca],
  );

  const unidadeIds = useMemo(() => new Set(unidades.map((u) => u.id)), [unidades]);

  const unidadesOpcoes = useMemo(() =>
    unidadesRaw.filter((u) => filterComarca === "todas" || u.comarca_id === filterComarca),
    [unidadesRaw, filterComarca],
  );

  const unidadeIdsParaComarca = useMemo(() =>
    new Set(unidadesRaw
      .filter((u) => filterComarca === "todas" || u.comarca_id === filterComarca)
      .map((u) => u.id)
    ),
    [unidadesRaw, filterComarca],
  );

  const servidores    = useMemo(() => servidoresRaw.filter((s) =>
    filterComarca === "todas" || (s.unidade_id != null && unidadeIdsParaComarca.has(s.unidade_id))),
    [servidoresRaw, filterComarca, unidadeIdsParaComarca]);
  const terceirizados = useMemo(() => terceirizadosRaw.filter((t) =>
    filterComarca === "todas" || (t.unidade_id != null && unidadeIdsParaComarca.has(t.unidade_id))),
    [terceirizadosRaw, filterComarca, unidadeIdsParaComarca]);
  const distribuicao = useMemo(() => distribuicaoRaw.filter((d) => {
    if (filterUnidade !== "todas") return d.unidade_id === filterUnidade;
    if (filterComarca !== "todas") return unidadeIdsParaComarca.has(d.unidade_id);
    return true;
  }), [distribuicaoRaw, filterUnidade, filterComarca, unidadeIdsParaComarca]);
  const ocorrencias = useMemo(() => ocorrenciasRaw.filter((o) =>
    filterUnidade !== "todas"
      ? o.unidade_id === filterUnidade
      : filterComarca === "todas" || (o.unidade_id != null && unidadeIdsParaComarca.has(o.unidade_id))),
    [ocorrenciasRaw, filterUnidade, filterComarca, unidadeIdsParaComarca]);

  const handleRefresh = () => setUpdated(format(new Date(), "dd/MM/yyyy HH:mm"));

  const stats = useMemo(() => {
    const f = (n: number) => applyPeriod(n, factor);
    const equipamentosInstalados = distribuicao.reduce((s, d) => s + d.quantidade, 0);
    const statusAbertos = new Set(["Aberto", "Em andamento", "Aguardando peça"]);
    const ocorrenciasAbertas = ocorrencias.filter((o) => statusAbertos.has(o.status)).length;
    const contratosVigentes = contratosRaw.filter((c) => c.status === "Vigente").length;

    // Equipamentos únicos (unidade + equipamento) com ocorrência em aberto do tipo Falha ou Manutenção corretiva
    const equipamentosInoperantes = new Set(
      ocorrencias
        .filter((o) =>
          (o.tipo === "Falha" || o.tipo === "Manutenção corretiva") &&
          statusAbertos.has(o.status),
        )
        .map((o) => `${o.unidade_id}::${o.equipamento}`),
    ).size;

    // Soma dos counts dos alertas classificados como críticos pelo hook useAlertas (mesma fonte do painel Alertas e Pendências)
    const alertasCriticos = alertas
      .filter((a) => a.tipo === "critical")
      .reduce((s, a) => s + a.count, 0);

    return {
      unidadesMonitoradas:    f(unidades.length),
      equipamentosInstalados: f(equipamentosInstalados),
      equipamentosInoperantes:f(equipamentosInoperantes),
      alertasCriticos:        f(alertasCriticos),
      contratosVigentes:      f(contratosVigentes),
      terceirizadosAtivos:    f(terceirizados.filter((t) => t.situacao === "Ativo").length),
      servidoresAtivos:       f(servidores.filter((s) => s.situacao === "Ativo").length),
      ocorrenciasAbertas:     f(ocorrenciasAbertas),
    };
  }, [unidades, servidores, terceirizados, distribuicao, contratosRaw, ocorrencias, alertas, factor]);

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
              {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
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

      {/* 8 stat cards — ordem fixa conforme especificação */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Unidades Monitoradas"    value={stats.unidadesMonitoradas}     icon={Building2}      tone="info" />
        <StatCard label="Equipamentos Instalados" value={stats.equipamentosInstalados}  icon={Cpu}            tone="primary" />
        <StatCard label="Equipamentos Inoperantes" value={stats.equipamentosInoperantes} icon={PowerOff}      tone="warning" />
        <StatCard label="Alertas Críticos"        value={stats.alertasCriticos}         icon={Siren}          tone="destructive" />
        <StatCard label="Contratos Vigentes"      value={stats.contratosVigentes}       icon={FileCheck}      tone="success" />
        <StatCard label="Terceirizados Ativos"    value={stats.terceirizadosAtivos}     icon={UserCog}        tone="accent" />
        <StatCard label="Servidores Ativos"       value={stats.servidoresAtivos}        icon={Users}          tone="info" />
        <StatCard label="Manutenções Abertas"     value={stats.ocorrenciasAbertas}      icon={ClipboardList}  tone="destructive" />
      </div>

      {/* Mapa à esquerda; Alertas à direita */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <MapaComarcasCard />
        <AlertsPanel />
      </div>

      {/* 4 gráficos em linha abaixo do mapa */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EquipamentosDonut />
        <ContratosVigencia />
        <ResultadosOperacionaisPie
          unidadeId={filterUnidade === "todas" ? null : filterUnidade}
          comarcaId={filterComarca === "todas" ? null : filterComarca}
        />
        <ServidoresPorComarca />
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
              className={`group flex items-center gap-3 rounded-lg border border-border p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg hover:ring-1 hover:ring-primary/30 focus-visible:-translate-y-1 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0 active:scale-100 ${bg}`}
            >
              <span className={`rounded-md p-2 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3 ${bg}`}>
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${color}`} />
              </span>
              <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
