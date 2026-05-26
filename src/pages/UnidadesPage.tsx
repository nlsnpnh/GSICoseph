import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/PageHeader";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
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
  type UnidadePredial,
  useUnidadesMock, addUnidade, updateUnidade, removeUnidade,
} from "@/data/unidadesMock";
import { useComarcas } from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(140),
  comarca_id: z.string().min(1, "Selecione a comarca"),
  endereco: z.string().trim().min(3).max(200),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  responsavel_local: z.string().trim().min(2).max(120),
  responsavel_substituto: z.string().trim().max(120).optional().or(z.literal("")),
  possui_derso: z.boolean(),
  controle_acesso: z.boolean(),
  vigilancia_eletronica: z.boolean(),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
  lat: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = Number(String(v).replace(",", "."));
      return isNaN(n) ? v : n;
    },
    z.number({ invalid_type_error: "Latitude inválida" }).min(-90).max(90).optional(),
  ),
  lng: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = Number(String(v).replace(",", "."));
      return isNaN(n) ? v : n;
    },
    z.number({ invalid_type_error: "Longitude inválida" }).min(-180).max(180).optional(),
  ),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = {
  nome: "", comarca_id: "", endereco: "", telefone: "",
  responsavel_local: "", responsavel_substituto: "",
  possui_derso: false, controle_acesso: false, vigilancia_eletronica: false,
  observacoes: "", lat: undefined, lng: undefined,
};

export default function UnidadesPage() {
  const { isOperador } = useAuth();
  const items = useUnidadesMock();
  const { data: comarcas = [] } = useComarcas();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadePredial | null>(null);
  const [deleting, setDeleting] = useState<UnidadePredial | null>(null);

  useEffect(() => { document.title = "Unidades Prediais | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((u) =>
      u.nome.toLowerCase().includes(q) ||
      u.comarca_nome.toLowerCase().includes(q) ||
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
    form.reset({
      nome: u.nome,
      comarca_id: u.comarca_id ?? "",
      endereco: u.endereco,
      telefone: u.telefone,
      responsavel_local: u.responsavel_local,
      responsavel_substituto: u.responsavel_substituto,
      possui_derso: u.possui_derso,
      controle_acesso: u.controle_acesso,
      vigilancia_eletronica: u.vigilancia_eletronica,
      observacoes: u.observacoes,
      lat: u.lat ?? undefined,
      lng: u.lng ?? undefined,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload: Omit<UnidadePredial, "id" | "comarca_nome"> = {
      nome: data.nome,
      comarca_id: data.comarca_id || null,
      endereco: data.endereco,
      telefone: data.telefone ?? "",
      responsavel_local: data.responsavel_local,
      responsavel_substituto: data.responsavel_substituto ?? "",
      possui_derso: data.possui_derso,
      controle_acesso: data.controle_acesso,
      vigilancia_eletronica: data.vigilancia_eletronica,
      observacoes: data.observacoes ?? "",
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    };
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

  return (
    <div>
      <PageHeader
        title="Unidades Prediais"
        description="Gestão das edificações sob responsabilidade do TJRO."
        actions={!isOperador ? <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Nova unidade</Button> : undefined}
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
                <TableHead>Responsável</TableHead>
                <TableHead>Substituto</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.id}
                  className={!isOperador ? "cursor-pointer hover:bg-muted/40" : undefined}
                  onClick={!isOperador ? () => openEdit(u) : undefined}
                >
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.comarca_nome || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.responsavel_local}</TableCell>
                  <TableCell className="text-muted-foreground">{u.responsavel_substituto || "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{u.telefone || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CrudTableLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar unidade predial" : "Nova unidade predial"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <Section title="Identificação">
              <Field label="Nome da unidade" error={form.formState.errors.nome?.message}>
                <Input {...form.register("nome")} placeholder="Ex.: Fórum Geral de Porto Velho" />
              </Field>
              <Field label="Comarca" error={form.formState.errors.comarca_id?.message}>
                <Select
                  value={form.watch("comarca_id")}
                  onValueChange={(v) => form.setValue("comarca_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section title="Localização e contato">
              <Field label="Endereço" error={form.formState.errors.endereco?.message}>
                <Input {...form.register("endereco")} placeholder="Rua, número — bairro" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Responsável local" error={form.formState.errors.responsavel_local?.message}>
                  <Input {...form.register("responsavel_local")} />
                </Field>
                <Field label="Responsável substituto">
                  <Input {...form.register("responsavel_substituto")} />
                </Field>
              </div>
              <Field label="Telefone">
                <Input {...form.register("telefone")} placeholder="(69) 0000-0000" />
              </Field>
            </Section>

            <Section title="Coordenadas geográficas (para o mapa)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Latitude" error={form.formState.errors.lat?.message}>
                  <Input type="text" inputMode="decimal" {...form.register("lat")} placeholder="Ex.: -8.7619" />
                </Field>
                <Field label="Longitude" error={form.formState.errors.lng?.message}>
                  <Input type="text" inputMode="decimal" {...form.register("lng")} placeholder="Ex.: -63.9039" />
                </Field>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deixe em branco se ainda não souber. Pode preencher depois.
              </p>
            </Section>

            <Section title="Segurança">
              <div className="grid gap-3 sm:grid-cols-3">
                <ToggleField label="Possui DERSO" value={form.watch("possui_derso")} onChange={(v) => form.setValue("possui_derso", v)} />
                <ToggleField label="Controle de acesso" value={form.watch("controle_acesso")} onChange={(v) => form.setValue("controle_acesso", v)} />
                <ToggleField label="Vigilância eletrônica" value={form.watch("vigilancia_eletronica")} onChange={(v) => form.setValue("vigilancia_eletronica", v)} />
              </div>
            </Section>

            <Field label="Observações">
              <Textarea rows={3} {...form.register("observacoes")} placeholder="Informações complementares..." />
            </Field>

            <DialogFooter className="gap-2 sm:justify-between">
              <div>
                {editing && !isOperador && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setOpen(false);
                      setDeleting(editing);
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">{editing ? "Salvar alterações" : "Cadastrar"}</Button>
              </div>
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

