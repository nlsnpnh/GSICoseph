import { useEffect, useMemo, useState } from "react";
import {
  Cpu, Pencil, Plus, Trash2, Camera, DoorOpen, Bell, ScanLine, Shield, Zap,
  HardDrive, AlertOctagon, Fingerprint, BatteryCharging, Server, Monitor as MonitorIcon,
} from "lucide-react";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TIPOS_EQUIPAMENTO, STATUS_EQUIPAMENTO, type Equipamento, type StatusEquipamento, type TipoEquipamento,
  useEquipamentosMock, addEquipamento, updateEquipamento, removeEquipamento,
} from "@/data/equipamentosMock";
import { useUnidadesMock } from "@/data/unidadesMock";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  unidade_id: z.string().min(1, "Selecione a unidade"),
  tipo: z.enum(TIPOS_EQUIPAMENTO),
  identificacao: z.string().trim().min(1, "Informe a identificação").max(60),
  fabricante: z.string().trim().max(80).optional().or(z.literal("")),
  modelo: z.string().trim().max(80).optional().or(z.literal("")),
  numero_serie: z.string().trim().max(80).optional().or(z.literal("")),
  numero_patrimonio: z.string().trim().max(60).optional().or(z.literal("")),
  localizacao: z.string().trim().min(2, "Informe a localização").max(120),
  data_instalacao: z.string().optional().or(z.literal("")),
  ultima_manutencao: z.string().optional().or(z.literal("")),
  proxima_manutencao: z.string().optional().or(z.literal("")),
  garantia_ate: z.string().optional().or(z.literal("")),
  contrato_vinculado: z.string().trim().max(60).optional().or(z.literal("")),
  status: z.enum(STATUS_EQUIPAMENTO),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const tipoIcon: Record<TipoEquipamento, typeof Cpu> = {
  "Câmera": Camera,
  "Catraca": Shield,
  "Portão": DoorOpen,
  "Sensor": Zap,
  "Alarme": Bell,
  "Porta giratória": Shield,
  "Scanner Raio-X": ScanLine,
  "Detector de metais": ScanLine,
  "DVR/NVR": HardDrive,
  "Botão de pânico": AlertOctagon,
  "Controle facial/biométrico": Fingerprint,
  "Nobreak": BatteryCharging,
  "Rack": Server,
  "Monitor": MonitorIcon,
};

const statusTone: Record<StatusEquipamento, string> = {
  "Operacional":     "bg-adequate/10 text-adequate border-adequate/30",
  "Em manutenção":   "bg-partial/15 text-partial border-partial/30",
  "Inoperante":      "bg-critical/10 text-critical border-critical/30",
  "Desativado":      "bg-muted text-muted-foreground border-border",
};

const defaults: FormData = {
  unidade_id: "", tipo: "Câmera", identificacao: "", fabricante: "", modelo: "",
  numero_serie: "", numero_patrimonio: "", localizacao: "", data_instalacao: "",
  ultima_manutencao: "", proxima_manutencao: "", garantia_ate: "",
  contrato_vinculado: "", status: "Operacional", observacoes: "",
};

const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

