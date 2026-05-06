import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserCog, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { COMARCAS, useUnidadesMock } from "@/data/unidadesMock";
import { useAuth } from "@/contexts/AuthContext";
import {
  EMPRESAS, FUNCOES, ESCALAS_TERC, TURNOS, SITUACOES_TERC,
  type Terceirizado, type SituacaoTerc,
  useTerceirizadosMock, addTerceirizado, updateTerceirizado, removeTerceirizado,
} from "@/data/terceirizadosMock";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  empresa: z.string().trim().min(1, "Informe a empresa"),
  contrato: z.string().trim().min(1, "Informe o contrato").max(40),
  funcao: z.enum(FUNCOES),
  posto_trabalho: z.string().trim().min(2, "Informe o posto").max(120),
  unidade: z.string().trim().min(2, "Selecione a unidade"),
  comarca: z.enum(COMARCAS),
  escala: z.enum(ESCALAS_TERC),
  turno: z.enum(TURNOS),
  situacao: z.enum(SITUACOES_TERC),
  certificacoes: z.string().trim().max(500).optional().or(z.literal("")),
  validade_certificacao: z.string().optional().or(z.literal("")),
  curso_libras: z.boolean().default(false),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const situacaoTone: Record<SituacaoTerc, string> = {
  Ativo:        "bg-adequate/10 text-adequate border-adequate/30",
  Afastado:     "bg-partial/15 text-partial border-partial/30",
  Substituído:  "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Desligado:    "bg-muted text-muted-foreground border-border",
};

const defaults: FormData = {
  nome: "", cpf: "", empresa: "", contrato: "Contrato nº 23/2024", funcao: "Agente de Portaria",
  posto_trabalho: "", unidade: "", comarca: "Porto Velho",
  escala: "12x36 horas", turno: "Diurno", situacao: "Ativo",
  certificacoes: "", validade_certificacao: "", curso_libras: false, observacoes: "",
};

const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

