import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2, Check, X } from "lucide-react";
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
import {
  COMARCAS, TIPOS_UNIDADE, CRITICIDADES, type Criticidade, type UnidadePredial,
  useUnidadesMock, addUnidade, updateUnidade, removeUnidade,
} from "@/data/unidadesMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(140),
  comarca: z.string().min(1, "Selecione a comarca"),
  endereco: z.string().trim().min(3).max(200),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  responsavel_local: z.string().trim().min(2).max(120),
  tipo: z.enum(TIPOS_UNIDADE),
  horario_funcionamento: z.string().trim().min(2).max(60),
  possui_derso: z.boolean(),
  controle_acesso: z.boolean(),
  vigilancia_eletronica: z.boolean(),
  criticidade: z.enum(CRITICIDADES),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
  imagem_url: z.string().optional().or(z.literal("")),
  servidor_titular_id: z.string().optional().or(z.literal("")),
  servidor_substituto_id: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const criticidadeTone: Record<Criticidade, string> = {
  Baixo:   "bg-adequate/10 text-adequate border-adequate/30",
  Médio:   "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Alto:    "bg-partial/15 text-partial border-partial/30",
  Crítico: "bg-critical/10 text-critical border-critical/30",
};

const defaults: FormData = {
  nome: "", comarca: "", endereco: "", telefone: "", responsavel_local: "",
  tipo: "Fórum", horario_funcionamento: "07h às 19h",
  possui_derso: false, controle_acesso: false, vigilancia_eletronica: false,
  criticidade: "Médio", observacoes: "", imagem_url: "",
  servidor_titular_id: "", servidor_substituto_id: "",
};

