import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ChevronDown, ChevronUp, Clock, Cpu, DoorOpen,
  FileText, Search, Shield, Users, UserCog, Wrench, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { usePortoesMock } from "@/data/portoesMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useContratosMock } from "@/data/contratosMock";
import { useOcorrenciasMock } from "@/data/ocorrenciasMock";

type Column = { key: string; label: string; className?: string };
type QueryDef = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  rows: Record<string, unknown>[];
  columns: Column[];
};

const CATEGORY_TONE: Record<string, string> = {
  Equipamentos: "bg-blue-500/10 text-blue-700 border-blue-400/30 dark:text-blue-400",
  Portões:      "bg-orange-500/10 text-orange-700 border-orange-400/30 dark:text-orange-400",
  Pessoal:      "bg-purple-500/10 text-purple-700 border-purple-400/30 dark:text-purple-400",
  Contratos:    "bg-teal-500/10 text-teal-700 border-teal-400/30 dark:text-teal-400",
  Ocorrências:  "bg-red-500/10 text-red-700 border-red-400/30 dark:text-red-400",
};

const fmtDate  = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
const fmtBRL   = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const diffDays = (d: string, ref: Date) =>
  Math.floor((new Date(d + "T00:00:00").getTime() - ref.getTime()) / 86_400_000);

