import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useComarcas } from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  CARGOS, REGIMES, ESCALAS, SITUACOES, type ServidorSeg, type SituacaoFuncional,
  useServidoresMock, addServidorMock, updateServidorMock, removeServidorMock,
  calcIdade, tempoServicoAnos,
} from "@/data/servidoresMock";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  matricula: z.string().trim().min(3, "Mínimo 3 caracteres").max(20),
  cargo: z.enum(CARGOS),
  funcao_atual: z.string().trim().max(120).optional().or(z.literal("")),
  unidade_id: z.string().optional().or(z.literal("")),
  regime: z.enum(REGIMES),
  escala: z.enum(ESCALAS),
  situacao: z.enum(SITUACOES),
  email: z.string().trim().email("E-mail inválido").max(120),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  data_ingresso: z.string().optional().or(z.literal("")),
  data_nascimento: z.string().optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const situacaoTone: Record<SituacaoFuncional, string> = {
  Ativo:      "bg-adequate/10 text-adequate border-adequate/30",
  Férias:     "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Licença:    "bg-partial/15 text-partial border-partial/30",
  Afastado:   "bg-partial/15 text-partial border-partial/30",
  Cedido:     "bg-purple-500/10 text-purple-600 border-purple-500/30",
  Aposentado: "bg-muted text-muted-foreground border-border",
};

const defaults: FormData = {
  nome: "", matricula: "", cargo: "Agente de Segurança", funcao_atual: "", unidade_id: "",
  regime: "Estatutário", escala: "Expediente (7h)", situacao: "Ativo", email: "", telefone: "",
  data_ingresso: "", data_nascimento: "", observacoes: "",
};

