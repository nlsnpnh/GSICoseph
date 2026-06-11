import { useMemo, useState } from "react";
import { Plus, Save, RotateCcw, Trash2, ExternalLink, Loader2, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import {
  type PlanejamentoAcao,
  type PlanejamentoPatch,
  type SetorKey,
  STATUS_OPCOES,
  PRIORIDADE_OPCOES,
  useSalvarPlanejamento,
  useCriarAcao,
  useExcluirAcao,
} from "@/data/planejamento";
import { statusBadgeClass, prioridadeBadgeClass } from "./statusUtils";

const TODOS = "__todos__";

type Props = {
  ano: number;
  setor: SetorKey;
  acoes: PlanejamentoAcao[];
};

export function PlanejamentoSetor({ ano, setor, acoes }: Props) {
  const salvar = useSalvarPlanejamento();
  const criar = useCriarAcao();
  const excluir = useExcluirAcao();

  // Edições locais pendentes (id -> patch). Salvas só no botão "Salvar alterações".
  const [form, setForm] = useState<Record<string, PlanejamentoPatch>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [fEixo, setFEixo] = useState<string>(TODOS);
  const [fResp, setFResp] = useState<string>(TODOS);
  const [fPrio, setFPrio] = useState<string>(TODOS);
  const [fStatus, setFStatus] = useState<string>(TODOS);

  const eixos = useMemo(
    () => Array.from(new Set(acoes.map((a) => a.eixo).filter(Boolean))) as string[],
    [acoes],
  );
  const responsaveis = useMemo(
    () => Array.from(new Set(acoes.map((a) => a.responsavel).filter(Boolean))) as string[],
    [acoes],
  );

  const filtradas = useMemo(
    () =>
      acoes.filter(
        (a) =>
          (fEixo === TODOS || a.eixo === fEixo) &&
          (fResp === TODOS || a.responsavel === fResp) &&
          (fPrio === TODOS || a.prioridade === fPrio) &&
          (fStatus === TODOS || a.status === fStatus),
      ),
    [acoes, fEixo, fResp, fPrio, fStatus],
  );

  const dirtyCount = Object.keys(form).length;

  function val<K extends keyof PlanejamentoAcao>(a: PlanejamentoAcao, k: K) {
    const patch = form[a.id] as Record<string, unknown> | undefined;
    return (patch && k in patch ? patch[k as string] : a[k]) as PlanejamentoAcao[K];
  }
  function setField(id: string, patch: PlanejamentoPatch) {
    setForm((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSalvar() {
    const rows = Object.entries(form).map(([id, patch]) => ({ id, ...patch }));
    if (rows.length === 0) return;
    try {
      await salvar.mutateAsync(rows);
      setForm({});
      toast({ title: "Alterações salvas", description: `${rows.length} ação(ões) atualizada(s).` });
    } catch (e: unknown) {
      toast({ title: "Erro ao salvar", description: String((e as Error)?.message ?? e), variant: "destructive" });
    }
  }

  async function handleCriar() {
    const ordem = (acoes.reduce((m, a) => Math.max(m, a.ordem), 0) || 0) + 1;
    try {
      await criar.mutateAsync({ ano, setor, ordem });
      toast({ title: "Ação criada", description: "Preencha os dados e salve." });
    } catch (e: unknown) {
      toast({ title: "Erro ao criar", description: String((e as Error)?.message ?? e), variant: "destructive" });
    }
  }

  async function handleExcluir(id: string) {
    try {
      await excluir.mutateAsync(id);
      setForm((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast({ title: "Ação excluída" });
    } catch (e: unknown) {
      toast({ title: "Erro ao excluir", description: String((e as Error)?.message ?? e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações + filtros */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
            <FilterSelect label="Eixo" value={fEixo} onChange={setFEixo} options={eixos} />
            <FilterSelect label="Responsável" value={fResp} onChange={setFResp} options={responsaveis} />
            <FilterSelect label="Prioridade" value={fPrio} onChange={setFPrio} options={PRIORIDADE_OPCOES} />
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={STATUS_OPCOES} />
          </div>
          <div className="flex items-center gap-2">
            {dirtyCount > 0 && (
              <span className="text-xs font-medium text-partial">
                {dirtyCount} alteração(ões) não salva(s)
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => setForm({})} disabled={dirtyCount === 0}>
              <RotateCcw className="mr-1 h-4 w-4" /> Descartar
            </Button>
            <Button size="sm" onClick={handleSalvar} disabled={dirtyCount === 0 || salvar.isPending}>
              {salvar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Salvar alterações
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCriar} disabled={criar.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Nova ação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {filtradas.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma ação encontrada"
              description="Ajuste os filtros ou crie uma nova ação para este setor."
            />
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="min-w-[140px]">Eixo / Problema</TableHead>
                    <TableHead className="min-w-[150px]">Público-Alvo</TableHead>
                    <TableHead className="min-w-[260px]">Ação / Etapas</TableHead>
                    <TableHead className="min-w-[150px]">Responsável</TableHead>
                    <TableHead className="min-w-[120px]">Prazo/Data</TableHead>
                    <TableHead className="min-w-[120px]">Frequência</TableHead>
                    <TableHead className="min-w-[110px]">Prioridade</TableHead>
                    <TableHead className="min-w-[150px]">Status</TableHead>
                    <TableHead className="min-w-[90px]">% Exec.</TableHead>
                    <TableHead className="min-w-[140px]">Início</TableHead>
                    <TableHead className="min-w-[140px]">Conclusão</TableHead>
                    <TableHead className="min-w-[160px]">Indicador / Entrega</TableHead>
                    <TableHead className="min-w-[140px]">Evidência / SEI</TableHead>
                    <TableHead className="min-w-[160px]">Link / Documento</TableHead>
                    <TableHead className="min-w-[200px]">Observações</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((a) => {
                    const isDirty = !!form[a.id];
                    const link = (val(a, "link_documento") as string | null) ?? "";
                    return (
                      <TableRow key={a.id} className={isDirty ? "bg-partial/5" : undefined}>
                        <TableCell className="align-top text-xs">
                          <span className="font-medium">{a.eixo}</span>
                          {a.problema && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{a.problema}</p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Textarea
                            className="min-h-[34px] text-xs"
                            rows={1}
                            value={(val(a, "publico_alvo") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { publico_alvo: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          <span className="font-medium">{a.acao}</span>
                          {a.etapas && (
                            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{a.etapas}</p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            className="h-8 text-xs"
                            value={(val(a, "responsavel") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { responsavel: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            className="h-8 text-xs"
                            value={(val(a, "prazo_data") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { prazo_data: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            className="h-8 text-xs"
                            value={(val(a, "frequencia") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { frequencia: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Select
                            value={(val(a, "prioridade") as string | null) ?? ""}
                            onValueChange={(v) => setField(a.id, { prioridade: v as PlanejamentoAcao["prioridade"] })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORIDADE_OPCOES.map((p) => (
                                <SelectItem key={p} value={p}>
                                  <Badge variant="outline" className={prioridadeBadgeClass(p)}>{p}</Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="align-top">
                          <Select
                            value={val(a, "status") as string}
                            onValueChange={(v) => setField(a.id, { status: v as PlanejamentoAcao["status"] })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPCOES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  <Badge variant="outline" className={statusBadgeClass(s)}>{s}</Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="—"
                            className="h-8 w-20 text-xs"
                            value={(() => {
                              const p = val(a, "percentual") as number | null;
                              return p == null ? "" : String(p);
                            })()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setField(a.id, { percentual: null });
                                return;
                              }
                              const n = Math.max(0, Math.min(100, Number(raw) || 0));
                              setField(a.id, { percentual: n });
                            }}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={(val(a, "data_inicio") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { data_inicio: e.target.value || null })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={(val(a, "data_conclusao") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { data_conclusao: e.target.value || null })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Textarea
                            className="min-h-[34px] text-xs"
                            rows={1}
                            value={(val(a, "indicador") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { indicador: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            className="h-8 text-xs"
                            value={(val(a, "evidencia_sei") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { evidencia_sei: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1">
                            <Input
                              type="url"
                              placeholder="https://..."
                              className="h-8 text-xs"
                              value={link}
                              onChange={(e) => setField(a.id, { link_documento: e.target.value || null })}
                            />
                            {link && (
                              <a href={link} target="_blank" rel="noreferrer" className="text-primary shrink-0" title="Abrir documento">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Textarea
                            className="min-h-[34px] text-xs"
                            rows={1}
                            value={(val(a, "observacoes") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { observacoes: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-critical"
                            onClick={() => setConfirmId(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDelete
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) handleExcluir(confirmId);
          setConfirmId(null);
        }}
        title="Excluir ação"
        description="A ação será removida do planejamento. Esta operação não pode ser desfeita."
      />
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
