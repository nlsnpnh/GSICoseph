import { useEffect, useMemo, useState } from "react";
import { Cpu, Pencil, Plus, Trash2, Package, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useEquipamentosCatalogo, useUnidadeEquipamentos,
  addUnidadeEquipamento, updateUnidadeEquipamento, removeUnidadeEquipamento,
  type UnidadeEquipamento,
} from "@/data/equipamentos";
import { useUnidadesMock } from "@/data/unidadesMock";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  unidade_id: z.string().min(1, "Selecione a unidade"),
  equipamento_id: z.string().min(1, "Selecione o equipamento"),
  quantidade: z.coerce.number().int().min(1, "Quantidade deve ser maior que zero"),
  observacoes: z.string().max(500).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const defaults: FormData = { unidade_id: "", equipamento_id: "", quantidade: 1, observacoes: "" };

const fmtMoney = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EquipamentosPage() {
  const { isOperador, unidadeId } = useAuth();
  const distribuicao = useUnidadeEquipamentos();
  const catalogo = useEquipamentosCatalogo();
  const unidades = useUnidadesMock();

  const [tab, setTab] = useState("distribuicao");
  const [search, setSearch] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadeEquipamento | null>(null);
  const [deleting, setDeleting] = useState<UnidadeEquipamento | null>(null);

  useEffect(() => { document.title = "Equipamentos | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qNumeric = /^\d+$/.test(q) ? parseInt(q, 10) : null;

    const result = distribuicao.filter((d) => {
      if (isOperador && unidadeId && d.unidade_id !== unidadeId) return false;
      if (unidadeFilter !== "all" && d.unidade_id !== unidadeFilter) return false;
      if (!q) return true;
      if (qNumeric !== null) return d.item_num === qNumeric;
      return (
        d.descricao.toLowerCase().includes(q) ||
        d.unidade_nome.toLowerCase().includes(q) ||
        d.comarca_nome.toLowerCase().includes(q)
      );
    });

    return result.sort(
      (a, b) =>
        a.unidade_nome.localeCompare(b.unidade_nome, "pt-BR") ||
        a.item_num - b.item_num,
    );
  }, [distribuicao, search, unidadeFilter, isOperador, unidadeId]);

  const filteredCatalogo = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qNumeric = /^\d+$/.test(q) ? parseInt(q, 10) : null;
    const base = !q
      ? catalogo
      : qNumeric !== null
        ? catalogo.filter((c) => c.item_num === qNumeric)
        : catalogo.filter((c) => c.descricao.toLowerCase().includes(q));
    return [...base].sort((a, b) => a.item_num - b.item_num);
  }, [catalogo, search]);

  const padItem = (n: number) => String(n).padStart(2, "0");

  const totalContrato = useMemo(
    () => catalogo.reduce((s, c) => s + c.valor_total, 0),
    [catalogo],
  );

  const openCreate = () => {
    setEditing(null);
    form.reset({
      ...defaults,
      unidade_id: isOperador ? (unidadeId ?? "") : (unidades[0]?.id ?? ""),
    });
    setOpen(true);
  };

  const openEdit = (d: UnidadeEquipamento) => {
    setEditing(d);
    form.reset({
      unidade_id: d.unidade_id,
      equipamento_id: d.equipamento_id,
      quantidade: d.quantidade,
      observacoes: d.observacoes,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateUnidadeEquipamento(editing.id, {
          quantidade: data.quantidade,
          observacoes: data.observacoes ?? "",
        });
        toast({ title: "Quantidade atualizada" });
      } else {
        await addUnidadeEquipamento({
          unidade_id: data.unidade_id,
          equipamento_id: data.equipamento_id,
          quantidade: data.quantidade,
          observacoes: data.observacoes ?? "",
        });
        toast({ title: "Equipamento vinculado à unidade" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Equipamentos"
        description="Catálogo do contrato 115/2023 e distribuição por unidade predial."
        actions={
          isOperador ? null : (
            <Button onClick={openCreate} disabled={unidades.length === 0 || catalogo.length === 0}>
              <Plus className="mr-1 h-4 w-4" />Vincular equipamento
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList>
          <TabsTrigger value="distribuicao">
            <Package className="mr-1.5 h-4 w-4" />
            Distribuição por unidade ({distribuicao.length})
          </TabsTrigger>
          <TabsTrigger value="catalogo">
            <FileText className="mr-1.5 h-4 w-4" />
            Catálogo do contrato ({catalogo.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distribuicao" className="mt-3">
          <CrudTableLayout
            search={search} onSearchChange={setSearch}
            placeholder="Buscar por item, unidade ou comarca..."
            count={filtered.length}
            filters={
              isOperador ? null : (
                <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
                  <SelectTrigger className="h-9 w-[260px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )
            }
          >
            {filtered.length === 0 ? (
              <EmptyState icon={Cpu} title="Nenhum equipamento" description="Ajuste filtros ou vincule um equipamento." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Item</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Comarca</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Unid.</TableHead>
                    {!isOperador && <TableHead className="w-[100px] text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">#{padItem(d.item_num)}</TableCell>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">{d.unidade_nome}</TableCell>
                      <TableCell className="text-muted-foreground">{d.comarca_nome}</TableCell>
                      <TableCell className="text-right font-mono">{d.quantidade}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.unidade_medida}</TableCell>
                      {!isOperador && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CrudTableLayout>
        </TabsContent>

        <TabsContent value="catalogo" className="mt-3">
          <CrudTableLayout
            search={search} onSearchChange={setSearch}
            placeholder="Buscar item do catálogo..."
            count={filteredCatalogo.length}
            filters={
              !isOperador ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">Valor total do contrato:</span>
                  <span className="font-semibold">{fmtMoney(totalContrato)}</span>
                </div>
              ) : null
            }
          >
            {filteredCatalogo.length === 0 ? (
              <EmptyState icon={FileText} title="Catálogo vazio" description="Nenhum item cadastrado." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Qtd. contrato</TableHead>
                    {!isOperador && <TableHead className="text-right">Valor unit.</TableHead>}
                    {!isOperador && <TableHead className="text-right">Valor total</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCatalogo.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">#{padItem(c.item_num)}</TableCell>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.unidade_medida}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{c.qtd_contrato}</TableCell>
                      {!isOperador && (
                        <TableCell className="text-right font-mono text-muted-foreground">{fmtMoney(c.valor_unitario)}</TableCell>
                      )}
                      {!isOperador && (
                        <TableCell className="text-right font-mono">{fmtMoney(c.valor_total)}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CrudTableLayout>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar quantidade" : "Vincular equipamento à unidade"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Unidade predial" error={form.formState.errors.unidade_id?.message}>
              <Select
                value={form.watch("unidade_id")}
                onValueChange={(v) => form.setValue("unidade_id", v, { shouldValidate: true })}
                disabled={!!editing}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Equipamento (item do catálogo)" error={form.formState.errors.equipamento_id?.message}>
              <Select
                value={form.watch("equipamento_id")}
                onValueChange={(v) => form.setValue("equipamento_id", v, { shouldValidate: true })}
                disabled={!!editing}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {[...catalogo].sort((a, b) => a.item_num - b.item_num).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      #{padItem(c.item_num)} — {c.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Quantidade" error={form.formState.errors.quantidade?.message}>
              <Input type="number" min={1} {...form.register("quantidade")} />
            </Field>

            <Field label="Observações">
              <Textarea rows={2} {...form.register("observacoes")} placeholder="Notas opcionais..." />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Vincular"}</Button>
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
            await removeUnidadeEquipamento(deleting.id);
            toast({ title: "Vínculo removido" });
          } catch (e: any) {
            toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Remover "${deleting.descricao}" da unidade "${deleting.unidade_nome}"?` : undefined}
      />
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
