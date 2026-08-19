import { useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import {
  ArrowUpDown, ChevronLeft, ChevronRight, Clock, Lock, Paperclip,
  Plus, Wrench,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { AcoesLinha } from "@/components/admin/AcoesLinha";
import { Badge } from "@/components/ui/badge";
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
import {
  STATUS_MANUT, CATEGORIAS_NOMES, type OcorrenciaManut, type StatusManut,
  type ManutInput,
  calcSla, isAberto, slaDiasDaCategoria,
  addOcorrencia, updateOcorrencia, removeOcorrencia,
} from "@/data/ocorrencias";
import { useUnidades } from "@/data/unidades";
import { toast } from "@/hooks/use-toast";
import { AnexosSection } from "./AnexosSection";
import { statusTone, slaToneClass, fmtDate, today } from "./formatacao";

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
// ABA: Chamados (listagem + formulário)
// =====================================================================
type SortKey =
  | "protocolo" | "data_abertura" | "data_conclusao" | "sla"
  | "status" | "servico" | "categoria" | "cliente" | "solicitante" | "responsavel";

const slaRank: Record<string, number> = {
  "Atrasado": 4, "Fora do prazo": 4, "Em risco": 3, "No prazo": 2, "—": 1,
};

export function ChamadosTab({
  items, unidades, unidadeNome, podeGerenciar, operadorUnidadeId, operadorUnidadeNome,
}: {
  items: OcorrenciaManut[];
  unidades: ReturnType<typeof useUnidades>;
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
    // unidadeNome deriva de `unidades` (já listado); incluí-la recalcularia a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        await updateOcorrencia(editing.id, payload);
        toast({ title: "Manutenção atualizada" });
      } else {
        await addOcorrencia(payload);
        toast({ title: "Manutenção registrada" });
      }
      setOpen(false);
    } catch (e) {
      toast({ title: "Erro ao salvar", description: getErrorMessage(e), variant: "destructive" });
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
                          <AcoesLinha
                            rotulo={o.protocolo}
                            onEditar={() => openEdit(o)}
                            onExcluir={() => setDeleting(o)}
                          />
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
            await removeOcorrencia(deleting.id);
            toast({ title: "Manutenção excluída" });
          } catch (e) {
            toast({ title: "Erro ao excluir", description: getErrorMessage(e), variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir a manutenção "${deleting.protocolo} — ${deleting.servico}"?` : undefined}
      />
    </>
  );
}

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

