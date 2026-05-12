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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Comarca, useComarcas, useCreateComarca, useUpdateComarca, useRemoveComarca,
} from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
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
    defaultValues: { nome: "" },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) => c.nome.toLowerCase().includes(q));
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ nome: "" });
    setOpen(true);
  };
  const openEdit = (c: Comarca) => {
    setEditing(c);
    form.reset({ nome: c.nome });
    setOpen(true);
  };
  const onSubmit = async (data: FormData) => {
    const payload = { nome: data.nome };
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, data: payload }); toast({ title: "Comarca atualizada" }); }
      else { await createMut.mutateAsync(payload); toast({ title: "Comarca cadastrada" }); }
      setOpen(false);
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "";
      const isDuplicate = msg.includes("comarcas_nome_unique") || msg.includes("duplicate");
      toast({
        title: "Erro",
        description: isDuplicate ? "Já existe uma comarca com esse nome." : msg,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Comarcas"
        description="Cadastro e organização das comarcas do estado."
        actions={canEdit ? <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Nova comarca</Button> : null}
      />

      <CrudTableLayout search={search} onSearchChange={setSearch} placeholder="Buscar por nome ou município..." count={filtered.length}>
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Landmark} title="Nenhuma comarca encontrada" description="Ajuste a busca ou cadastre uma nova comarca." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
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

            <Section title="Identificação">
              <div className="space-y-2">
                <Label className="text-xs">Nome da comarca</Label>
                <Input {...form.register("nome")} placeholder="Ex.: Comarca de Porto Velho" />
                {form.formState.errors.nome && <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>}
              </div>
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