function certStatus(d: string): { label: string; tone: string } | null {
  if (!d) return null;
  const today = new Date();
  const dt = new Date(d + "T00:00:00");
  const diffDays = Math.floor((dt.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: "Vencida", tone: "bg-critical/10 text-critical border-critical/30" };
  if (diffDays <= 60) return { label: "A vencer", tone: "bg-partial/15 text-partial border-partial/30" };
  return { label: "Em dia", tone: "bg-adequate/10 text-adequate border-adequate/30" };
}

export default function TerceirizadosPage() {
  const { isOperador, unidadeNome: authUnidadeNome, comarcaNome: authComarcaNome } = useAuth();
  const items = useTerceirizadosMock();
  const unidades = useUnidadesMock();
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<string>("all");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Terceirizado | null>(null);
  const [deleting, setDeleting] = useState<Terceirizado | null>(null);

  useEffect(() => { document.title = "Terceirizados | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });
  const watchedComarca = form.watch("comarca");
  const unidadesDaComarca = useMemo(
    () => unidades.filter((u) => u.comarca === watchedComarca),
    [unidades, watchedComarca],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((t) => {
      if (empresaFilter !== "all" && t.empresa !== empresaFilter) return false;
      if (situacaoFilter !== "all" && t.situacao !== situacaoFilter) return false;
      return (
        t.nome.toLowerCase().includes(q) ||
        t.cpf.toLowerCase().includes(q) ||
        t.contrato.toLowerCase().includes(q) ||
        t.funcao.toLowerCase().includes(q) ||
        t.posto_trabalho.toLowerCase().includes(q) ||
        t.unidade.toLowerCase().includes(q)
      );
    });
  }, [items, search, empresaFilter, situacaoFilter]);

  const openCreate = () => {
    setEditing(null);
    if (isOperador) {
      form.reset({ ...defaults, unidade: authUnidadeNome ?? "", comarca: (authComarcaNome as any) ?? "Porto Velho" });
    } else {
      form.reset(defaults);
    }
    setOpen(true);
  };
  const openEdit = (t: Terceirizado) => {
    setEditing(t);
    const { id: _id, ...rest } = t;
    form.reset(rest);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      certificacoes: data.certificacoes ?? "",
      validade_certificacao: data.validade_certificacao ?? "",
      curso_libras: data.curso_libras ?? false,
      observacoes: data.observacoes ?? "",
    } as Omit<Terceirizado, "id">;
    try {
      if (editing) {
        await updateTerceirizado(editing.id, payload);
        toast({ title: "Terceirizado atualizado" });
      } else {
        await addTerceirizado(payload);
        toast({ title: "Terceirizado cadastrado" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Terceirizados"
        description="Controle de profissionais terceirizados, contratos e certificações."
        actions={<Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Novo terceirizado</Button>}
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por nome, CPF, contrato, função, posto ou unidade..."
        count={filtered.length}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {EMPRESAS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas situações</SelectItem>
                {SITUACOES_TERC.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={UserCog} title="Nenhum terceirizado encontrado" description="Ajuste os filtros ou cadastre um novo profissional." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa / Contrato</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Posto / Unidade</TableHead>
                <TableHead>Escala / Turno</TableHead>
                <TableHead>Certificação</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const cert = certStatus(t.validade_certificacao);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div>{t.nome}</div>
                      <div className="text-xs text-muted-foreground">CPF {t.cpf}</div>
                    </TableCell>
                    <TableCell>
                      <div>{t.empresa}</div>
                      <div className="text-xs text-muted-foreground">Contrato {t.contrato}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.funcao}</TableCell>
                    <TableCell>
                      <div>{t.posto_trabalho}</div>
                      <div className="text-xs text-muted-foreground">{t.unidade} • {t.comarca}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{t.escala}</div>
                      <div className="text-xs">{t.turno}</div>
                    </TableCell>
                    <TableCell>
                      {cert ? (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className={cert.tone}>
                            {cert.label === "Vencida" || cert.label === "A vencer" ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
                            {cert.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground">{fmtDate(t.validade_certificacao)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={situacaoTone[t.situacao]}>{t.situacao}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Editar terceirizado" : "Novo terceirizado"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" error={form.formState.errors.nome?.message}>
                  <Input {...form.register("nome")} />
                </Field>
                <Field label="CPF" error={form.formState.errors.cpf?.message}>
                  <Input {...form.register("cpf")} placeholder="000.000.000-00" />
                </Field>
              </div>
            </Section>

            <Section title="Empresa e contrato">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Empresa" error={form.formState.errors.empresa?.message}>
                  <Input {...form.register("empresa")} placeholder="Ex.: SegService" />
                </Field>
                <Field label="Contrato" error={form.formState.errors.contrato?.message}>
                  <Input {...form.register("contrato")} placeholder="Ex.: 058/2023" />
                </Field>
              </div>
            </Section>

            <Section title="Função e alocação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Função">
                  <Select value={form.watch("funcao")} onValueChange={(v) => form.setValue("funcao", v as FormData["funcao"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUNCOES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Posto de trabalho" error={form.formState.errors.posto_trabalho?.message}>
                  <Input {...form.register("posto_trabalho")} placeholder="Ex.: Portaria principal" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Comarca">
                  {isOperador ? (
                    <Input value={authComarcaNome ?? ""} disabled className="bg-muted" />
                  ) : (
                    <Select value={form.watch("comarca")} onValueChange={(v) => {
                      form.setValue("comarca", v as FormData["comarca"]);
                      form.setValue("unidade", "");
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMARCAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <Field label="Unidade" error={form.formState.errors.unidade?.message}>
                  {isOperador ? (
                    <Input value={authUnidadeNome ?? ""} disabled className="bg-muted" />
                  ) : unidadesDaComarca.length > 0 ? (
                    <Select value={form.watch("unidade")} onValueChange={(v) => form.setValue("unidade", v, { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {unidadesDaComarca.map((u) => <SelectItem key={u.id} value={u.nome}>{u.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input {...form.register("unidade")} placeholder="Digite a unidade" />
                  )}
                </Field>
              </div>
            </Section>

            <Section title="Jornada e situação">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Escala">
                  <Select value={form.watch("escala")} onValueChange={(v) => form.setValue("escala", v as FormData["escala"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESCALAS_TERC.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Turno">
                  <Select value={form.watch("turno")} onValueChange={(v) => form.setValue("turno", v as FormData["turno"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TURNOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Situação">
                  <Select value={form.watch("situacao")} onValueChange={(v) => form.setValue("situacao", v as SituacaoTerc)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SITUACOES_TERC.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Documentação e certificações">
              <Field label="Certificações / Cursos">
                <Textarea rows={2} {...form.register("certificacoes")} placeholder="Ex.: Reciclagem 2025; Primeiros Socorros" />
              </Field>
              <Field label="">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="curso_libras"
                    checked={form.watch("curso_libras")}
                    onCheckedChange={(v) => form.setValue("curso_libras", !!v)}
                  />
                  <Label htmlFor="curso_libras" className="cursor-pointer">Curso de Libras</Label>
                </div>
              </Field>
              <Field label="Observações">
                <Textarea rows={2} {...form.register("observacoes")} placeholder="Informações complementares..." />
              </Field>
            </Section>

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
            await removeTerceirizado(deleting.id);
            toast({ title: "Terceirizado excluído" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir o terceirizado "${deleting.nome}"?` : undefined}
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
