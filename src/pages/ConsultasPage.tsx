import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertTriangle, ChevronDown, ChevronRight, ChevronUp, Clock, DoorOpen, Search,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useConsultas } from "@/components/consultas/queries";

const CATEGORY_TONE: Record<string, string> = {
  Equipamentos: "bg-blue-500/10 text-blue-700 border-blue-400/30 dark:text-blue-400",
  Portões:      "bg-orange-500/10 text-orange-700 border-orange-400/30 dark:text-orange-400",
  Pessoal:      "bg-purple-500/10 text-purple-700 border-purple-400/30 dark:text-purple-400",
  Contratos:    "bg-teal-500/10 text-teal-700 border-teal-400/30 dark:text-teal-400",
  Ocorrências:  "bg-red-500/10 text-red-700 border-red-400/30 dark:text-red-400",
};

export default function ConsultasPage() {
  useEffect(() => { document.title = "Consultas | COSEPH TJRO"; }, []);
  const { isOperador } = useAuth();

  const queries = useConsultas();

  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((p) => (p === id ? null : id));
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const toggleRow = (key: string) => setExpandedRow((p) => (p === key ? null : key));

  // Suporte a deep-link via ?q=<id> (vindo dos cartões de alerta do Painel)
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("q");
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (!queryId) return;
    setExpanded(queryId);
    const t = window.setTimeout(() => {
      rowRefs.current[queryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [queryId]);

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
    queries.filter((q) => ["unidades-sem-equipamentos", "itens-nao-distribuidos", "divergencia-contrato", "contratos-vencidos", "ocorrencias-prazo-vencido"].includes(q.id) && q.rows.length > 0).reduce((s, q) => s + q.rows.length, 0),
    [queries],
  );

  // Consultas é restrito a admin/gestor — operador é redirecionado.
  if (isOperador) return <Navigate to="/" replace />;

  return (
    <div>
      <PageHeader
        eyebrow="Análise"
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
                    <div
                      key={q.id}
                      ref={(el) => { rowRefs.current[q.id] = el; }}
                      className={`overflow-hidden rounded-lg border bg-card transition-shadow ${queryId === q.id ? "border-primary/60 shadow-lg ring-1 ring-primary/30" : "border-border"}`}
                    >
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
                                    {q.expandableRow && <TableHead className="w-8" />}
                                    {q.columns.map((col) => (
                                      <TableHead key={col.key} className={col.className}>
                                        {col.label}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {q.rows.map((row, i) => {
                                    const rowKey = `${q.id}:${i}`;
                                    const isRowOpen = q.expandableRow && expandedRow === rowKey;
                                    const colSpan = q.columns.length + (q.expandableRow ? 1 : 0);
                                    return (
                                      <Fragment key={rowKey}>
                                        <TableRow
                                          className={q.expandableRow ? "cursor-pointer hover:bg-muted/40" : undefined}
                                          onClick={q.expandableRow ? () => toggleRow(rowKey) : undefined}
                                        >
                                          {q.expandableRow && (
                                            <TableCell className="w-8 align-middle text-muted-foreground">
                                              {isRowOpen
                                                ? <ChevronDown className="h-4 w-4" />
                                                : <ChevronRight className="h-4 w-4" />}
                                            </TableCell>
                                          )}
                                          {q.columns.map((col) => (
                                            <TableCell
                                              key={col.key}
                                              className={`text-sm ${col.className ?? ""}`}
                                            >
                                              {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                        {isRowOpen && (
                                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={colSpan} className="p-0">
                                              {q.expandableRow!(row)}
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </Fragment>
                                    );
                                  })}
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
