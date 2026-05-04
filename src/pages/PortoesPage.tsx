import { useEffect, useMemo, useState } from "react";
import { DoorOpen, Pencil, Plus, Trash2, Camera, Phone, Wrench, Check, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidadesMock } from "@/data/unidadesMock";
import {
  TIPOS_PORTAO, AUTOMATIZACOES, CONTROLES_ACESSO, SITUACOES_OP, PRIORIDADES_MANUT,
  type PortaoAcesso, type SituacaoOp, type PrioridadeManut,
  usePortoesMock, addPortao, updatePortao, removePortao,
} from "@/data/portoesMock";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  unidade_id: z.string().min(1, "Selecione a unidade"),
  identificacao: z.string().trim().min(1, "Informe a identificação").max(40),
  tipo: z.enum(TIPOS_PORTAO),
  localizacao: z.string().trim().min(2, "Informe a localização").max(160),
  automatizacao: z.enum(AUTOMATIZACOES),
  camera_associada: z.string().trim().max(60).optional().or(z.literal("")),
  interfone: z.boolean(),
  controle_acesso: z.enum(CONTROLES_ACESSO),
  situacao: z.enum(SITUACOES_OP),
  necessidade_manutencao: z.enum(PRIORIDADES_MANUT),
  descricao_manutencao: z.string().trim().max(500).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const situacaoTone: Record<SituacaoOp, string> = {
  "Operacional":               "bg-adequate/10 text-adequate border-adequate/30",
  "Operacional com restrição": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Em manutenção":             "bg-partial/15 text-partial border-partial/30",
  "Inoperante":                "bg-critical/10 text-critical border-critical/30",
  "Desativado":                "bg-muted text-muted-foreground border-border",
};

const manutTone: Record<PrioridadeManut, string> = {
  "Nenhuma": "bg-muted text-muted-foreground border-border",
  "Baixa":   "bg-adequate/10 text-adequate border-adequate/30",
  "Média":   "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Alta":    "bg-partial/15 text-partial border-partial/30",
  "Urgente": "bg-critical/10 text-critical border-critical/30",
};

const defaults: FormData = {
  unidade_id: "", identificacao: "", tipo: "Pedestre", localizacao: "",
  automatizacao: "Manual", camera_associada: "", interfone: false,
  controle_acesso: "Nenhum", situacao: "Operacional",
  necessidade_manutencao: "Nenhuma", descricao_manutencao: "", observacoes: "",
};

