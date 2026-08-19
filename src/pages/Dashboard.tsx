import { useEffect, useMemo, useState } from "react";
import {
  Building2, Cpu, Camera, Siren, FileCheck, UserCog, Users, ClipboardList,
  AlertOctagon, FileSearch, FileBarChart2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { FioAcento } from "@/components/admin/FioAcento";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { MapaComarcasCard } from "@/components/dashboard/MapaComarcasCard";
import { ServidoresPorComarca, EquipamentosDonut, ResultadosOperacionaisPie, ContratosVigencia } from "@/components/dashboard/MiniCharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUnidades } from "@/data/unidades";
import { useServidores } from "@/data/servidores";
import { useTerceirizados } from "@/data/terceirizados";
import { useComarcas } from "@/data/api";
import { useUnidadeEquipamentos } from "@/data/equipamentos";
import { useContratos, statusFromVigencia } from "@/data/contratos";
import { useOcorrencias } from "@/data/ocorrencias";
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
  useEffect(() => { document.title = "Painel Executivo"; }, []);
  const navigate = useNavigate();
  const { user, roles, nomeCompleto, isOperador } = useAuth();
  const [updated, setUpdated] = useState(() => format(new Date(), "dd/MM/yyyy HH:mm"));

  const emailUser    = (user?.email ?? "").split("@")[0];
  const nomeExibido  = nomeCompleto ?? (emailUser.charAt(0).toUpperCase() + emailUser.slice(1));
  const primeiroNome = nomeExibido.split(" ")[0];
  const iniciais     = nomeExibido.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
  const roleLabel    = ROLE_LABEL[roles[0]] ?? roles[0] ?? "—";

  const [filterComarca, setFilterComarca] = useState("todas");
  const [filterUnidade, setFilterUnidade] = useState("todas");

  const { data: comarcas = [] } = useComarcas();
  const unidadesRaw     = useUnidades();
  const servidoresRaw   = useServidores();
  const terceirizadosRaw = useTerceirizados();
  const distribuicaoRaw = useUnidadeEquipamentos();
  const contratosRaw    = useContratos();
  const ocorrenciasRaw  = useOcorrencias();
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
    const contratosVigentes = contratosRaw.filter((c) => statusFromVigencia(c.data_fim) === "Vigente").length;

    // Total de câmeras instaladas (item 1=Dome, 2=Bullet, 3=Fisheye, 4=PTZ) —
    // mesma definição por item_num usada no relatório "Câmeras por comarca" e no
    // gráfico "Principais Equipamentos". Evita contar itens cuja descrição apenas
    // menciona "câmera" (acessórios, software, storage etc.).
    const cameras = distribuicao
      .filter((d) => [1, 2, 3, 4].includes(d.item_num))
      .reduce((s, d) => s + d.quantidade, 0);

    // Soma dos counts dos alertas classificados como críticos pelo hook useAlertas (mesma fonte do painel Alertas e Pendências)
    const alertasCriticos = alertas
      .filter((a) => a.tipo === "critical")
      .reduce((s, a) => s + a.count, 0);

    return {
      unidadesMonitoradas:    f(unidades.length),
      equipamentosInstalados: f(equipamentosInstalados),
      cameras:                f(cameras),
      alertasCriticos:        f(alertasCriticos),
      contratosVigentes:      f(contratosVigentes),
      terceirizadosAtivos:    f(terceirizados.filter((t) => t.situacao === "Ativo").length),
      servidoresAtivos:       f(servidores.filter((s) => s.situacao === "Ativo").length),
      ocorrenciasAbertas:     f(ocorrenciasAbertas),
    };
  }, [unidades, servidores, terceirizados, distribuicao, contratosRaw, ocorrencias, alertas, factor]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho unificado: título + filtros + usuário */}
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        <FioAcento />
        <div className="px-4 py-3">
        {/* Linha superior: título e usuário */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-px w-5 bg-accent" aria-hidden="true" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                Painel executivo
              </span>
            </div>
            <h1 className="mt-1 text-[22px] font-light leading-tight tracking-[-0.025em] text-foreground sm:text-[26px]">
              Visão geral da segurança institucional
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[12px] font-medium text-primary-foreground">
              {iniciais}
            </div>
            <div className="leading-tight text-right">
              <p className="text-[13px] font-medium text-foreground">{primeiroNome}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Linha inferior: filtros e última atualização */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Filtros</span>

          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-7 w-[140px] text-[12px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os dados</SelectItem>
              <SelectItem value="mes">Último mês</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterComarca} onValueChange={(v) => { setFilterComarca(v); setFilterUnidade("todas"); }}>
            <SelectTrigger className="h-7 w-[160px] text-[12px]">
              <SelectValue placeholder="Comarca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as comarcas</SelectItem>
              {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterUnidade} onValueChange={setFilterUnidade}>
            <SelectTrigger className="h-7 w-[180px] text-[12px]">
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
            <span className="text-[11px] text-muted-foreground">
              Atualizado às <strong className="font-medium tabular-nums text-foreground">{updated}</strong>
            </span>
          </div>
        </div>
        </div>
      </div>

      {/* Linha unica de oito. O inventario fica neutro; a cor e reservada ao
          que pede providencia, e so acende quando ha algo pendente. */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Unidades monitoradas"    value={stats.unidadesMonitoradas}     icon={Building2} />
        <StatCard label="Equipamentos instalados" value={stats.equipamentosInstalados}  icon={Cpu} />
        <StatCard label="Câmeras"                 value={stats.cameras}                 icon={Camera} />
        <StatCard label="Servidores ativos"       value={stats.servidoresAtivos}        icon={Users} />
        <StatCard label="Terceirizados ativos"    value={stats.terceirizadosAtivos}     icon={UserCog} />
        <StatCard label="Contratos continuados"   value={stats.contratosVigentes}       icon={FileCheck} />
        <StatCard
          label="Alertas críticos"
          value={stats.alertasCriticos}
          icon={Siren}
          tone={stats.alertasCriticos > 0 ? "destructive" : "default"}
        />
        <StatCard
          label="Manutenções abertas"
          value={stats.ocorrenciasAbertas}
          icon={ClipboardList}
          tone={stats.ocorrenciasAbertas > 0 ? "warning" : "default"}
        />
      </div>

      {/* Mapa à esquerda; Alertas à direita */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <MapaComarcasCard />
        <AlertsPanel />
      </div>

      {/* 4 gráficos em linha abaixo do mapa */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <EquipamentosDonut />
        <ContratosVigencia />
        <ResultadosOperacionaisPie
          unidadeId={filterUnidade === "todas" ? null : filterUnidade}
          comarcaId={filterComarca === "todas" ? null : filterComarca}
        />
        <ServidoresPorComarca />
      </div>

      {/* Ações Rápidas — escondidas para operador (rotas restritas) */}
      {!isOperador && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-5 bg-accent" aria-hidden="true" />
            <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">Ações rápidas</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ACOES_RAPIDAS.map(({ label, icon: Icon, to, color, bg }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex flex-col overflow-hidden rounded-md border border-border bg-card text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FioAcento />
                <span className="flex w-full items-center gap-2.5 px-3 py-2.5">
                  <span className={`rounded p-1.5 ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </span>
                  <span className="text-[13px] text-foreground">{label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