export default function ServidoresPage() {
  const { isOperador, unidadeId: authUnidadeId, unidadeNome: authUnidadeNome } = useAuth();
  const items = useServidoresMock();
  const unidades = useUnidadesMock();
  const { data: comarcas = [] } = useComarcas();
  const [search, setSearch] = useState("");
  const [comarcaFilter, setComarcaFilter] = useState<string>("all");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("all");
  const [formComarcaId, setFormComarcaId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServidorSeg | null>(null);
  const [deleting, setDeleting] = useState<ServidorSeg | null>(null);

  useEffect(() => { document.title = "Servidores | COSEPH TJRO"; }, []);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: defaults });

  // unidades filtradas pela comarca selecionada no formulário
  const unidadesDaComarca = useMemo(
    () => formComarcaId ? unidades.filter((u) => u.comarca_id === formComarcaId) : unidades,
    [unidades, formComarcaId],
  );

  // mapa unidade_id → {nome, comarca_nome} para exibição na tabela
  const unidadeMap = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u])),
    [unidades],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((s) => {
      if (situacaoFilter !== "all" && s.situacao !== situacaoFilter) return false;
      if (comarcaFilter !== "all") {
        const unid = s.unidade_id ? unidadeMap[s.unidade_id] : null;
        if (!unid || unid.comarca_id !== comarcaFilter) return false;
      }
      return (
        s.nome.toLowerCase().includes(q) ||
        s.matricula.toLowerCase().includes(q) ||
        s.cargo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.unidade_id ? (unidadeMap[s.unidade_id]?.nome ?? "").toLowerCase().includes(q) : false)
      );
    });
  }, [items, search, comarcaFilter, situacaoFilter, unidadeMap]);

  const openCreate = () => {
    setEditing(null);
    setFormComarcaId(isOperador && authUnidadeId ? (unidadeMap[authUnidadeId]?.comarca_id ?? "") : "");
    if (isOperador && authUnidadeId) {
      form.reset({ ...defaults, unidade_id: authUnidadeId });
    } else {
      form.reset(defaults);
    }
    setOpen(true);
  };

  const openEdit = (s: ServidorSeg) => {
    setEditing(s);
    const unid = s.unidade_id ? unidadeMap[s.unidade_id] : null;
    setFormComarcaId(unid?.comarca_id ?? "");
    form.reset({
      nome: s.nome,
      matricula: s.matricula,
      cargo: s.cargo,
      funcao_atual: s.funcao_atual,
      unidade_id: s.unidade_id ?? "",
      regime: s.regime,
      escala: s.escala,
      situacao: s.situacao,
      email: s.email,
      telefone: s.telefone,
      data_ingresso: s.data_ingresso,
      data_nascimento: s.data_nascimento,
      observacoes: s.observacoes,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload: Omit<ServidorSeg, "id"> = {
      nome: data.nome,
      matricula: data.matricula,
      cargo: data.cargo,
      funcao_atual: data.funcao_atual ?? "",
      unidade_id: data.unidade_id || null,
      regime: data.regime,
      escala: data.escala,
      situacao: data.situacao,
      email: data.email,
      telefone: data.telefone ?? "",
      data_ingresso: data.data_ingresso ?? "",
      data_nascimento: data.data_nascimento ?? "",
      observacoes: data.observacoes ?? "",
    };
    try {
      if (editing) {
        await updateServidorMock(editing.id, payload);
        toast({ title: "Servidor atualizado" });
      } else {
        await addServidorMock(payload);
        toast({ title: "Servidor cadastrado" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Servidores da Segurança"
        description="Cadastro funcional dos servidores vinculados à segurança institucional."
        actions={<Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Novo servidor</Button>}
      />

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por nome, matrícula, cargo, unidade ou e-mail..."
        count={filtered.length}
        filters={
          <div className="flex flex-wrap gap-2">
            {!isOperador && (
              <Select value={comarcaFilter} onValueChange={setComarcaFilter}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Comarca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as comarcas</SelectItem>
                  {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas situações</SelectItem>
                {SITUACOES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum servidor encontrado" description="Ajuste os filtros ou cadastre um novo servidor." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Cargo / Função</TableHead>
                <TableHead>Unidade / Comarca</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const idade = calcIdade(s.data_nascimento);
                const tempo = tempoServicoAnos(s.data_ingresso);
                const unid = s.unidade_id ? unidadeMap[s.unidade_id] : null;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div>{s.nome}</div>
                      <div className="text-xs text-muted-foreground">{s.email}{s.telefone ? ` • ${s.telefone}` : ""}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.matricula}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{s.cargo}</div>
                      {s.funcao_atual && <div className="text-xs">{s.funcao_atual}</div>}
                    </TableCell>
                    <TableCell>
                      <div>{unid?.nome ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{unid?.comarca_nome ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.regime}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{tempo != null ? `${tempo} anos` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{idade != null ? `${idade}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={situacaoTone[s.situacao]}>{s.situacao}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Editar servidor" : "Novo servidor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Section title="Identificação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" error={form.formState.errors.nome?.message}>
                  <Input {...form.register("nome")} />
                </Field>
                <Field label="Matrícula" error={form.formState.errors.matricula?.message}>
                  <Input {...form.register("matricula")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cargo">
                  <Select value={form.watch("cargo")} onValueChange={(v) => form.setValue("cargo", v as FormData["cargo"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARGOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Função atual">
                  <Input {...form.register("funcao_atual")} placeholder="Ex.: Coordenador Nuseg" />
                </Field>
              </div>
            </Section>

            <Section title="Lotação">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Comarca (filtro)">
                  {isOperador ? (
                    <Input value={authUnidadeNome ? (unidadeMap[authUnidadeId ?? ""]?.comarca_nome ?? "") : ""} disabled className="bg-muted" />
                  ) : (
                    <Select
                      value={formComarcaId || "all"}
                      onValueChange={(v) => {
                        setFormComarcaId(v === "all" ? "" : v);
                        form.setValue("unidade_id", "");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">— Todas —</SelectItem>
                        {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <Field label="Unidade" error={form.formState.errors.unidade_id?.message}>
                  {isOperador ? (
                    <Input value={authUnidadeNome ?? ""} disabled className="bg-muted" />
                  ) : (
                    <Select value={form.watch("unidade_id") || "none"} onValueChange={(v) => form.setValue("unidade_id", v === "none" ? "" : v, { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Nenhuma —</SelectItem>
                        {unidadesDaComarca.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              </div>
            </Section>

            <Section title="Vínculo funcional">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Regime de trabalho">
                  <Select value={form.watch("regime")} onValueChange={(v) => form.setValue("regime", v as FormData["regime"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REGIMES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Escala">
                  <Select value={form.watch("escala")} onValueChange={(v) => form.setValue("escala", v as FormData["escala"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESCALAS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Situação funcional">
                  <Select value={form.watch("situacao")} onValueChange={(v) => form.setValue("situacao", v as SituacaoFuncional)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SITUACOES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Contato institucional">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="E-mail institucional" error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} placeholder="nome@tjro.jus.br" />
                </Field>
                <Field label="Telefone">
                  <Input {...form.register("telefone")} placeholder="(69) 0 0000-0000" />
                </Field>
              </div>
            </Section>

            <Section title="Tempo e idade">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data de ingresso">
                  <Input type="date" {...form.register("data_ingresso")} />
                </Field>
                <Field label="Data de nascimento">
                  <Input type="date" {...form.register("data_nascimento")} />
                </Field>
              </div>
            </Section>

            <Section title="Observações administrativas">
              <Textarea rows={3} {...form.register("observacoes")} placeholder="Anotações restritas..." />
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
            await removeServidorMock(deleting.id);
            toast({ title: "Servidor excluído" });
          } catch (e: any) {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
          }
          setDeleting(null);
        }}
        description={deleting ? `Excluir o servidor "${deleting.nome}"?` : undefined}
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