export default function UnidadesPage() {
  const items = useUnidadesMock();
  const servidores = useServidoresMock();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadePredial | null>(null);
  const [deleting, setDeleting] = useState<UnidadePredial | null>(null);

  useEffect(() => { document.title = "Unidades Prediais | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });
  const watchedComarca = form.watch("comarca");
  const servidoresFiltrados = useMemo(
    () => servidores.filter((s) => !watchedComarca || s.comarca === watchedComarca),
    [servidores, watchedComarca],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((u) =>
      u.nome.toLowerCase().includes(q) ||
      u.comarca.toLowerCase().includes(q) ||
      u.endereco.toLowerCase().includes(q) ||
      u.responsavel_local.toLowerCase().includes(q),
    );
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    form.reset(defaults);
    setOpen(true);
  };
  const openEdit = (u: UnidadePredial) => {
    setEditing(u);
    const { id: _id, ...rest } = u;
    form.reset(rest);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      telefone: data.telefone ?? "",
      observacoes: data.observacoes ?? "",
      imagem_url: data.imagem_url ?? "",
      servidor_titular_id: data.servidor_titular_id || null,
      servidor_substituto_id: data.servidor_substituto_id || null,
    } as Omit<UnidadePredial, "id">;
    try {
      if (editing) {
        await updateUnidade(editing.id, payload);
        toast({ title: "Unidade atualizada" });
      } else {
        await addUnidade(payload);
        toast({ title: "Unidade cadastrada" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 3 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => form.setValue("imagem_url", reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        title="Unidades Prediais"
        description="Gestão das edificações sob responsabilidade do TJRO."
        actions={<Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Nova unidade</Button>}
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por nome, comarca, endereço ou responsável..."
        count={filtered.length}
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Nenhuma unidade encontrada" description="Ajuste a busca ou cadastre uma nova unidade." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Comarca</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-center">DERSO</TableHead>
                <TableHead className="text-center">Acesso</TableHead>
                <TableHead className="text-center">Vigilância</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.comarca}</TableCell>
                  <TableCell className="text-muted-foreground">{u.tipo}</TableCell>
                  <TableCell className="text-muted-foreground">{u.responsavel_local}</TableCell>
                  <TableCell className="text-center"><BoolIcon v={u.possui_derso} /></TableCell>
                  <TableCell className="text-center"><BoolIcon v={u.controle_acesso} /></TableCell>
                  <TableCell className="text-center"><BoolIcon v={u.vigilancia_eletronica} /></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={criticidadeTone[u.criticidade]}>{u.criticidade}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(u)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Editar unidade predial" : "Nova unidade predial"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Identificação */}
            <Section title="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da unidade" error={form.formState.errors.nome?.message}>
                  <Input {...form.register("nome")} placeholder="Ex.: Fórum Geral de Porto Velho" />
                </Field>
                <Field label="Tipo de unidade">
                  <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as FormData["tipo"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_UNIDADE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Comarca" error={form.formState.errors.comarca?.message}>
                  <Select value={form.watch("comarca")} onValueChange={(v) => form.setValue("comarca", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {COMARCAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Criticidade">
                  <Select value={form.watch("criticidade")} onValueChange={(v) => form.setValue("criticidade", v as Criticidade)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CRITICIDADES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            {/* Localização e contato */}
            <Section title="Localização e contato">
              <Field label="Endereço" error={form.formState.errors.endereco?.message}>
                <Input {...form.register("endereco")} placeholder="Rua, número - bairro" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone">
                  <Input {...form.register("telefone")} placeholder="(69) 0000-0000" />
                </Field>
                <Field label="Responsável local" error={form.formState.errors.responsavel_local?.message}>
                  <Input {...form.register("responsavel_local")} />
                </Field>
              </div>
              <Field label="Horário de funcionamento" error={form.formState.errors.horario_funcionamento?.message}>
                <Input {...form.register("horario_funcionamento")} placeholder="Ex.: 07h às 19h" />
              </Field>
            </Section>

            {/* Segurança */}
            <Section title="Segurança">
              <div className="grid gap-3 sm:grid-cols-3">
                <ToggleField label="Possui DERSO" value={form.watch("possui_derso")} onChange={(v) => form.setValue("possui_derso", v)} />
                <ToggleField label="Controle de acesso" value={form.watch("controle_acesso")} onChange={(v) => form.setValue("controle_acesso", v)} />
                <ToggleField label="Vigilância eletrônica" value={form.watch("vigilancia_eletronica")} onChange={(v) => form.setValue("vigilancia_eletronica", v)} />
              </div>
            </Section>

            <Section title="Pessoal Nuseg">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Servidor titular Nuseg">
                  <Select
                    value={form.watch("servidor_titular_id") || "none"}
                    onValueChange={(v) => form.setValue("servidor_titular_id", v === "none" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Nenhum —</SelectItem>
                      {servidoresFiltrados.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome} ({s.matricula})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Servidor substituto">
                  <Select
                    value={form.watch("servidor_substituto_id") || "none"}
                    onValueChange={(v) => form.setValue("servidor_substituto_id", v === "none" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Nenhum —</SelectItem>
                      {servidoresFiltrados.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome} ({s.matricula})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Demais servidores ficam vinculados pela lotação no cadastro de Servidores.
              </p>
            </Section>

            <Section title="Imagem da unidade">
              <div className="flex items-start gap-4">
                {form.watch("imagem_url") ? (
                  <img src={form.watch("imagem_url")!} alt="Pré-visualização da unidade" className="h-32 w-32 rounded-md border border-border object-cover" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">Sem imagem</div>
                )}
                <div className="flex-1 space-y-2">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                  <p className="text-xs text-muted-foreground">PNG ou JPG, até 3 MB.</p>
                  {form.watch("imagem_url") && (
                    <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("imagem_url", "")}>Remover imagem</Button>
                  )}
                </div>
              </div>
            </Section>

            <Field label="Observações">
              <Textarea rows={3} {...form.register("observacoes")} placeholder="Informações complementares..." />
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
            await removeUnidade(deleting.id);
            toast({ title: "Unidade excluída" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir a unidade "${deleting.nome}"?` : undefined}
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

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function BoolIcon({ v }: { v: boolean }) {
  return v
    ? <Check className="mx-auto h-4 w-4 text-adequate" />
    : <X className="mx-auto h-4 w-4 text-muted-foreground/50" />;
}
