import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown, ChevronLeft, ChevronRight, Clock, Download, FileSpreadsheet,
  FileText, Lock, Paperclip, Pencil, Plus, Trash2, Upload, Wrench,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useAuth } from "@/contexts/AuthContext";
import {
  STATUS_MANUT, CATEGORIAS_NOMES, type OcorrenciaManut, type StatusManut,
  type ManutInput, type SlaTone,
  calcSla, isAberto, tempoAtendimentoDias, slaDiasDaCategoria,
  useOcorrenciasMock, addOcorrenciaMock, updateOcorrenciaMock, removeOcorrenciaMock,
} from "@/data/ocorrenciasMock";
import {
  useAnexos, useUploadAnexo, useDeleteAnexo, getAnexoSignedUrl, type OcorrenciaAnexo,
} from "@/data/api";
import { exportPdfTable, exportExcelMulti, type Column } from "@/lib/exporters";
import { toast } from "@/hooks/use-toast";

// =====================================================================
// Estilos de badges
// =====================================================================
const statusTone: Record<StatusManut, string> = {
  "Aberto":          "bg-partial/15 text-partial border-partial/30",
  "Em andamento":    "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Aguardando peça": "bg-muted text-muted-foreground border-border",
  "Concluído":       "bg-adequate/10 text-adequate border-adequate/30",
  "Cancelado":       "bg-muted text-muted-foreground border-border line-through",
};

const slaToneClass: Record<SlaTone, string> = {
  adequate: "bg-adequate/10 text-adequate border-adequate/30",
  partial:  "bg-partial/15 text-partial border-partial/30",
  critical: "bg-critical/10 text-critical border-critical/30",
  muted:    "bg-muted text-muted-foreground border-border",
};

const CHART_COLORS = [
  "hsl(217 91% 55%)", "hsl(142 65% 45%)", "hsl(42 95% 55%)", "hsl(0 75% 55%)",
  "hsl(262 70% 60%)", "hsl(180 65% 45%)", "hsl(215 15% 60%)", "hsl(30 80% 55%)",
];

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

