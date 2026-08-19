import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidades } from "@/data/unidades";
import { BOLETIM_ITENS_FIXOS, useBoletimMes, useUpsertBoletim } from "@/data/boletim";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ANOS, ANO_VIGENTE, MES_VIGENTE, MESES } from "./constantes";
import { FioAcento } from "@/components/admin/FioAcento";

type LinhaForm = { quantidade: number; observacoes: string };

const ITENS = BOLETIM_ITENS_FIXOS;

const linhasZeradas = (): Record<number, LinhaForm> =>
  Object.fromEntries(ITENS.map((it) => [it.item_number, { quantidade: 0, observacoes: "" }]));

export function LancamentoTab({ unidades }: { unidades: ReturnType<typeof useUnidades> }) {
  const { isOperador, unidadeId, podeEditar } = useAuth();

  const [unidade, setUnidade] = useState<string>("");
  const [mes, setMes] = useState<number>(MES_VIGENTE);
  const [ano, setAno] = useState<number>(ANO_VIGENTE);

  // Operador: trava na própria unidade
  useEffect(() => {
    if (isOperador && unidadeId) setUnidade(unidadeId);
    else if (!unidade && unidades[0]) setUnidade(unidades[0].id);
  }, [isOperador, unidadeId, unidades, unidade]);

  const { data: lancamentos = [] } = useBoletimMes(unidade || null, ano, mes);
  const upsert = useUpsertBoletim();

  const [form, setForm] = useState<Record<number, LinhaForm>>(() => linhasZeradas());

  // Hidrata o form sempre que lançamentos chegam (ou troca de unidade/mês/ano).
  useEffect(() => {
    const next = linhasZeradas();
    for (const l of lancamentos) {
      next[l.item_number] = {
        quantidade: l.quantidade ?? 0,
        observacoes: l.observacoes ?? "",
      };
    }
    setForm(next);
  }, [lancamentos]);

  const handleQuantidade = (item: number, value: string) => {
    const n = value === "" ? 0 : Number(value);
    setForm((prev) => ({
      ...prev,
      [item]: { ...prev[item], quantidade: Number.isFinite(n) && n >= 0 ? n : 0 },
    }));
  };

  const handleObservacoes = (item: number, value: string) => {
    setForm((prev) => ({ ...prev, [item]: { ...prev[item], observacoes: value } }));
  };

  const onSalvar = async () => {
    if (!unidade) {
      toast({ title: "Selecione a unidade", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync({
        unidade_id: unidade,
        ano, mes,
        itens: ITENS.map((it) => ({
          item_number: it.item_number,
          quantidade: form[it.item_number]?.quantidade ?? 0,
          observacoes: form[it.item_number]?.observacoes ?? "",
        })),
      });
      toast({ title: "Boletim salvo", description: `${MESES[mes - 1]}/${ano}` });
    } catch (e) {
      toast({ title: "Erro ao salvar", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <>
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-semibold">Período e unidade</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade</Label>
                {isOperador ? (
                  <Input
                    value={unidades.find((u) => u.id === unidade)?.nome ?? ""}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mês</Label>
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ano</Label>
                <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ANOS.map((a) => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
              <CardTitle className="text-sm font-semibold">
                Indicadores — {MESES[mes - 1]}/{ano}
              </CardTitle>
              {/* RLS do boletim: operador so grava a propria unidade. */}
              {podeEditar("boletim", unidade || null) && (
                <Button onClick={onSalvar} disabled={upsert.isPending || !unidade}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {upsert.isPending ? "Salvando..." : "Salvar Boletim Mensal"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-32 text-right">Quantidade</TableHead>
                    <TableHead className="w-[28%]">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ITENS.map((it) => (
                    <TableRow key={it.item_number}>
                      <TableCell className="text-center font-mono text-xs">
                        {String(it.item_number).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="text-xs leading-snug">{it.descricao}</TableCell>
                      <TableCell>
                        <Input
                          type="number" min={0}
                          className="text-right"
                          value={form[it.item_number]?.quantidade ?? 0}
                          onChange={(e) => handleQuantidade(it.item_number, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={1}
                          className="min-h-[36px] resize-y text-xs"
                          value={form[it.item_number]?.observacoes ?? ""}
                          onChange={(e) => handleObservacoes(it.item_number, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
    </>
  );
}
