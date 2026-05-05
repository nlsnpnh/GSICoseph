import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, FileText, Paperclip, Pencil, Plus, Trash2, Upload, Wrench, Clock } from "lucide-react";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useAuth } from "@/contexts/AuthContext";
import { EMPRESAS } from "@/data/terceirizadosMock";
import {
  TIPOS_OCORRENCIA, PRIORIDADES, STATUS_OCO,
  type OcorrenciaManut, type PrioridadeOco, type StatusOco,
  useOcorrenciasMock, addOcorrenciaMock, updateOcorrenciaMock, removeOcorrenciaMock,
} from "@/data/ocorrenciasMock";
import {
  useAnexos, useUploadAnexo, useDeleteAnexo, getAnexoSignedUrl, type OcorrenciaAnexo,
} from "@/data/api";
import { toast } from "@/hooks/use-toast";

const RESPONSAVEIS = [...EMPRESAS, "Interno"] as const;

const schema = z.object({
  titulo: z.string().trim().min(3, "Mínimo 3 caracteres").max(160),
  descricao: z.string().trim().max(2000).optional().or(z.literal("")),
  tipo: z.enum(TIPOS_OCORRENCIA),
  prioridade: z.enum(PRIORIDADES),
  unidade_id: z.string().min(1, "Selecione a unidade"),
  equipamento: z.string().trim().max(120).optional().or(z.literal("")),
  empresa_responsavel: z.enum(RESPONSAVEIS),
  responsavel_nome: z.string().trim().max(120).optional().or(z.literal("")),
  data_abertura: z.string().min(1, "Informe a data"),
  prazo: z.string().optional().or(z.literal("")),
  data_conclusao: z.string().optional().or(z.literal("")),
  status: z.enum(STATUS_OCO),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const prioridadeTone: Record<PrioridadeOco, string> = {
  "Baixa":   "bg-muted text-muted-foreground border-border",
  "Média":   "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Alta":    "bg-partial/15 text-partial border-partial/30",
  "Urgente": "bg-critical/10 text-critical border-critical/30",
};
const statusTone: Record<StatusOco, string> = {
  "Aberto":          "bg-partial/15 text-partial border-partial/30",
  "Em andamento":    "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "Aguardando peça": "bg-muted text-muted-foreground border-border",
  "Concluído":       "bg-adequate/10 text-adequate border-adequate/30",
  "Cancelado":       "bg-muted text-muted-foreground border-border line-through",
};

const today = () => new Date().toISOString().slice(0, 10);

const defaults: FormData = {
  titulo: "", descricao: "", tipo: "Chamado", prioridade: "Média",
  unidade_id: "", equipamento: "", empresa_responsavel: "Interno",
  responsavel_nome: "", data_abertura: today(), prazo: "", data_conclusao: "",
  status: "Aberto", observacoes: "",
};

const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

function prazoStatus(prazo: string, status: StatusOco): { atraso: number; alerta: boolean } {
  if (!prazo || status === "Concluído" || status === "Cancelado") return { atraso: 0, alerta: false };
  const dias = Math.floor((new Date(prazo + "T00:00:00").getTime() - Date.now()) / 86400000);
  return { atraso: dias, alerta: dias < 0 };
}

export default function OcorrenciasPage() {
  const { isOperador, unidadeId, unidadeNome: authUnidadeNome } = useAuth();
  const items = useOcorrenciasMock();
  const unidades = useUnidadesMock();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OcorrenciaManut | null>(null);
  const [deleting, setDeleting] = useState<OcorrenciaManut | null>(null);

  useEffect(() => { document.title = "Ocorrências e Manutenções | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const unidadeNome = (id: string) => unidades.find((u) => u.id === id)?.nome ?? "—";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((o) => {
      if (tipoFilter !== "all" && o.tipo !== tipoFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return (
        o.protocolo.toLowerCase().includes(q) ||
        o.titulo.toLowerCase().includes(q) ||
        o.equipamento.toLowerCase().includes(q) ||
        o.empresa_responsavel.toLowerCase().includes(q) ||
        unidadeNome(o.unidade_id).toLowerCase().includes(q)
      );
    });
  }, [items, search, tipoFilter, statusFilter, unidades]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ ...defaults, unidade_id: isOperador ? (unidadeId ?? "") : (unidades[0]?.id ?? "") });
    setOpen(true);
  };
  const openEdit = (o: OcorrenciaManut) => {
    setEditing(o);
    const { id: _id, protocolo: _p, ...rest } = o;
    form.reset(rest);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      descricao: data.descricao ?? "",
      equipamento: data.equipamento ?? "",
      responsavel_nome: data.responsavel_nome ?? "",
      prazo: data.prazo ?? "",
      data_conclusao: data.data_conclusao ?? "",
      observacoes: data.observacoes ?? "",
    } as Omit<OcorrenciaManut, "id" | "protocolo">;
    try {
      if (editing) {
        await updateOcorrenciaMock(editing.id, payload);
        toast({ title: "Ocorrência atualizada" });
      } else {
        await addOcorrenciaMock(payload);
        toast({ title: "Ocorrência registrada" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Ocorrências e Manutenções"
        description="Chamados, falhas, pendências e manutenções preventivas/corretivas."
        actions={
          <Button onClick={openCreate} disabled={unidades.length === 0}>
            <Plus className="mr-1 h-4 w-4" />Nova ocorrência
          </Button>
        }
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por protocolo, título, equipamento, empresa ou unidade..."
        count={filtered.length}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPOS_OCORRENCIA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OCO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Wrench} title="Nenhuma ocorrência encontrada" description="Ajuste os filtros ou registre uma nova ocorrência." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Título / Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const ps = prazoStatus(o.prazo, o.status);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.protocolo}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.titulo}</div>
                      {o.equipamento && <div className="text-xs text-muted-foreground">{o.equipamento}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{o.tipo}</TableCell>
                    <TableCell className="text-muted-foreground">{unidadeNome(o.unidade_id)}</TableCell>
                    <TableCell className="text-xs">
                      <div>{o.empresa_responsavel}</div>
                      {o.responsavel_nome && <div className="text-muted-foreground">{o.responsavel_nome}</div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className={ps.alerta ? "font-medium text-critical" : ""}>{fmtDate(o.prazo)}</div>
                      {ps.alerta && (
                        <div className="flex items-center gap-1 text-[10px] text-critical">
                          <Clock className="h-3 w-3" />Atrasado {Math.abs(ps.atraso)}d
                        </div>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={prioridadeTone[o.prioridade]}>{o.prioridade}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone[o.status]}>
                        {ps.alerta && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(o)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? `Editar ocorrência ${editing.protocolo}` : "Nova ocorrência"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Identificação">
              <Field label="Título" error={form.formState.errors.titulo?.message}>
                <Input {...form.register("titulo")} placeholder="Ex.: Câmera CAM-007 sem sinal" />
              </Field>
              <Field label="Descrição">
                <Textarea rows={3} {...form.register("descricao")} placeholder="Detalhe a ocorrência..." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo">
                  <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as FormData["tipo"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_OCORRENCIA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Prioridade">
                  <Select value={form.watch("prioridade")} onValueChange={(v) => form.setValue("prioridade", v as PrioridadeOco)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Local e equipamento">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unidade" error={form.formState.errors.unidade_id?.message}>
                  {isOperador ? (
                    <Input value={authUnidadeNome ?? ""} disabled className="bg-muted" />
                  ) : (
                    <Select value={form.watch("unidade_id")} onValueChange={(v) => form.setValue("unidade_id", v, { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <Field label="Equipamento(s) afetado(s)">
                  <Input {...form.register("equipamento")} placeholder="Ex.: CAM-007; PT-EMG" />
                </Field>
              </div>
            </Section>

            <Section title="Responsável e prazos">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Empresa responsável">
                  <Select value={form.watch("empresa_responsavel")} onValueChange={(v) => form.setValue("empresa_responsavel", v as FormData["empresa_responsavel"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Responsável / técnico">
                  <Input {...form.register("responsavel_nome")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Data de abertura" error={form.formState.errors.data_abertura?.message}>
                  <Input type="date" {...form.register("data_abertura")} />
                </Field>
                <Field label="Prazo de atendimento">
                  <Input type="date" {...form.register("prazo")} />
                </Field>
                <Field label="Data de conclusão">
                  <Input type="date" {...form.register("data_conclusao")} />
                </Field>
              </div>
              <Field label="Status">
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as StatusOco)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OCO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Field label="Observações">
              <Textarea rows={2} {...form.register("observacoes")} />
            </Field>

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
            toast({ title: "Ocorrência excluída" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir a ocorrência "${deleting.protocolo} — ${deleting.titulo}"?` : undefined}
      />
    </div>
  );
}

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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />Anexos
        </p>
        <Button
          type="button" size="sm" variant="outline"
          className="h-7 gap-1 text-xs"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {upload.isPending ? "Enviando..." : "Adicionar arquivo"}
        </Button>
        <input
          ref={inputRef} type="file" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Carregando anexos...</p>}

      {!isLoading && anexos.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Nenhum arquivo anexado.</p>
      )}

      {anexos.length > 0 && (
        <ul className="space-y-1.5">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{a.nome_arquivo}</span>
              {a.tamanho && <span className="shrink-0 text-muted-foreground">{fmtSize(a.tamanho)}</span>}
              <span className="shrink-0 text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString("pt-BR")}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDownload(a)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                disabled={remove.isPending}
                onClick={() => handleDelete(a)}
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