export default function PortoesPage() {
  const items = usePortoesMock();
  const unidades = useUnidadesMock();
  const [search, setSearch] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState<string>("all");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PortaoAcesso | null>(null);
  const [deleting, setDeleting] = useState<PortaoAcesso | null>(null);

  useEffect(() => { document.title = "Portões e Acessos | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const unidadeNome = (id: string) => unidades.find((u) => u.id === id)?.nome ?? "—";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((p) => {
      if (unidadeFilter !== "all" && p.unidade_id !== unidadeFilter) return false;
      if (situacaoFilter !== "all" && p.situacao !== situacaoFilter) return false;
      return (
        p.identificacao.toLowerCase().includes(q) ||
        p.localizacao.toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q) ||
        unidadeNome(p.unidade_id).toLowerCase().includes(q)
      );
    });
  }, [items, search, unidadeFilter, situacaoFilter, unidades]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ ...defaults, unidade_id: unidades[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (p: PortaoAcesso) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    form.reset(rest);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      camera_associada: data.camera_associada ?? "",
      descricao_manutencao: data.descricao_manutencao ?? "",
      observacoes: data.observacoes ?? "",
    } as Omit<PortaoAcesso, "id">;
    try {
      if (editing) {
        await updatePortao(editing.id, payload);
        toast({ title: "Portão atualizado" });
      } else {
        await addPortao(payload);
        toast({ title: "Portão cadastrado" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Portões e Acessos"
        description="Controle de portões, automação, câmeras associadas e demandas de manutenção."
        actions={
          <Button onClick={openCreate} disabled={unidades.length === 0}>
            <Plus className="mr-1 h-4 w-4" />Novo portão
          </Button>
        }
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por identificação, tipo, localização ou unidade..."
        count={filtered.length}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas situações</SelectItem>
                {SITUACOES_OP.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={DoorOpen} title="Nenhum portão encontrado" description="Ajuste os filtros ou cadastre um novo portão." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificação</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Tipo / Localização</TableHead>
                <TableHead>Automação</TableHead>
                <TableHead>Controle</TableHead>
                <TableHead className="text-center">Câmera</TableHead>
                <TableHead className="text-center">Interfone</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Manutenção</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.identificacao}</TableCell>
                  <TableCell className="text-muted-foreground">{unidadeNome(p.unidade_id)}</TableCell>
                  <TableCell>
                    <div>{p.tipo}</div>
                    <div className="text-xs text-muted-foreground">{p.localizacao}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.automatizacao}</TableCell>
                  <TableCell className="text-muted-foreground">{p.controle_acesso}</TableCell>
                  <TableCell className="text-center text-xs">
                    {p.camera_associada
                      ? <span className="inline-flex items-center gap-1 text-foreground"><Camera className="h-3.5 w-3.5" />{p.camera_associada}</span>
                      : <X className="mx-auto h-4 w-4 text-muted-foreground/50" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.interfone
                      ? <Check className="mx-auto h-4 w-4 text-adequate" />
                      : <X className="mx-auto h-4 w-4 text-muted-foreground/50" />}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={situacaoTone[p.situacao]}>{p.situacao}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={manutTone[p.necessidade_manutencao]}>
                      {p.necessidade_manutencao !== "Nenhuma" && <Wrench className="mr-1 h-3 w-3" />}
                      {p.necessidade_manutencao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CrudTableLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar portão" : "Novo portão"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Localização e tipo">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unidade predial" error={form.formState.errors.unidade_id?.message}>
                  <Select value={form.watch("unidade_id")} onValueChange={(v) => form.setValue("unidade_id", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Identificação" error={form.formState.errors.identificacao?.message}>
                  <Input {...form.register("identificacao")} placeholder="Ex.: PT-01" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo de portão">
                  <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as FormData["tipo"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_PORTAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Localização" error={form.formState.errors.localizacao?.message}>
                  <Input {...form.register("localizacao")} placeholder="Ex.: Entrada principal" />
                </Field>
              </div>
            </Section>

            <Section title="Automação e acesso">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Automatização">
                  <Select value={form.watch("automatizacao")} onValueChange={(v) => form.setValue("automatizacao", v as FormData["automatizacao"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUTOMATIZACOES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Controle de acesso">
                  <Select value={form.watch("controle_acesso")} onValueChange={(v) => form.setValue("controle_acesso", v as FormData["controle_acesso"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTROLES_ACESSO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Câmera associada (tag)">
                  <Input {...form.register("camera_associada")} placeholder="Ex.: CAM-001" />
                </Field>
                <ToggleField
                  label="Possui interfone"
                  icon={Phone}
                  value={form.watch("interfone")}
                  onChange={(v) => form.setValue("interfone", v)}
                />
              </div>
            </Section>

            <Section title="Operação e manutenção">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Situação operacional">
                  <Select value={form.watch("situacao")} onValueChange={(v) => form.setValue("situacao", v as SituacaoOp)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SITUACOES_OP.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Necessidade de manutenção">
                  <Select value={form.watch("necessidade_manutencao")} onValueChange={(v) => form.setValue("necessidade_manutencao", v as PrioridadeManut)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES_MANUT.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Descrição da manutenção necessária">
                <Textarea rows={2} {...form.register("descricao_manutencao")} placeholder="Detalhe o problema ou o serviço requerido..." />
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
            await removePortao(deleting.id);
            toast({ title: "Portão excluído" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir o portão "${deleting.identificacao}"?` : undefined}
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

function ToggleField({ label, icon: Icon, value, onChange }: { label: string; icon: typeof Phone; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
      <Label className="flex items-center gap-2 text-xs">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}
      </Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
