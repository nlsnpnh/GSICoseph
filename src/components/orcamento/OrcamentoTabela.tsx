import { useMemo, useState } from "react";
import { Plus, Save, RotateCcw, Trash2, Loader2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CampoTexto } from "@/components/admin/CampoTexto";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmptyState } from "@/components/EmptyState";
import { CurrencyInput } from "@/components/orcamento/CurrencyInput";
import { toast } from "@/hooks/use-toast";
import { FioAcento } from "@/components/admin/FioAcento";
import {
  type AcaoCodigo,
  type OrcamentoAcao,
  type OrcamentoAcaoPatch,
  fmtBRL,
  useSalvarAcoes,
  useCriarAcaoItem,
  useExcluirAcaoItem,
} from "@/data/orcamento";

type Props = {
  ano: number;
  acao: AcaoCodigo;
  itens: OrcamentoAcao[];
};

// Colunas monetárias editáveis (na ordem da planilha).
const COLS_NUM: { key: keyof OrcamentoAcao; label: string }[] = [
  { key: "dotacao", label: "Dotação" },
  { key: "empenho", label: "Empenho" },
  { key: "reforco_empenho", label: "Reforço Emp." },
  { key: "anulacao_empenho", label: "Anulação Saldo Emp." },
  { key: "saldo_dotacao", label: "Saldo da Dotação" },
  { key: "liquidado", label: "Liquidado" },
  { key: "saldo_empenho", label: "Saldo de Empenho" },
];

export function OrcamentoTabela({ ano, acao, itens }: Props) {
  const salvar = useSalvarAcoes();
  const criar = useCriarAcaoItem();
  const excluir = useExcluirAcaoItem();

  const [form, setForm] = useState<Record<string, OrcamentoAcaoPatch>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const dirtyCount = Object.keys(form).length;

  function val<K extends keyof OrcamentoAcao>(a: OrcamentoAcao, k: K): OrcamentoAcao[K] {
    const patch = form[a.id] as Record<string, unknown> | undefined;
    return (patch && k in patch ? patch[k as string] : a[k]) as OrcamentoAcao[K];
  }
  function setField(id: string, patch: OrcamentoAcaoPatch) {
    setForm((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // Totais (refletem edições pendentes).
  const totais = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const c of COLS_NUM) {
      acc[c.key as string] = itens.reduce((s, a) => s + Number(val(a, c.key) ?? 0), 0);
    }
    return acc;
  }, [itens, form]); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleCriar() {
    const ordem = (itens.reduce((m, a) => Math.max(m, a.ordem), 0) || 0) + 1;
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

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <CardContent className="flex flex-wrap items-center justify-end gap-2 p-3">
          {dirtyCount > 0 && (
            <span className="mr-auto text-xs font-medium text-partial">
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
            <Plus className="mr-1 h-4 w-4" /> Nova linha
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <CardContent className="p-0">
          {itens.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhuma despesa cadastrada"
              description="Crie uma nova linha para esta ação orçamentária."
            />
          ) : (
            <div className="max-h-[620px] overflow-auto scrollbar-hide">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="min-w-[120px]">ED</TableHead>
                    <TableHead className="min-w-[90px]">SL</TableHead>
                    <TableHead className="min-w-[120px]">Fonte</TableHead>
                    <TableHead className="min-w-[280px]">Objeto</TableHead>
                    {COLS_NUM.map((c) => (
                      <TableHead key={c.key as string} className="min-w-[160px] text-right">{c.label}</TableHead>
                    ))}
                    <TableHead className="min-w-[150px]">Protocolo</TableHead>
                    <TableHead className="min-w-[130px]">Nota Empenho</TableHead>
                    <TableHead className="min-w-[200px]">Observação</TableHead>
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((a) => {
                    const isDirty = !!form[a.id];
                    return (
                      <TableRow key={a.id} className={isDirty ? "bg-partial/5" : undefined}>
                        <TableCell className="align-top">
                          <Input className="h-9 text-sm" value={(val(a, "ed") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { ed: e.target.value })} />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input className="h-9 text-sm" value={(val(a, "sl") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { sl: e.target.value })} />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input className="h-9 text-sm" value={(val(a, "fonte") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { fonte: e.target.value })} />
                        </TableCell>
                        <TableCell className="align-top">
                          <CampoTexto
                            aria-label="Objeto"
                            value={(val(a, "objeto") as string | null) ?? ""}
                            onChange={(v) => setField(a.id, { objeto: v })} />
                        </TableCell>
                        {COLS_NUM.map((c) => (
                          <TableCell key={c.key as string} className="align-top">
                            <CurrencyInput
                              className="h-9 min-w-[150px] text-sm"
                              value={val(a, c.key) as number}
                              onChange={(v) => setField(a.id, { [c.key]: v } as OrcamentoAcaoPatch)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="align-top">
                          <Input className="h-8 text-xs" value={(val(a, "protocolo") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { protocolo: e.target.value })} />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input className="h-8 text-xs" value={(val(a, "nota_empenho") as string | null) ?? ""}
                            onChange={(e) => setField(a.id, { nota_empenho: e.target.value })} />
                        </TableCell>
                        <TableCell className="align-top">
                          <CampoTexto
                            aria-label="Observação"
                            value={(val(a, "observacao") as string | null) ?? ""}
                            onChange={(v) => setField(a.id, { observacao: v })} />
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
                <TableFooter className="sticky bottom-0 bg-muted/60">
                  <TableRow className="font-semibold">
                    <TableCell colSpan={4}>TOTAL — {acao}</TableCell>
                    {COLS_NUM.map((c) => (
                      <TableCell key={c.key as string} className="text-right tabular-nums">
                        {fmtBRL(totais[c.key as string] ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell colSpan={4} />
                  </TableRow>
                </TableFooter>
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
        title="Excluir linha"
        description="A despesa será removida desta ação orçamentária. Esta operação não pode ser desfeita."
      />
    </div>
  );
}