// =====================================================================
// Validação do formulário
// =====================================================================
const schema = z.object({
  servico: z.string().trim().min(3, "Descreva o serviço (mín. 3 caracteres)").max(500),
  categoria: z.string().min(1, "Selecione a categoria"),
  unidade_id: z.string().min(1, "Selecione o cliente (unidade predial)"),
  servidor_solicitante: z.string().trim().max(160).optional().or(z.literal("")),
  responsavel_nome: z.string().trim().max(160).optional().or(z.literal("")),
  data_abertura: z.string().min(1, "Informe a data de abertura"),
  data_conclusao: z.string().optional().or(z.literal("")),
  status: z.enum(STATUS_MANUT),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = {
  servico: "", categoria: "", unidade_id: "",
  servidor_solicitante: "", responsavel_nome: "",
  data_abertura: today(), data_conclusao: "", status: "Aberto",
};

// =====================================================================
// Página principal
// =====================================================================
export default function OcorrenciasPage() {
  const { isAdmin, isGestor, isOperador, unidadeId, unidadeNome: authUnidadeNome } = useAuth();
  const podeGerenciar = isAdmin || isGestor;

  const itemsAll = useOcorrenciasMock();
  const unidadesAll = useUnidadesMock();
  const items = isOperador && unidadeId
    ? itemsAll.filter((o) => o.unidade_id === unidadeId)
    : itemsAll;
  const unidades = isOperador && unidadeId
    ? unidadesAll.filter((u) => u.id === unidadeId)
    : unidadesAll;
  const unidadeNome = (id: string) => unidadesAll.find((u) => u.id === id)?.nome ?? "—";

  useEffect(() => { document.title = "Manutenção | COSEPH TJRO"; }, []);

  return (
    <div>
      <PageHeader
        title="Manutenção"
        description="Controle de chamados técnicos e manutenção predial, com acompanhamento de SLA por unidade."
      />

      <Tabs defaultValue="chamados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chamados" className="gap-1.5">
            <Wrench className="h-4 w-4" />Chamados
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1.5">
            <FileText className="h-4 w-4" />Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chamados">
          <ChamadosTab
            items={items}
            unidades={unidades}
            unidadeNome={unidadeNome}
            podeGerenciar={podeGerenciar}
            operadorUnidadeId={unidadeId}
            operadorUnidadeNome={authUnidadeNome}
          />
        </TabsContent>

        <TabsContent value="relatorios">
          <RelatoriosTab items={items} unidades={unidades} unidadeNome={unidadeNome} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================================
// ABA: Chamados (listagem + formulário)
// =====================================================================
type SortKey =
  | "protocolo" | "data_abertura" | "data_conclusao" | "sla"
  | "status" | "servico" | "categoria" | "cliente" | "solicitante" | "responsavel";

const slaRank: Record<string, number> = {
  "Atrasado": 4, "Fora do prazo": 4, "Em risco": 3, "No prazo": 2, "—": 1,
};

function ChamadosTab({
  items, unidades, unidadeNome, podeGerenciar, operadorUnidadeId, operadorUnidadeNome,
}: {
  items: OcorrenciaManut[];
  unidades: ReturnType<typeof useUnidadesMock>;
  unidadeNome: (id: string) => string;
  podeGerenciar: boolean;
  operadorUnidadeId: string | null;
  operadorUnidadeNome: string | null;
}) {
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unidadeFilter, setUnidadeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("data_abertura");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OcorrenciaManut | null>(null);
  const [deleting, setDeleting] = useState<OcorrenciaManut | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });
  const slaPreview = calcSla({
    data_abertura: form.watch("data_abertura"),
    categoria: form.watch("categoria"),
    status: form.watch("status"),
    data_conclusao: form.watch("data_conclusao") ?? "",
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = items.filter((o) => {
      if (categoriaFilter !== "all" && o.categoria !== categoriaFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (unidadeFilter !== "all" && o.unidade_id !== unidadeFilter) return false;
      return (
        o.protocolo.toLowerCase().includes(q) ||
        o.servico.toLowerCase().includes(q) ||
        o.categoria.toLowerCase().includes(q) ||
        o.servidor_solicitante.toLowerCase().includes(q) ||
        o.responsavel_nome.toLowerCase().includes(q) ||
        unidadeNome(o.unidade_id).toLowerCase().includes(q)
      );
    });
    const val = (o: OcorrenciaManut): string | number => {
      switch (sortKey) {
        case "protocolo":      return o.protocolo;
        case "data_abertura":  return o.data_abertura;
        case "data_conclusao": return o.data_conclusao || "";
        case "sla":            return slaRank[calcSla(o).indicador] ?? 0;
        case "status":         return o.status;
        case "servico":        return o.servico.toLowerCase();
        case "categoria":      return o.categoria.toLowerCase();
        case "cliente":        return unidadeNome(o.unidade_id).toLowerCase();
        case "solicitante":    return o.servidor_solicitante.toLowerCase();
        case "responsavel":    return o.responsavel_nome.toLowerCase();
      }
    };
    return rows.sort((a, b) => {
      const va = val(a), vb = val(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, search, categoriaFilter, statusFilter, unidadeFilter, sortKey, sortDir, unidades]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ ...defaults, unidade_id: unidades[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (o: OcorrenciaManut) => {
    setEditing(o);
    form.reset({
      servico: o.servico,
      categoria: o.categoria || "",
      unidade_id: o.unidade_id,
      servidor_solicitante: o.servidor_solicitante,
      responsavel_nome: o.responsavel_nome,
      data_abertura: o.data_abertura || today(),
      data_conclusao: o.data_conclusao || "",
      status: o.status,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload: ManutInput = {
      servico: data.servico,
      categoria: data.categoria,
      unidade_id: data.unidade_id,
      servidor_solicitante: data.servidor_solicitante ?? "",
      responsavel_nome: data.responsavel_nome ?? "",
      data_abertura: data.data_abertura,
      data_conclusao: data.data_conclusao ?? "",
      status: data.status,
    };
    try {
      if (editing) {
        await updateOcorrenciaMock(editing.id, payload);
        toast({ title: "Manutenção atualizada" });
      } else {
        await addOcorrenciaMock(payload);
        toast({ title: "Manutenção registrada" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      {!podeGerenciar && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Modo somente leitura — você visualiza apenas os chamados da sua unidade.
        </div>
      )}

      <div className="mb-3 flex justify-end">
        {podeGerenciar && (
          <Button onClick={openCreate} disabled={unidades.length === 0}>
            <Plus className="mr-1 h-4 w-4" />Nova manutenção
          </Button>
        )}
      </div>

      <CrudTableLayout
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="Buscar por número, serviço, categoria, solicitante, responsável ou cliente..."
        count={filtered.length}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={categoriaFilter} onValueChange={(v) => { setCategoriaFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIAS_NOMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_MANUT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {unidades.length > 1 && (
              <Select value={unidadeFilter} onValueChange={(v) => { setUnidadeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Wrench} title="Nenhuma manutenção encontrada" description="Ajuste os filtros ou registre uma nova manutenção." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Número"          k="protocolo"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Aberto em"       k="data_abertura"  sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Data Final"      k="data_conclusao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="SLA"             k="sla"            sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Status"          k="status"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Serviço"         k="servico"        sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Categoria"       k="categoria"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Cliente"         k="cliente"        sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Solicitante TJRO" k="solicitante"   sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Responsável"     k="responsavel"    sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  {podeGerenciar && <TableHead className="w-[90px] text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => {
                  const sla = calcSla(o);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.protocolo}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{fmtDate(o.data_abertura)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{fmtDate(o.data_conclusao)}</TableCell>
                      <TableCell><SlaBadge sla={sla} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusTone[o.status]}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <div className="truncate font-medium" title={o.servico}>{o.servico || "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.categoria || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{unidadeNome(o.unidade_id)}</TableCell>
                      <TableCell className="text-xs">{o.servidor_solicitante || "—"}</TableCell>
                      <TableCell className="text-xs">{o.responsavel_nome || "—"}</TableCell>
                      {podeGerenciar && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(o)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Pagination page={pageSafe} totalPages={totalPages} total={filtered.length} onPage={setPage} />
          </>
        )}
      </CrudTableLayout>

      {/* Formulário (apenas admin/gestor) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar manutenção ${editing.protocolo}` : "Nova manutenção"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Número">
                  <Input value={editing?.protocolo ?? "Gerado automaticamente"} disabled className="bg-muted font-mono text-xs" />
                </Field>
                <Field label="Indicador do SLA">
                  <div className="flex h-10 items-center">
                    <SlaBadge sla={slaPreview} />
                    {form.watch("categoria") && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        prazo {slaDiasDaCategoria(form.watch("categoria"))}d
                        {slaPreview.dataLimite ? ` · limite ${fmtDate(slaPreview.dataLimite)}` : ""}
                      </span>
                    )}
                  </div>
                </Field>
              </div>

              <Field label="Serviço (Completo)" error={form.formState.errors.servico?.message}>
                <Textarea rows={3} {...form.register("servico")} placeholder="Descreva o serviço de manutenção solicitado..." />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoria" error={form.formState.errors.categoria?.message}>
                  <Select value={form.watch("categoria")} onValueChange={(v) => form.setValue("categoria", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_NOMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Cliente (Completo) — Unidade Predial" error={form.formState.errors.unidade_id?.message}>
                  <Select value={form.watch("unidade_id")} onValueChange={(v) => form.setValue("unidade_id", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a unidade..." /></SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Servidor Solicitante (TJRO)">
                  <Input {...form.register("servidor_solicitante")} placeholder="Nome / matrícula do servidor" />
                </Field>
                <Field label="Responsável">
                  <Input {...form.register("responsavel_nome")} placeholder="Empresa ou técnico responsável" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Aberto em" error={form.formState.errors.data_abertura?.message}>
                  <Input type="date" {...form.register("data_abertura")} />
                </Field>
                <Field label="Data Final">
                  <Input type="date" {...form.register("data_conclusao")} />
                </Field>
                <Field label="Status">
                  <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as StatusManut)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_MANUT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            {editing && <AnexosSection ocorrenciaId={editing.id} />}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar alterações" : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await removeOcorrenciaMock(deleting.id);
            toast({ title: "Manutenção excluída" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir a manutenção "${deleting.protocolo} — ${deleting.servico}"?` : undefined}
      />
    </>
  );
}

// =====================================================================
// ABA: Relatórios
// =====================================================================
function RelatoriosTab({
  items, unidades, unidadeNome,
}: {
  items: OcorrenciaManut[];
  unidades: ReturnType<typeof useUnidadesMock>;
  unidadeNome: (id: string) => string;
}) {
  const [unidadeFilter, setUnidadeFilter] = useState("all");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const filtered = useMemo(() => items.filter((o) => {
    if (unidadeFilter !== "all" && o.unidade_id !== unidadeFilter) return false;
    if (categoriaFilter !== "all" && o.categoria !== categoriaFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (de && o.data_abertura && o.data_abertura < de) return false;
    if (ate && o.data_abertura && o.data_abertura > ate) return false;
    return true;
  }), [items, unidadeFilter, categoriaFilter, statusFilter, de, ate]);

  // KPIs
  const total = filtered.length;
  const abertos = filtered.filter((o) => isAberto(o.status)).length;
  const concluidos = filtered.filter((o) => o.status === "Concluído");
  const atrasados = filtered.filter((o) => calcSla(o).indicador === "Atrasado").length;
  const slaNoPrazo = concluidos.filter((o) => calcSla(o).indicador === "No prazo").length;
  const slaFora = concluidos.filter((o) => calcSla(o).indicador === "Fora do prazo").length;
  const pctSla = concluidos.length ? Math.round((slaNoPrazo / concluidos.length) * 100) : 0;
  const tempos = concluidos.map((o) => tempoAtendimentoDias(o)).filter((t): t is number => t != null);
  const tempoMedio = tempos.length ? Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10 : 0;

  // Agregações para gráficos
  const porUnidade = useMemo(() => count(filtered, (o) => unidadeNome(o.unidade_id)), [filtered, unidades]);
  const porCategoria = useMemo(() => count(filtered, (o) => o.categoria || "Sem categoria"), [filtered]);
  const porStatus = useMemo(() => count(filtered, (o) => o.status), [filtered]);
  const slaData = useMemo(
    () => [
      { name: "No prazo", value: slaNoPrazo },
      { name: "Fora do prazo", value: slaFora },
    ].filter((d) => d.value > 0),
    [slaNoPrazo, slaFora],
  );
  const concluidosPorMes = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const hoje = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const m = d.getMonth(), a = d.getFullYear();
      const value = concluidos.filter((o) => {
        if (!o.data_conclusao) return false;
        const dt = new Date(o.data_conclusao + "T00:00:00");
        return dt.getMonth() === m && dt.getFullYear() === a;
      }).length;
      return { name: `${meses[m]}/${String(a).slice(2)}`, value };
    });
  }, [concluidos]);

  // Resumo por unidade (tabela)
  const resumoUnidade = useMemo(() => {
    const map = new Map<string, { unidade: string; total: number; abertos: number; concluidos: number; atrasados: number }>();
    for (const o of filtered) {
      const nome = unidadeNome(o.unidade_id);
      const r = map.get(nome) ?? { unidade: nome, total: 0, abertos: 0, concluidos: 0, atrasados: 0 };
      r.total += 1;
      if (isAberto(o.status)) r.abertos += 1;
      if (o.status === "Concluído") r.concluidos += 1;
      if (calcSla(o).indicador === "Atrasado") r.atrasados += 1;
      map.set(nome, r);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered, unidades]);

  // Exportações
  const linhasChamados = () => filtered.map((o) => ({
    Numero: o.protocolo,
    "Aberto em": fmtDate(o.data_abertura),
    "Data Final": fmtDate(o.data_conclusao),
    SLA: calcSla(o).indicador,
    Status: o.status,
    Servico: o.servico,
    Categoria: o.categoria,
    Cliente: unidadeNome(o.unidade_id),
    "Solicitante TJRO": o.servidor_solicitante,
    Responsavel: o.responsavel_nome,
  }));

  const subtitle = `${total} chamados${de || ate ? ` · período ${de ? fmtDate(de) : "…"} a ${ate ? fmtDate(ate) : "…"}` : ""}`;

  const handlePdf = () => {
    const columns: Column[] = [
      { header: "Número", key: "Numero" }, { header: "Aberto em", key: "Aberto em" },
      { header: "Data Final", key: "Data Final" }, { header: "SLA", key: "SLA" },
      { header: "Status", key: "Status" }, { header: "Serviço", key: "Servico" },
      { header: "Categoria", key: "Categoria" }, { header: "Cliente", key: "Cliente" },
      { header: "Solicitante", key: "Solicitante TJRO" }, { header: "Responsável", key: "Responsavel" },
    ];
    exportPdfTable({
      title: "Relatório de Manutenções — COSEPH/TJRO",
      subtitle, columns, rows: linhasChamados(), fileName: "manutencoes",
    });
    toast({ title: "PDF gerado" });
  };

  const handleExcel = () => {
    exportExcelMulti([
      { name: "Chamados", rows: linhasChamados() },
      { name: "Por unidade", rows: resumoUnidade.map((r) => ({ Unidade: r.unidade, Total: r.total, Abertos: r.abertos, Concluidos: r.concluidos, Atrasados: r.atrasados })) },
      { name: "Por categoria", rows: porCategoria.map((c) => ({ Categoria: c.name, Quantidade: c.value })) },
      { name: "Por status", rows: porStatus.map((c) => ({ Status: c.name, Quantidade: c.value })) },
      { name: "SLA", rows: [{ "No prazo": slaNoPrazo, "Fora do prazo": slaFora, "% no prazo": `${pctSla}%`, "Tempo médio (dias)": tempoMedio }] },
    ], "manutencoes");
    toast({ title: "Excel gerado" });
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          {unidades.length > 1 && (
            <FilterField label="Cliente (unidade)">
              <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
          )}
          <FilterField label="Categoria">
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIAS_NOMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_MANUT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="De"><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9 w-[150px]" /></FilterField>
          <FilterField label="Até"><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9 w-[150px]" /></FilterField>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcel}><FileSpreadsheet className="mr-1 h-4 w-4" />Excel</Button>
            <Button variant="outline" size="sm" onClick={handlePdf}><Download className="mr-1 h-4 w-4" />PDF</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total" value={total} />
        <Kpi label="Em aberto" value={abertos} />
        <Kpi label="Concluídos" value={concluidos.length} />
        <Kpi label="Atrasados" value={atrasados} tone="critical" />
        <Kpi label="SLA no prazo" value={`${pctSla}%`} tone={pctSla >= 70 ? "adequate" : pctSla >= 40 ? "partial" : "critical"} />
        <Kpi label="Tempo médio (dias)" value={tempoMedio} />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Manutenções por unidade"><BarH data={porUnidade} /></ChartCard>
        <ChartCard title="Manutenções por categoria"><BarH data={porCategoria} /></ChartCard>
        <ChartCard title="Manutenções por status"><Donut data={porStatus} /></ChartCard>
        <ChartCard title="SLA — No prazo × Fora do prazo (concluídos)"><Donut data={slaData} /></ChartCard>
        <ChartCard title="Chamados concluídos por período (6 meses)"><BarV data={concluidosPorMes} /></ChartCard>
      </div>

      {/* Tabela resumo */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Resumo por unidade</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {resumoUnidade.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Sem dados no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade (Cliente)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Em aberto</TableHead>
                  <TableHead className="text-right">Concluídos</TableHead>
                  <TableHead className="text-right">Atrasados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumoUnidade.map((r) => (
                  <TableRow key={r.unidade}>
                    <TableCell className="font-medium">{r.unidade}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right">{r.abertos}</TableCell>
                    <TableCell className="text-right">{r.concluidos}</TableCell>
                    <TableCell className="text-right">
                      {r.atrasados > 0
                        ? <span className="font-medium text-critical">{r.atrasados}</span>
                        : r.atrasados}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// Componentes auxiliares
// =====================================================================
function SortableHead({
  label, k, sortKey, sortDir, onSort,
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc"; onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`flex items-center gap-1 hover:text-foreground ${active ? "text-foreground font-semibold" : ""}`}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-30"}`} />
      </button>
    </TableHead>
  );
}

function SlaBadge({ sla }: { sla: ReturnType<typeof calcSla> }) {
  const Icon = sla.tone === "critical" ? Clock : undefined;
  return (
    <Badge variant="outline" className={slaToneClass[sla.tone]}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {sla.indicador}
      {sla.diasRestantes != null && sla.indicador === "Atrasado" && ` ${Math.abs(sla.diasRestantes)}d`}
    </Badge>
  );
}

function Pagination({
  page, totalPages, total, onPage,
}: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>Página {page} de {totalPages} · {total} registros</span>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: SlaTone }) {
  const color = tone === "critical" ? "text-critical" : tone === "partial" ? "text-partial" : tone === "adequate" ? "text-adequate" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  color: "hsl(var(--card-foreground))", borderRadius: 6,
} as const;

function BarH({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={150} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="hsl(217 91% 55%)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarV({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -10, right: 16, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="hsl(142 65% 45%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty() {
  return <p className="py-12 text-center text-xs text-muted-foreground">Sem dados</p>;
}

function count<T>(arr: T[], key: (t: T) => string) {
  const map = new Map<string, number>();
  arr.forEach((it) => {
    const k = key(it);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// =====================================================================
// Anexos (mantido do módulo anterior)
// =====================================================================
function AnexosSection({ ocorrenciaId }: { ocorrenciaId: string }) {
  const { data: anexos = [], isLoading } = useAnexos(ocorrenciaId);
  const upload = useUploadAnexo();
  const remove = useDeleteAnexo();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync({ ocorrenciaId, file });
        toast({ title: `Arquivo "${file.name}" anexado` });
      } catch (e: any) {
        toast({ title: "Erro ao anexar", description: e.message, variant: "destructive" });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = async (anexo: OcorrenciaAnexo) => {
    try {
      const url = await getAnexoSignedUrl(anexo.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({ title: "Erro ao baixar", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (anexo: OcorrenciaAnexo) => {
    try {
      await remove.mutateAsync(anexo);
      toast({ title: `Arquivo "${anexo.nome_arquivo}" removido` });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const fmtSize = (b: number | null) => {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />Anexos
        </p>
        <Button
          type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs"
          disabled={upload.isPending} onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {upload.isPending ? "Enviando..." : "Adicionar arquivo"}
        </Button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Carregando anexos...</p>}
      {!isLoading && anexos.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum arquivo anexado.</p>}

      {anexos.length > 0 && (
        <ul className="space-y-1.5">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{a.nome_arquivo}</span>
              {a.tamanho && <span className="shrink-0 text-muted-foreground">{fmtSize(a.tamanho)}</span>}
              <span className="shrink-0 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDownload(a)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon"
                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                disabled={remove.isPending} onClick={() => handleDelete(a)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
