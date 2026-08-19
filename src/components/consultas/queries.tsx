// Catálogo de consultas prontas exibidas na página de Consultas.
// Cada QueryDef declara colunas e já traz as linhas calculadas.
import { useMemo, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle, Cpu, FileText, KeyRound, Shield, UserCog, Users, Wrench, XCircle,
} from "lucide-react";
import { useUnidades } from "@/data/unidades";
import { useEquipamentosCatalogo, useUnidadeEquipamentos } from "@/data/equipamentos";
import { useServidores } from "@/data/servidores";
import { useTerceirizados } from "@/data/terceirizados";
import { useContratos } from "@/data/contratos";
import { useOcorrencias } from "@/data/ocorrencias";
import { addDiasISO, diffDiasISO, hojeISO } from "@/lib/dates";

export type Row = Record<string, unknown>;

export type Column = {
  key: string;
  label: string;
  className?: string;
  render?: (row: Row) => ReactNode;
};

export type QueryDef = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: ElementType;
  rows: Row[];
  columns: Column[];
  expandableRow?: (row: Row) => ReactNode;
};

const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
const fmtBRL  = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function useConsultas(): QueryDef[] {
  const unidades      = useUnidades();
  const catalogo      = useEquipamentosCatalogo();
  const distribuicao  = useUnidadeEquipamentos();
  const servidores    = useServidores();
  const terceirizados = useTerceirizados();
  const contratos     = useContratos();
  const ocorrencias   = useOcorrencias();

  // Datas como texto YYYY-MM-DD no fuso de Rondônia: comparar como string é
  // exato e evita o desvio de fuso que o Date local introduzia aqui.
  const hoje = hojeISO();
  const em90 = addDiasISO(hoje, 90);

  const uMap = useMemo(() => new Map(unidades.map((u) => [u.id, u])), [unidades]);


  return useMemo((): QueryDef[] => [

    // ── Equipamentos (Contrato 115/2023) ──────────────────────────
    {
      id: "cameras-por-comarca",
      title: "Câmeras por comarca",
      description: "Soma de câmeras (Dome, Bullet, Fisheye, PTZ) por comarca.",
      category: "Equipamentos",
      icon: Cpu,
      columns: [
        { key: "comarca", label: "Comarca" },
        { key: "dome",    label: "Dome",     className: "text-right" },
        { key: "bullet",  label: "Bullet",   className: "text-right" },
        { key: "fisheye", label: "Fisheye",  className: "text-right" },
        { key: "ptz",     label: "PTZ",      className: "text-right" },
        { key: "total",   label: "Total",    className: "text-right font-semibold" },
      ],
      rows: (() => {
        const map = new Map<string, { comarca: string; dome: number; bullet: number; fisheye: number; ptz: number; total: number }>();
        distribuicao.filter((d) => [1, 2, 3, 4].includes(d.item_num)).forEach((d) => {
          const comarca = d.comarca_nome || "—";
          const cur = map.get(comarca) ?? { comarca, dome: 0, bullet: 0, fisheye: 0, ptz: 0, total: 0 };
          if (d.item_num === 1) cur.dome += d.quantidade;
          if (d.item_num === 2) cur.bullet += d.quantidade;
          if (d.item_num === 3) cur.fisheye += d.quantidade;
          if (d.item_num === 4) cur.ptz += d.quantidade;
          cur.total += d.quantidade;
          map.set(comarca, cur);
        });
        return [...map.values()].sort((a, b) => b.total - a.total);
      })(),
    },

    {
      id: "unidades-sem-equipamentos",
      title: "Unidades sem equipamentos cadastrados",
      description: "Unidades prediais que ainda não têm nenhum item do contrato vinculado.",
      category: "Equipamentos",
      icon: XCircle,
      columns: [
        { key: "unidade", label: "Unidade" },
        { key: "comarca", label: "Comarca" },
        { key: "derso",   label: "DERSO" },
      ],
      rows: (() => {
        const comVinculo = new Set(distribuicao.map((d) => d.unidade_id));
        return unidades
          .filter((u) => !comVinculo.has(u.id))
          .map((u) => ({ unidade: u.nome, comarca: u.comarca_nome, derso: u.possui_derso ? "Sim" : "Não" }))
          .sort((a, b) => a.comarca.localeCompare(b.comarca));
      })(),
    },

    {
      id: "itens-nao-distribuidos",
      title: "Itens do catálogo sem distribuição",
      description: "Itens do contrato 115/2023 que não foram vinculados a nenhuma unidade.",
      category: "Equipamentos",
      icon: Shield,
      columns: [
        { key: "item",         label: "Item",             className: "font-mono text-xs" },
        { key: "descricao",    label: "Descrição" },
        { key: "unidade_med",  label: "Unid.",            className: "text-xs" },
        { key: "qtd_contrato", label: "Qtd. contrato",    className: "text-right" },
      ],
      rows: (() => {
        const itensComVinculo = new Set(distribuicao.map((d) => d.item_num));
        return catalogo
          .filter((c) => !itensComVinculo.has(c.item_num))
          .map((c) => ({
            item: `#${String(c.item_num).padStart(2, "0")}`,
            descricao: c.descricao,
            unidade_med: c.unidade_medida,
            qtd_contrato: c.qtd_contrato,
          }))
          .sort((a, b) => Number(a.item.slice(1)) - Number(b.item.slice(1)));
      })(),
    },

    {
      id: "divergencia-contrato",
      title: "Divergências contrato × distribuição",
      description: "Itens cuja soma das quantidades distribuídas difere do total contratado. Clique numa linha para ver as unidades.",
      category: "Equipamentos",
      icon: AlertTriangle,
      columns: [
        { key: "item",         label: "Item",        className: "font-mono text-xs" },
        { key: "descricao",    label: "Descrição" },
        { key: "qtd_contrato", label: "Contratado",  className: "text-right" },
        { key: "qtd_dist",     label: "Distribuído", className: "text-right" },
        {
          key: "diff",
          label: "Diferença",
          className: "text-right font-semibold",
          render: (row) => {
            const diff = row._diff as number;
            const cor = diff > 0 ? "text-amber-600 dark:text-amber-500" : "text-red-600 dark:text-red-500";
            const txt = diff > 0 ? `Falta ${diff}` : `Sobra ${Math.abs(diff)}`;
            return <span className={cor}>{txt}</span>;
          },
        },
      ],
      rows: (() => {
        const distPorItem = new Map<number, { total: number; unidades: { nome: string; comarca: string; qtd: number }[] }>();
        for (const d of distribuicao) {
          const cur = distPorItem.get(d.item_num) ?? { total: 0, unidades: [] };
          cur.total += d.quantidade;
          cur.unidades.push({ nome: d.unidade_nome, comarca: d.comarca_nome, qtd: d.quantidade });
          distPorItem.set(d.item_num, cur);
        }
        return catalogo
          .map((c) => {
            const entry = distPorItem.get(c.item_num);
            const qtd_dist = entry?.total ?? 0;
            const diff = c.qtd_contrato - qtd_dist;
            return {
              item: `#${String(c.item_num).padStart(2, "0")}`,
              descricao: c.descricao,
              qtd_contrato: c.qtd_contrato,
              qtd_dist,
              _diff: diff,
              _unidades: (entry?.unidades ?? []).sort((a, b) => b.qtd - a.qtd),
            };
          })
          .filter((r) => r._diff !== 0)
          .sort((a, b) => Math.abs(b._diff) - Math.abs(a._diff));
      })(),
      expandableRow: (row) => {
        const unidades = row._unidades as { nome: string; comarca: string; qtd: number }[];
        const diff = row._diff as number;
        if (unidades.length === 0) {
          return (
            <p className="px-4 py-3 text-sm italic text-muted-foreground">
              Nenhuma unidade recebeu este item — falta distribuir todas as {row.qtd_contrato as number} unidades contratadas.
            </p>
          );
        }
        return (
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Distribuição atual ({unidades.length} {unidades.length === 1 ? "unidade" : "unidades"})
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {unidades.map((u, i) => (
                <div key={i} className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{u.nome}</span>
                    <span className="ml-1 text-xs text-muted-foreground">· {u.comarca}</span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">{u.qtd}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {diff > 0
                ? <>Soma distribuída <strong>{row.qtd_dist as number}</strong> de <strong>{row.qtd_contrato as number}</strong> contratadas — <span className="text-amber-600 dark:text-amber-500">faltam {diff}</span>.</>
                : <>Soma distribuída <strong>{row.qtd_dist as number}</strong> excede o contratado em <strong>{row.qtd_contrato as number}</strong> — <span className="text-red-600 dark:text-red-500">sobram {Math.abs(diff)}</span>.</>}
            </p>
          </div>
        );
      },
    },

    {
      id: "valor-por-unidade",
      title: "Valor mensal estimado por unidade",
      description: "Top 15 unidades com maior valor mensal de equipamentos vinculados.",
      category: "Equipamentos",
      icon: FileText,
      columns: [
        { key: "unidade", label: "Unidade" },
        { key: "comarca", label: "Comarca" },
        { key: "itens",   label: "Itens distintos", className: "text-right" },
        { key: "qtd",     label: "Qtd. total",      className: "text-right" },
        { key: "valor",   label: "Valor mensal",    className: "text-right font-semibold" },
      ],
      rows: (() => {
        const map = new Map<string, { unidade: string; comarca: string; itens: number; qtd: number; valor: number }>();
        for (const d of distribuicao) {
          const cur = map.get(d.unidade_id) ?? { unidade: d.unidade_nome, comarca: d.comarca_nome, itens: 0, qtd: 0, valor: 0 };
          cur.itens++;
          cur.qtd += d.quantidade;
          cur.valor += d.quantidade * d.valor_unitario;
          map.set(d.unidade_id, cur);
        }
        return [...map.values()]
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 15)
          .map((r) => ({ ...r, valor: fmtBRL(r.valor) }));
      })(),
    },

    // ── Portões ───────────────────────────────────────────────────
    {
      id: "kit-rfid-instalado",
      title: "Kit RFID instalado",
      description: "Unidades prediais que possuem o Kit Abertura de Portão por RFID (item #27).",
      category: "Portões",
      icon: KeyRound,
      columns: [
        { key: "unidade",    label: "Unidade" },
        { key: "comarca",    label: "Comarca" },
        { key: "quantidade", label: "Quantidade", className: "text-right" },
        { key: "observacoes", label: "Observações" },
      ],
      rows: distribuicao
        .filter((d) => d.item_num === 27 && d.quantidade > 0)
        .map((d) => ({
          unidade: d.unidade_nome,
          comarca: d.comarca_nome || "—",
          quantidade: d.quantidade,
          observacoes: d.observacoes || "—",
        }))
        .sort(
          (a, b) =>
            String(a.comarca).localeCompare(String(b.comarca), "pt-BR") ||
            String(a.unidade).localeCompare(String(b.unidade), "pt-BR"),
        ),
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
          const comarca = s.unidade_id ? (uMap.get(s.unidade_id)?.comarca_nome ?? "—") : "—";
          map.set(comarca, (map.get(comarca) ?? 0) + 1);
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
        .filter((c) => c.data_fim && c.data_fim < hoje)
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
        .filter((c) => !!c.data_fim && c.data_fim >= hoje && c.data_fim <= em90)
        .map((c) => ({ numero: c.numero, empresa: c.empresa, data_fim: fmtDate(c.data_fim), dias: diffDiasISO(hoje, c.data_fim), valor_total: fmtBRL(c.valor_total) }))
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
        .filter((o) => o.prazo && o.status !== "Concluído" && o.status !== "Cancelado" && o.prazo < hoje)
        .map((o) => {
          const u = uMap.get(o.unidade_id);
          return { protocolo: o.protocolo, titulo: o.titulo, unidade: u?.nome ?? "—", prazo: fmtDate(o.prazo), atraso: Math.abs(diffDiasISO(hoje, o.prazo)), prioridade: o.prioridade };
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
            const cur = map.get(o.unidade_id) ?? { unidade: u?.nome ?? "—", comarca: u?.comarca_nome ?? "—", abertas: 0, urgentes: 0 };
            cur.abertas++;
            if (o.prioridade === "Urgente") cur.urgentes++;
            map.set(o.unidade_id, cur);
          });
        return [...map.values()].sort((a, b) => (b.urgentes as number) - (a.urgentes as number) || (b.abertas as number) - (a.abertas as number));
      })(),
    },

  ], [unidades, catalogo, distribuicao, servidores, terceirizados, contratos, ocorrencias, hoje, em90, uMap]);
}