export default function EquipamentosPage() {
  const { isOperador, unidadeId, unidadeNome: authUnidadeNome } = useAuth();
  const items = useEquipamentosMock();
  const unidades = useUnidadesMock();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [unidadeFilter, setUnidadeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipamento | null>(null);
  const [deleting, setDeleting] = useState<Equipamento | null>(null);

  useEffect(() => { document.title = "Equipamentos | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const unidadeNome = (id: string) => unidades.find((u) => u.id === id)?.nome ?? "—";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((e) => {
      if (tipoFilter !== "all" && e.tipo !== tipoFilter) return false;
      if (unidadeFilter !== "all" && e.unidade_id !== unidadeFilter) return false;
      return (
        e.identificacao.toLowerCase().includes(q) ||
        e.fabricante.toLowerCase().includes(q) ||
        e.modelo.toLowerCase().includes(q) ||
        e.localizacao.toLowerCase().includes(q) ||
        unidadeNome(e.unidade_id).toLowerCase().includes(q)
      );
    });
  }, [items, search, tipoFilter, unidadeFilter, unidades]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ ...defaults, unidade_id: isOperador ? (unidadeId ?? "") : (unidades[0]?.id ?? "") });
    setOpen(true);
  };
  const openEdit = (e: Equipamento) => {
    setEditing(e);
    const { id: _id, ...rest } = e;
    form.reset(rest);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload: Omit<Equipamento, "id"> = {
      unidade_id: data.unidade_id,
      tipo: data.tipo,
      identificacao: data.identificacao,
      fabricante: data.fabricante ?? "",
      modelo: data.modelo ?? "",
      numero_serie: data.numero_serie ?? "",
      numero_patrimonio: data.numero_patrimonio ?? "",
      localizacao: data.localizacao,
      data_instalacao: data.data_instalacao ?? "",
      ultima_manutencao: data.ultima_manutencao ?? "",
      proxima_manutencao: data.proxima_manutencao ?? "",
      garantia_ate: data.garantia_ate ?? "",
      contrato_vinculado: data.contrato_vinculado ?? "",
      status: data.status,
      observacoes: data.observacoes ?? "",
    };
    try {
      if (editing) {
        await updateEquipamento(editing.id, payload);
        toast({ title: "Equipamento atualizado" });
      } else {
        await addEquipamento(payload);
        toast({ title: "Equipamento cadastrado" });
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
        description="Inventário de equipamentos de segurança vinculados às unidades prediais."
        actions={
          <Button onClick={openCreate} disabled={unidades.length === 0}>
            <Plus className="mr-1 h-4 w-4" />Novo equipamento
          </Button>
        }
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por identificação, modelo, localização ou unidade..."
        count={filtered.length}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPOS_EQUIPAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Cpu} title="Nenhum equipamento encontrado" description="Ajuste os filtros ou cadastre um novo equipamento." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificação</TableHead>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Garantia até</TableHead>
                <TableHead>Próx. manutenção</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const Icon = tipoIcon[e.tipo];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.identificacao}</TableCell>
                    <TableCell className="text-muted-foreground">{e.numero_patrimonio || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="h-4 w-4" />{e.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{unidadeNome(e.unidade_id)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[e.fabricante, e.modelo].filter(Boolean).join(" • ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.garantia_ate ? <GarantiaBadge data={e.garantia_ate} /> : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(e.proxima_manutencao)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone[e.status]}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(e)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Editar equipamento" : "Novo equipamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Vínculo e classificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unidade predial" error={form.formState.errors.unidade_id?.message}>
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
                <Field label="Tipo de equipamento">
                  <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as TipoEquipamento)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_EQUIPAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Identificação / Tag" error={form.formState.errors.identificacao?.message}>
                  <Input {...form.register("identificacao")} placeholder="Ex.: CAM-001" />
                </Field>
                <Field label="Status">
                  <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as StatusEquipamento)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_EQUIPAMENTO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Especificações">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Fabricante"><Input {...form.register("fabricante")} /></Field>
                <Field label="Modelo"><Input {...form.register("modelo")} /></Field>
                <Field label="Número de série"><Input {...form.register("numero_serie")} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nº de Patrimônio / Tombamento">
                  <Input {...form.register("numero_patrimonio")} placeholder="Ex.: 2024-00123" />
                </Field>
                <Field label="Contrato vinculado">
                  <Input {...form.register("contrato_vinculado")} placeholder="Ex.: 058/2023" />
                </Field>
              </div>
              <Field label="Localização" error={form.formState.errors.localizacao?.message}>
                <Input {...form.register("localizacao")} placeholder="Ex.: Hall de entrada" />
              </Field>
            </Section>

            <Section title="Datas">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Data de instalação"><Input type="date" {...form.register("data_instalacao")} /></Field>
                <Field label="Última manutenção"><Input type="date" {...form.register("ultima_manutencao")} /></Field>
                <Field label="Próxima manutenção"><Input type="date" {...form.register("proxima_manutencao")} /></Field>
                <Field label="Garantia até"><Input type="date" {...form.register("garantia_ate")} /></Field>
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
            await removeEquipamento(deleting.id);
            toast({ title: "Equipamento excluído" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir o equipamento "${deleting.identificacao}"?` : undefined}
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

function GarantiaBadge({ data }: { data: string }) {
  const hoje = new Date();
  const fim  = new Date(data + "T00:00:00");
  const dias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const txt  = fmtDate(data);
  if (dias < 0)   return <Badge variant="outline" className="text-[10px] bg-critical/10 text-critical border-critical/30">Vencida {txt}</Badge>;
  if (dias <= 90) return <Badge variant="outline" className="text-[10px] bg-partial/15 text-partial border-partial/30">Vence {txt}</Badge>;
  return <span className="text-xs text-muted-foreground">{txt}</span>;
}
