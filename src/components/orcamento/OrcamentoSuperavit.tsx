import { useMemo, useState } from "react";
import { Plus, Save, RotateCcw, Trash2, Loader2, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { CurrencyInput } from "@/components/orcamento/CurrencyInput";
import { toast } from "@/hooks/use-toast";
import {
  ACOES,
  type AcaoCodigo,
  type OrcamentoSuperavit as Item,
  type OrcamentoSuperavitPatch,
  fmtBRL,
  useSalvarSuperavit,
  useCriarSuperavitItem,
  useExcluirSuperavitItem,
} from "@/data/orcamento";

type Props = { ano: number; itens: Item[] };

export function OrcamentoSuperavit({ ano, itens }: Props) {
  const salvar = useSalvarSuperavit();
  const criar = useCriarSuperavitItem();
  const excluir = useExcluirSuperavitItem();

  const [form, setForm] = useState<Record<string, OrcamentoSuperavitPatch>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const dirtyCount = Object.keys(form).length;

  function val<K extends keyof Item>(a: Item, k: K): Item[K] {
    const patch = form[a.id] as Record<string, unknown> | undefined;
    return (patch && k in patch ? patch[k as string] : a[k]) as Item[K];
  }
  function setField(id: string, patch: OrcamentoSuperavitPatch) {
    setForm((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const totalGeral = useMemo(
    () => itens.reduce((s, a) => s + Number(val(a, "valor_total") ?? 0), 0),
    [itens, form], // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function handleSalvar() {
    const rows = Object.entries(form).map(([id, patch]) => ({ id, ...patch }));
    if (rows.length === 0) return;
    try {
      await salvar.mutateAsync(rows);
      setForm({});
      toast({ title: "Alterações salvas", description: `${rows.length} linha(s) atualizada(s).` });
    } catch (e: unknown) {
      toast({ title: "Erro ao salvar", description: String((e as Error)?.message ?? e), variant: "destructive" });
    }
  }

  async function handleCriar(acao: AcaoCodigo) {
    const ordem = (itens.filter((i) => i.acao === acao).reduce((m, a) => Math.max(m, a.ordem), 0) || 0) + 1;
    try {
      await criar.mutateAsync({ ano, acao, ordem });
      toast({ title: "Linha criada", description: "Preencha os dados e salve." });
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
      toast({ title: "Linha excluída" });
    } catch (e: unknown) {
      toast({ title: "Erro ao excluir", description: String((e as Error)?.message ?? e), variant: "destructive" });
    }
  }

  function qtdCell(a: Item) {
    const v = val(a, "quantidade") as number | null;
    return (
      <Input
        type="number"
        step="0.01"
        className="h-9 min-w-[90px] text-right text-sm tabular-nums"
        value={v == null ? "" : String(v)}
        onChange={(e) =>
          setField(a.id, { quantidade: e.target.value === "" ? null : Number(e.target.value) })
        }
      />
    );
  }

  function moneyCell(a: Item, key: "valor_unitario" | "valor_total") {
    return (
      <CurrencyInput
        className="h-9 min-w-[130px] text-sm"
        value={val(a, key) as number | null}
        onChange={(v) => setField(a.id, { [key]: v } as OrcamentoSuperavitPatch)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-end gap-2 p-3">
          {dirtyCount > 0 && (
            <span className="mr-auto text-xs font-medium text-partial">
              {dirtyCount} alteração(ões) não salva(s)
            </span>
          )}
          <span className="mr-auto text-sm font-semibold">
            Total Geral GSI: <span className="text-primary">{fmtBRL(totalGeral)}</span>
          </span>
          <Button variant="outline" size="sm" onClick={() => setForm({})} disabled={dirtyCount === 0}>
            <RotateCcw className="mr-1 h-4 w-4" /> Descartar
          </Button>
          <Button size="sm" onClick={handleSalvar} disabled={dirtyCount === 0 || salvar.isPending}>
            {salvar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      {ACOES.map((acaoDef) => {
        const grupo = itens.filter((i) => i.acao === acaoDef.codigo);
        const totalGrupo = grupo.reduce((s, a) => s + Number(val(a, "valor_total") ?? 0), 0);
        return (
          <Card key={acaoDef.codigo}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 p-3">
                <p className="text-sm font-semibold">
                  {acaoDef.label} <span className="font-normal text-muted-foreground">— Total {fmtBRL(totalGrupo)}</span>
                </p>
                <Button variant="secondary" size="sm" onClick={() => handleCriar(acaoDef.codigo)} disabled={criar.isPending}>
                  <Plus className="mr-1 h-4 w-4" /> Nova linha
                </Button>
              </div>

              {grupo.length === 0 ? (
                <EmptyState icon={PiggyBank} title="Nenhuma despesa nesta ação" description="Crie uma nova linha para começar." />
              ) : (
                <div className="overflow-auto scrollbar-hide">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">Especificação da Despesa</TableHead>
                        <TableHead className="min-w-[130px]">Elemento</TableHead>
                        <TableHead className="min-w-[180px]">Subelemento</TableHead>
                        <TableHead className="min-w-[130px]">Un. Medida</TableHead>
                        <TableHead className="min-w-[110px] text-right">Qtd</TableHead>
                        <TableHead className="min-w-[140px] text-right">Valor Unit.</TableHead>
                        <TableHead className="min-w-[150px] text-right">Valor Total</TableHead>
                        <TableHead className="min-w-[80px]">Exerc.</TableHead>
                        <TableHead className="min-w-[90px]">PCA?</TableHead>
                        <TableHead className="min-w-[140px]">Data Máxima</TableHead>
                        <TableHead className="min-w-[240px]">Justificativa</TableHead>
                        <TableHead className="w-[48px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grupo.map((a) => {
                        const isDirty = !!form[a.id];
                        return (
                          <TableRow key={a.id} className={isDirty ? "bg-partial/5" : undefined}>
                            <TableCell className="align-top">
                              <Textarea className="min-h-[34px] text-xs" rows={2}
                                value={(val(a, "especificacao") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { especificacao: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Input className="h-9 text-sm" value={(val(a, "elemento_despesa") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { elemento_despesa: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Textarea className="min-h-[36px] text-sm" rows={2} value={(val(a, "subelemento") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { subelemento: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Input className="h-9 text-sm" value={(val(a, "unidade_medida") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { unidade_medida: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">{qtdCell(a)}</TableCell>
                            <TableCell className="align-top">{moneyCell(a, "valor_unitario")}</TableCell>
                            <TableCell className="align-top">{moneyCell(a, "valor_total")}</TableCell>
                            <TableCell className="align-top">
                              <Input className="h-8 w-16 text-xs" value={(val(a, "exercicio") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { exercicio: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Input className="h-8 w-20 text-xs" value={(val(a, "envolve_pca") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { envolve_pca: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Input type="date" className="h-8 text-xs"
                                value={(val(a, "data_maxima") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { data_maxima: e.target.value || null })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Textarea className="min-h-[34px] text-xs" rows={2}
                                value={(val(a, "justificativa") as string | null) ?? ""}
                                onChange={(e) => setField(a.id, { justificativa: e.target.value })} />
                            </TableCell>
                            <TableCell className="align-top">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-critical"
                                onClick={() => setConfirmId(a.id)}>
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
        );
      })}

      <ConfirmDelete
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) handleExcluir(confirmId);
          setConfirmId(null);
        }}
        title="Excluir linha"
        description="A despesa será removida do superávit. Esta operação não pode ser desfeita."
      />
    </div>
  );
}
