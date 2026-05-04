import React, { useEffect, useMemo, useState } from "react";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Comarca, useComarcas, useCreateComarca, useUpdateComarca, useRemoveComarca,
} from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  entrancia: z.enum(["Inicial", "Intermediária", "Final"]),
  municipios_atendidos: z.coerce.number().int().min(1).max(50),
  responsavel: z.string().trim().min(3).max(120),
  endereco: z.string().trim().max(200).optional().or(z.literal("")),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function ComarcasPage() {
  const { canEdit, canDelete } = useAuth();
  const { data: items = [], isLoading } = useComarcas();
  const createMut = useCreateComarca();
  const updateMut = useUpdateComarca();
  const removeMut = useRemoveComarca();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Comarca | null>(null);
  const [deleting, setDeleting] = useState<Comarca | null>(null);

  useEffect(() => { document.title = "Comarcas | SIG-COSEPH"; }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", entrancia: "Inicial", municipios_atendidos: 1, responsavel: "", endereco: "", telefone: "", lat: "", lng: "" },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) => c.nome.toLowerCase().includes(q) || (c.responsavel ?? "").toLowerCase().includes(q));
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ nome: "", entrancia: "Inicial", municipios_atendidos: 1, responsavel: "", endereco: "", telefone: "", lat: "", lng: "" });
    setOpen(true);
  };
  const openEdit = (c: Comarca) => {
    setEditing(c);
    form.reset({
      nome: c.nome,
      entrancia: c.entrancia,
      municipios_atendidos: c.municipios_atendidos,
      responsavel: c.responsavel ?? "",
      endereco: c.endereco ?? "",
      telefone: c.telefone ?? "",
      lat: c.lat ?? "",
      lng: c.lng ?? "",
    });
    setOpen(true);
  };
  const onSubmit = async (data: FormData) => {
    const payload = {
      nome: data.nome,
      entrancia: data.entrancia,
      municipios_atendidos: data.municipios_atendidos,
      responsavel: data.responsavel,
      endereco: data.endereco || null,
      telefone: data.telefone || null,
      lat: data.lat !== "" && data.lat !== undefined ? Number(data.lat) : null,
      lng: data.lng !== "" && data.lng !== undefined ? Number(data.lng) : null,
    };
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, data: payload }); toast({ title: "Comarca atualizada" }); }
      else { await createMut.mutateAsync(payload); toast({ title: "Comarca cadastrada" }); }
      setOpen(false);
    } catch (e: unknown) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Comarcas"
        description="Cadastro e organização das comarcas do estado."
        actions={canEdit ? <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Nova comarca</Button> : null}
      />

      <CrudTableLayout search={search} onSearchChange={setSearch} placeholder="Buscar por nome ou responsável..." count={filtered.length}>
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Landmark} title="Nenhuma comarca encontrada" description="Ajuste a busca ou cadastre uma nova comarca." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Entrância</TableHead>
                <TableHead>Municípios</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{c.entrancia}</TableCell>
                  <TableCell>{c.municipios_atendidos}</TableCell>
                  <TableCell className="text-muted-foreground">{c.endereco ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.telefone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.responsavel}</TableCell>
                  <TableCell className="text-right">
                    {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>}
                    {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CrudTableLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar comarca" : "Nova comarca"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Identificação */}
            <Section title="Identificação">
              <div className="space-y-2">
                <Label className="text-xs">Nome</Label>
                <Input {...form.register("nome")} placeholder="Ex.: Comarca de Porto Velho" />
                {form.formState.errors.nome && <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Entrância</Label>
                  <Select value={form.watch("entrancia")} onValueChange={(v) => form.setValue("entrancia", v as FormData["entrancia"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inicial">Inicial</SelectItem>
                      <SelectItem value="Intermediária">Intermediária</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Municípios atendidos</Label>
                  <Input type="number" min={1} {...form.register("municipios_atendidos")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Responsável</Label>
                <Input {...form.register("responsavel")} placeholder="Nome do responsável" />
                {form.formState.errors.responsavel && <p className="text-xs text-destructive">{form.formState.errors.responsavel.message}</p>}
              </div>
            </Section>

            {/* Localização e contato */}
            <Section title="Localização e contato">
              <div className="space-y-2">
                <Label className="text-xs">Endereço</Label>
                <Input {...form.register("endereco")} placeholder="Rua, número - bairro - cidade" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Telefone</Label>
                <Input {...form.register("telefone")} placeholder="(69) 0000-0000" />
              </div>
            </Section>

            {/* Coordenadas geográficas */}
            <Section title="Coordenadas geográficas (para o mapa)">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Latitude</Label>
                  <Input type="number" step="any" {...form.register("lat")} placeholder="Ex.: -8.7619" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Longitude</Label>
                  <Input type="number" step="any" {...form.register("lng")} placeholder="Ex.: -63.9039" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Coordenadas usadas para posicionar a comarca no mapa interativo. Deixe em branco se desconhecido.
              </p>
            </Section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try { await removeMut.mutateAsync(deleting.id); toast({ title: "Comarca excluída" }); }
          catch (e: unknown) { toast({ title: "Erro", description: (e as Error).message, variant: "destructive" }); }
          setDeleting(null);
        }}
        description={deleting ? `Excluir a comarca "${deleting.nome}"?` : undefined}
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
