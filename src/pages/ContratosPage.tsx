import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Plus, Trash2, AlertTriangle, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/PageHeader";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
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
import { useUnidadesMock } from "@/data/unidadesMock";
import {
  type Contrato, type StatusContrato,
  useContratosMock, addContrato, updateContrato, removeContrato, statusFromVigencia,
} from "@/data/contratosMock";
import { toast } from "@/hooks/use-toast";

const aditivoSchema = z.object({
  numero: z.string().trim().min(1).max(40),
  data: z.string().min(1),
  descricao: z.string().trim().max(300),
});
const apostilamentoSchema = z.object({
  numero: z.string().trim().min(1).max(40),
  data: z.string().min(1),
  descricao: z.string().trim().max(300),
});

const schema = z.object({
  numero: z.string().trim().min(1, "Informe o número").max(40),
  empresa: z.string().trim().min(1, "Informe a empresa"),
  objeto: z.string().trim().min(3, "Descreva o objeto").max(500),
  data_inicio: z.string().min(1, "Informe a data inicial"),
  data_fim: z.string().min(1, "Informe a data final"),
  valor_mensal: z.coerce.number().nonnegative(),
  valor_total: z.coerce.number().nonnegative(),
  unidades_atendidas: z.array(z.string()).min(1, "Selecione ao menos uma unidade"),
  fiscal: z.string().trim().min(2, "Informe o fiscal").max(120),
  gestor: z.string().trim().min(2, "Informe o gestor").max(120),
  sla: z.string().trim().max(500).optional().or(z.literal("")),
  aditivos: z.array(aditivoSchema),
  apostilamentos: z.array(apostilamentoSchema),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const statusTone: Record<StatusContrato, string> = {
  "Vigente":   "bg-adequate/10 text-adequate border-adequate/30",
  "A vencer":  "bg-partial/15 text-partial border-partial/30",
  "Vencido":   "bg-critical/10 text-critical border-critical/30",
  "Encerrado": "bg-muted text-muted-foreground border-border",
  "Suspenso":  "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

const defaults: FormData = {
  numero: "", empresa: "", objeto: "", data_inicio: "", data_fim: "",
  valor_mensal: 0, valor_total: 0, unidades_atendidas: [],
  fiscal: "", gestor: "", sla: "", aditivos: [], apostilamentos: [], observacoes: "",
};

const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");
const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function ContratosPage() {
  const items = useContratosMock();
  const unidades = useUnidadesMock();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [deleting, setDeleting] = useState<Contrato | null>(null);

  useEffect(() => { document.title = "Contratos | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { fields: fieldsAdit, append: appendAdit, remove: removeAdit } = useFieldArray({ control: form.control, name: "aditivos" });
  const { fields: fieldsApost, append: appendApost, remove: removeApost } = useFieldArray({ control: form.control, name: "apostilamentos" });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) => {
      const st = statusFromVigencia(c.data_fim);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      return (
        c.numero.toLowerCase().includes(q) ||
        c.empresa.toLowerCase().includes(q) ||
        c.objeto.toLowerCase().includes(q) ||
        c.fiscal.toLowerCase().includes(q) ||
        c.gestor.toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    form.reset(defaults);
    setOpen(true);
  };
  const openEdit = (c: Contrato) => {
    setEditing(c);
    const { id: _id, ...rest } = c;
    form.reset(rest);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      sla: data.sla ?? "",
      observacoes: data.observacoes ?? "",
      apostilamentos: data.apostilamentos,
    } as Omit<Contrato, "id">;
    try {
      if (editing) {
        await updateContrato(editing.id, payload);
        toast({ title: "Contrato atualizado" });
      } else {
        await addContrato(payload);
        toast({ title: "Contrato cadastrado" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const toggleUnidade = (nome: string) => {
    const cur = form.getValues("unidades_atendidas");
    form.setValue(
      "unidades_atendidas",
      cur.includes(nome) ? cur.filter((u) => u !== nome) : [...cur, nome],
      { shouldValidate: true },
    );
  };

  const selectedUnidades = form.watch("unidades_atendidas");

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Gestão dos contratos de segurança, fiscais, SLA e aditivos."
        actions={<Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Novo contrato</Button>}
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por número, empresa, objeto, fiscal ou gestor..."
        count={filtered.length}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Vigente">Vigente</SelectItem>
              <SelectItem value="A vencer">A vencer</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum contrato encontrado" description="Ajuste os filtros ou cadastre um novo contrato." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº / Empresa</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Valor mensal / total</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Fiscal / Gestor</TableHead>
                <TableHead>Adit. / Apost.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const st = statusFromVigencia(c.data_fim);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div>{c.numero}</div>
                      <div className="text-xs text-muted-foreground">{c.empresa}</div>
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">
                      <p className="line-clamp-2">{c.objeto}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{fmtDate(c.data_inicio)} →</div>
                      <div>{fmtDate(c.data_fim)}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{fmtMoney(c.valor_mensal)}/mês</div>
                      <div className="text-muted-foreground">{fmtMoney(c.valor_total)} total</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.unidades_atendidas.length} unidade(s)
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{c.fiscal}</div>
                      <div className="text-muted-foreground">{c.gestor}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span title="Aditivos">{c.aditivos.length} adit.</span>
                      {c.apostilamentos.length > 0 && (
                        <span className="ml-1 text-blue-600" title="Apostilamentos">/ {c.apostilamentos.length} apost.</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone[st]}>
                        {st === "A vencer" || st === "Vencido" ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
                        {st}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CrudTableLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar contrato" : "Novo contrato"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Número do contrato" error={form.formState.errors.numero?.message}>
                  <Input {...form.register("numero")} placeholder="Ex.: 058/2023" />
                </Field>
                <Field label="Empresa" error={form.formState.errors.empresa?.message}>
                  <Input {...form.register("empresa")} placeholder="Nome da empresa contratada" />
                </Field>
              </div>
              <Field label="Objeto" error={form.formState.errors.objeto?.message}>
                <Textarea rows={2} {...form.register("objeto")} placeholder="Descrição do objeto contratado..." />
              </Field>
            </Section>

            <Section title="Vigência e valores">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data de início" error={form.formState.errors.data_inicio?.message}>
                  <Input type="date" {...form.register("data_inicio")} />
                </Field>
                <Field label="Data de término" error={form.formState.errors.data_fim?.message}>
                  <Input type="date" {...form.register("data_fim")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Valor mensal (R$)">
                  <Input type="number" step="0.01" {...form.register("valor_mensal")} />
                </Field>
                <Field label="Valor total do contrato (R$)">
                  <Input type="number" step="0.01" {...form.register("valor_total")} />
                </Field>
              </div>
            </Section>

            <Section title="Unidades atendidas">
              {unidades.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma unidade cadastrada.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {unidades.map((u) => {
                    const checked = selectedUnidades.includes(u.nome);
                    return (
                      <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
                        <input type="checkbox" checked={checked} onChange={() => toggleUnidade(u.nome)} className="h-3.5 w-3.5" />
                        <span>{u.nome}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {form.formState.errors.unidades_atendidas && (
                <p className="text-xs text-destructive">{form.formState.errors.unidades_atendidas.message}</p>
              )}
            </Section>

            <Section title="Gestão e SLA">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fiscal" error={form.formState.errors.fiscal?.message}>
                  <Input {...form.register("fiscal")} />
                </Field>
                <Field label="Gestor" error={form.formState.errors.gestor?.message}>
                  <Input {...form.register("gestor")} />
                </Field>
              </div>
              <Field label="SLA / Acordo de nível de serviço">
                <Textarea rows={2} {...form.register("sla")} placeholder="Prazos de atendimento, multas, indicadores..." />
              </Field>
            </Section>

            <Section title="Aditivos">
              <p className="text-[11px] text-muted-foreground">Alterações formais de objeto, prazo ou valor contratual.</p>
              <div className="space-y-2">
                {fieldsAdit.map((f, idx) => (
                  <div key={f.id} className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_140px_2fr_auto]">
                    <Input placeholder="Nº do aditivo" {...form.register(`aditivos.${idx}.numero` as const)} />
                    <Input type="date" {...form.register(`aditivos.${idx}.data` as const)} />
                    <Input placeholder="Descrição" {...form.register(`aditivos.${idx}.descricao` as const)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAdit(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendAdit({ numero: "", data: "", descricao: "" })}>
                  <Plus className="mr-1 h-3.5 w-3.5" />Adicionar aditivo
                </Button>
              </div>
            </Section>

            <Section title="Apostilamentos">
              <p className="text-[11px] text-muted-foreground">Reajustes e correções simples sem alteração do objeto contratual.</p>
              <div className="space-y-2">
                {fieldsApost.map((f, idx) => (
                  <div key={f.id} className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_140px_2fr_auto]">
                    <Input placeholder="Nº do apostilamento" {...form.register(`apostilamentos.${idx}.numero` as const)} />
                    <Input type="date" {...form.register(`apostilamentos.${idx}.data` as const)} />
                    <Input placeholder="Descrição (ex.: reajuste INPC)" {...form.register(`apostilamentos.${idx}.descricao` as const)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeApost(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendApost({ numero: "", data: "", descricao: "" })}>
                  <Plus className="mr-1 h-3.5 w-3.5" />Adicionar apostilamento
                </Button>
              </div>
            </Section>

            <Field label="Observações">
              <Textarea rows={2} {...form.register("observacoes")} />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar alterações" : "Cadastrar"}</Button>
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
            await removeContrato(deleting.id);
            toast({ title: "Contrato excluído" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir o contrato "${deleting.numero}"?` : undefined}
      />
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