export default function ConsultasPage() {
  useEffect(() => { document.title = "Consultas | COSEPH TJRO"; }, []);

  const unidades    = useUnidadesMock();
  const equipamentos = useEquipamentosMock();
  const portoes     = usePortoesMock();
  const servidores  = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const contratos   = useContratosMock();
  const ocorrencias = useOcorrenciasMock();

  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((p) => (p === id ? null : id));

  const hoje = useMemo(() => new Date(), []);
  const em90 = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 90); return d; }, []);

  const uMap = useMemo(() => new Map(unidades.map((u) => [u.id, u])), [unidades]);

  const queries = useMemo((): QueryDef[] => [

    // ── Equipamentos ──────────────────────────────────────────────
    {
      id: "cameras-por-comarca",
      title: "Câmeras por comarca",
      description: "Quantas câmeras há em cada comarca, com breakdown operacional/inoperante.",
      category: "Equipamentos",
      icon: Cpu,
      columns: [
        { key: "comarca",      label: "Comarca" },
        { key: "total",        label: "Total" },
        { key: "operacionais", label: "Operacionais" },
        { key: "inoperantes",  label: "Inoperantes" },
      ],
      rows: (() => {
        const map = new Map<string, { total: number; operacionais: number; inoperantes: number }>();
        equipamentos.filter((e) => e.tipo === "Câmera").forEach((e) => {
          const comarca = uMap.get(e.unidade_id)?.comarca ?? "—";
          const cur = map.get(comarca) ?? { total: 0, operacionais: 0, inoperantes: 0 };
          cur.total++;
          if (e.status === "Operacional") cur.operacionais++;
          if (e.status === "Inoperante")  cur.inoperantes++;
          map.set(comarca, cur);
        });
        return [...map.entries()]
          .map(([comarca, v]) => ({ comarca, ...v }))
          .sort((a, b) => (b.total as number) - (a.total as number));
      })(),
    },

    {
      id: "unidades-scanner",
      title: "Unidades com Scanner Raio-X",
      description: "Locais que possuem Scanner Raio-X cadastrado no inventário.",
      category: "Equipamentos",
      icon: Shield,
      columns: [
        { key: "unidade",      label: "Unidade" },
        { key: "comarca",      label: "Comarca" },
        { key: "identificacao", label: "Identificação" },
        { key: "status",       label: "Status" },
      ],
      rows: equipamentos
        .filter((e) => e.tipo === "Scanner Raio-X")
        .map((e) => {
          const u = uMap.get(e.unidade_id);
          return { unidade: u?.nome ?? "—", comarca: u?.comarca ?? "—", identificacao: e.identificacao, status: e.status };
        })
        .sort((a, b) => String(a.comarca).localeCompare(String(b.comarca))),
    },

    {
      id: "unidades-detector",
      title: "Unidades com Detector de Metais",
      description: "Locais que possuem detector de metais cadastrado.",
      category: "Equipamentos",
      icon: Shield,
      columns: [
        { key: "unidade",       label: "Unidade" },
        { key: "comarca",       label: "Comarca" },
        { key: "identificacao", label: "Identificação" },
        { key: "status",        label: "Status" },
      ],
      rows: equipamentos
        .filter((e) => e.tipo === "Detector de metais")
        .map((e) => {
          const u = uMap.get(e.unidade_id);
          return { unidade: u?.nome ?? "—", comarca: u?.comarca ?? "—", identificacao: e.identificacao, status: e.status };
        })
        .sort((a, b) => String(a.comarca).localeCompare(String(b.comarca))),
    },

    {
      id: "equipamentos-inoperantes",
      title: "Equipamentos inoperantes",
      description: "Todos os equipamentos com status Inoperante.",
      category: "Equipamentos",
      icon: XCircle,
      columns: [
        { key: "identificacao", label: "Identificação" },
        { key: "tipo",          label: "Tipo" },
        { key: "unidade",       label: "Unidade" },
        { key: "comarca",       label: "Comarca" },
      ],
      rows: equipamentos
        .filter((e) => e.status === "Inoperante")
        .map((e) => {
          const u = uMap.get(e.unidade_id);
          return { identificacao: e.identificacao, tipo: e.tipo, unidade: u?.nome ?? "—", comarca: u?.comarca ?? "—" };
        }),
    },

    {
      id: "garantias-vencidas",
      title: "Garantias vencidas",
      description: "Equipamentos cuja garantia já expirou.",
      category: "Equipamentos",
      icon: Clock,
      columns: [
        { key: "identificacao", label: "Identificação" },
        { key: "tipo",          label: "Tipo" },
        { key: "unidade",       label: "Unidade" },
        { key: "garantia_ate",  label: "Garantia até" },
      ],
      rows: equipamentos
        .filter((e) => e.garantia_ate && new Date(e.garantia_ate + "T00:00:00") < hoje)
        .map((e) => {
          const u = uMap.get(e.unidade_id);
          return { identificacao: e.identificacao, tipo: e.tipo, unidade: u?.nome ?? "—", garantia_ate: fmtDate(e.garantia_ate) };
        }),
    },

    {
      id: "garantias-vencendo",
      title: "Garantias vencendo em 90 dias",
      description: "Equipamentos com garantia próxima do vencimento.",
      category: "Equipamentos",
      icon: Clock,
      columns: [
        { key: "identificacao", label: "Identificação" },
        { key: "tipo",          label: "Tipo" },
        { key: "unidade",       label: "Unidade" },
        { key: "garantia_ate",  label: "Garantia até" },
        { key: "dias",          label: "Dias restantes", className: "text-right" },
      ],
      rows: equipamentos
        .filter((e) => {
          if (!e.garantia_ate) return false;
          const fim = new Date(e.garantia_ate + "T00:00:00");
          return fim >= hoje && fim <= em90;
        })
        .map((e) => {
          const u = uMap.get(e.unidade_id);
          return { identificacao: e.identificacao, tipo: e.tipo, unidade: u?.nome ?? "—", garantia_ate: fmtDate(e.garantia_ate), dias: diffDays(e.garantia_ate, hoje) };
        })
        .sort((a, b) => (a.dias as number) - (b.dias as number)),
    },

    // ── Portões ───────────────────────────────────────────────────
    {
      id: "portoes-urgentes",
      title: "Portões com manutenção urgente/alta",
      description: "Portões que requerem atenção imediata ou prioritária.",
      category: "Portões",
      icon: DoorOpen,
      columns: [
        { key: "identificacao", label: "Identificação" },
        { key: "unidade",       label: "Unidade" },
        { key: "comarca",       label: "Comarca" },
        { key: "necessidade",   label: "Necessidade" },
        { key: "descricao",     label: "Descrição" },
      ],
      rows: portoes
        .filter((p) => p.necessidade_manutencao === "Alta" || p.necessidade_manutencao === "Urgente")
        .map((p) => {
          const u = uMap.get(p.unidade_id);
          return { identificacao: p.identificacao, unidade: u?.nome ?? "—", comarca: u?.comarca ?? "—", necessidade: p.necessidade_manutencao, descricao: p.descricao_manutencao || "—" };
        }),
    },

    {
      id: "portoes-inoperantes",
      title: "Portões inoperantes",
      description: "Portões com situação Inoperante ou Em manutenção.",
      category: "Portões",
      icon: DoorOpen,
      columns: [
        { key: "identificacao", label: "Identificação" },
        { key: "tipo",          label: "Tipo" },
        { key: "situacao",      label: "Situação" },
        { key: "unidade",       label: "Unidade" },
        { key: "comarca",       label: "Comarca" },
      ],
      rows: portoes
        .filter((p) => p.situacao === "Inoperante" || p.situacao === "Em manutenção")
        .map((p) => {
          const u = uMap.get(p.unidade_id);
          return { identificacao: p.identificacao, tipo: p.tipo, situacao: p.situacao, unidade: u?.nome ?? "—", comarca: u?.comarca ?? "—" };
        }),
    },

    // ── Pessoal ───────────────────────────────────────────────────
    {
      id: "servidores-por-comarca",
      title: "Servidores ativos por comarca",
      description: "Contagem de servidores com situação Ativo agrupados por comarca.",
      category: "Pessoal",
      icon: Users,
      columns: [
        { key: "comarca", label: "Comarca" },
        { key: "total",   label: "Ativos", className: "text-right" },
      ],
      rows: (() => {
        const map = new Map<string, number>();
        servidores.filter((s) => s.situacao === "Ativo").forEach((s) => {
          map.set(s.comarca, (map.get(s.comarca) ?? 0) + 1);
        });
        return [...map.entries()]
          .map(([comarca, total]) => ({ comarca, total }))
          .sort((a, b) => (b.total as number) - (a.total as number));
      })(),
    },

    {
      id: "terceirizados-por-empresa",
      title: "Terceirizados por empresa",
      description: "Quantitativo de terceirizados ativos e total por empresa contratada.",
      category: "Pessoal",
      icon: UserCog,
      columns: [
        { key: "empresa", label: "Empresa" },
        { key: "ativos",  label: "Ativos",         className: "text-right" },
        { key: "total",   label: "Total cadastrado", className: "text-right" },
      ],
      rows: (() => {
        const map = new Map<string, { ativos: number; total: number }>();
        terceirizados.forEach((t) => {
          const cur = map.get(t.empresa) ?? { ativos: 0, total: 0 };
          cur.total++;
          if (t.situacao === "Ativo") cur.ativos++;
          map.set(t.empresa, cur);
        });
        return [...map.entries()]
          .map(([empresa, v]) => ({ empresa, ...v }))
          .sort((a, b) => (b.ativos as number) - (a.ativos as number));
      })(),
    },

    // ── Contratos ─────────────────────────────────────────────────
    {
      id: "contratos-vencidos",
      title: "Contratos vencidos",
      description: "Contratos com data de término anterior a hoje.",
      category: "Contratos",
      icon: FileText,
      columns: [
        { key: "numero",      label: "Número" },
        { key: "empresa",     label: "Empresa" },
        { key: "data_fim",    label: "Vencimento" },
        { key: "valor_total", label: "Valor total", className: "text-right" },
      ],
      rows: contratos
        .filter((c) => c.data_fim && new Date(c.data_fim + "T00:00:00") < hoje)
        .map((c) => ({ numero: c.numero, empresa: c.empresa, data_fim: fmtDate(c.data_fim), valor_total: fmtBRL(c.valor_total) }))
        .sort((a, b) => String(a.data_fim).localeCompare(String(b.data_fim))),
    },

    {
      id: "contratos-vencendo",
      title: "Contratos vencendo em 90 dias",
      description: "Contratos que vencem nos próximos 90 dias.",
      category: "Contratos",
      icon: FileText,
      columns: [
        { key: "numero",      label: "Número" },
        { key: "empresa",     label: "Empresa" },
        { key: "data_fim",    label: "Vencimento" },
        { key: "dias",        label: "Dias restantes", className: "text-right" },
        { key: "valor_total", label: "Valor total",    className: "text-right" },
      ],
      rows: contratos
        .filter((c) => {
          if (!c.data_fim) return false;
          const fim = new Date(c.data_fim + "T00:00:00");
          return fim >= hoje && fim <= em90;
        })
        .map((c) => ({ numero: c.numero, empresa: c.empresa, data_fim: fmtDate(c.data_fim), dias: diffDays(c.data_fim, hoje), valor_total: fmtBRL(c.valor_total) }))
        .sort((a, b) => (a.dias as number) - (b.dias as number)),
    },

    // ── Ocorrências ───────────────────────────────────────────────
    {
      id: "ocorrencias-prazo-vencido",
      title: "Ocorrências com prazo vencido",
      description: "Ocorrências em aberto cujo prazo de atendimento já passou.",
      category: "Ocorrências",
      icon: AlertTriangle,
      columns: [
        { key: "protocolo",  label: "Protocolo", className: "font-mono text-xs" },
        { key: "titulo",     label: "Título" },
        { key: "unidade",    label: "Unidade" },
        { key: "prazo",      label: "Prazo" },
        { key: "atraso",     label: "Atraso (dias)", className: "text-right" },
        { key: "prioridade", label: "Prioridade" },
      ],
      rows: ocorrencias
        .filter((o) => o.prazo && o.status !== "Concluído" && o.status !== "Cancelado" && new Date(o.prazo + "T00:00:00") < hoje)
        .map((o) => {
          const u = uMap.get(o.unidade_id);
          return { protocolo: o.protocolo, titulo: o.titulo, unidade: u?.nome ?? "—", prazo: fmtDate(o.prazo), atraso: Math.abs(diffDays(o.prazo, hoje)), prioridade: o.prioridade };
        })
        .sort((a, b) => (b.atraso as number) - (a.atraso as number)),
    },

    {
      id: "ocorrencias-por-unidade",
      title: "Ocorrências abertas por unidade",
      description: "Ocorrências não concluídas agrupadas por unidade.",
      category: "Ocorrências",
      icon: Wrench,
      columns: [
        { key: "unidade",  label: "Unidade" },
        { key: "comarca",  label: "Comarca" },
        { key: "abertas",  label: "Abertas",  className: "text-right" },
        { key: "urgentes", label: "Urgentes", className: "text-right" },
      ],
      rows: (() => {
        const map = new Map<string, { unidade: string; comarca: string; abertas: number; urgentes: number }>();
        ocorrencias
          .filter((o) => o.status !== "Concluído" && o.status !== "Cancelado")
          .forEach((o) => {
            const u = uMap.get(o.unidade_id);
            const cur = map.get(o.unidade_id) ?? { unidade: u?.nome ?? "—", comarca: u?.comarca ?? "—", abertas: 0, urgentes: 0 };
            cur.abertas++;
            if (o.prioridade === "Urgente") cur.urgentes++;
            map.set(o.unidade_id, cur);
          });
        return [...map.values()].sort((a, b) => (b.urgentes as number) - (a.urgentes as number) || (b.abertas as number) - (a.abertas as number));
      })(),
    },

  ], [unidades, equipamentos, portoes, servidores, terceirizados, contratos, ocorrencias, hoje, em90, uMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return queries;
    const q = search.toLowerCase();
    return queries.filter(
      (qd) =>
        qd.title.toLowerCase().includes(q) ||
        qd.category.toLowerCase().includes(q) ||
        qd.description.toLowerCase().includes(q),
    );
  }, [queries, search]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    filtered.forEach((q) => { if (!seen.has(q.category)) { seen.add(q.category); list.push(q.category); } });
    return list;
  }, [filtered]);

  const totalAlertas = useMemo(() =>
    queries.filter((q) => ["equipamentos-inoperantes", "garantias-vencidas", "portoes-urgentes", "portoes-inoperantes", "contratos-vencidos", "ocorrencias-prazo-vencido"].includes(q.id) && q.rows.length > 0).reduce((s, q) => s + q.rows.length, 0),
    [queries],
  );

  return (
    <div>
      <PageHeader
        title="Consultas"
        description="Relatórios e buscas cruzadas sobre equipamentos, pessoal, contratos e ocorrências."
        actions={
          totalAlertas > 0 ? (
            <div className="flex items-center gap-1.5 rounded-md border border-critical/30 bg-critical/10 px-3 py-1.5 text-xs font-medium text-critical">
              <AlertTriangle className="h-3.5 w-3.5" />
              {totalAlertas} itens requerem atenção
            </div>
          ) : undefined
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filtrar por título, categoria ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma consulta encontrada para "{search}".</p>
      )}

      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {cat}
            </h2>
            <div className="space-y-2">
              {filtered
                .filter((q) => q.category === cat)
                .map((q) => {
                  const isOpen = expanded === q.id;
                  const tone = CATEGORY_TONE[q.category] ?? "";
                  return (
                    <div key={q.id} className="overflow-hidden rounded-lg border border-border bg-card">
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                        onClick={() => toggle(q.id)}
                      >
                        <q.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">{q.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{q.description}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-xs tabular-nums ${tone}`}>
                          {q.rows.length}
                        </Badge>
                        {isOpen
                          ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                      </button>

                      {isOpen && (
                        <div className="border-t border-border">
                          {q.rows.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm italic text-muted-foreground">
                              Nenhum resultado encontrado.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {q.columns.map((col) => (
                                      <TableHead key={col.key} className={col.className}>
                                        {col.label}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {q.rows.map((row, i) => (
                                    <TableRow key={i}>
                                      {q.columns.map((col) => (
                                        <TableCell
                                          key={col.key}
                                          className={`text-sm ${col.className ?? ""}`}
                                        >
                                          {String(row[col.key] ?? "—")}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
