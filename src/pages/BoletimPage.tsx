import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Download, Filter, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useComarcas } from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BOLETIM_ITENS_FIXOS, useBoletimMes, useBoletimList, useUpsertBoletim,
} from "@/data/boletim";
import { toast } from "@/hooks/use-toast";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ANOS = (() => {
  const atual = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => atual - i);
})();

type LinhaForm = { quantidade: number; observacoes: string };

const ITENS = BOLETIM_ITENS_FIXOS;

const linhasZeradas = (): Record<number, LinhaForm> =>
  Object.fromEntries(ITENS.map((it) => [it.item_number, { quantidade: 0, observacoes: "" }]));

export default function BoletimPage() {
  useEffect(() => { document.title = "Boletim Operacional | COSEPH TJRO"; }, []);
  const { isOperador, unidadeId } = useAuth();
  const unidades = useUnidadesMock();
  const { data: comarcas = [] } = useComarcas();

  const hoje = new Date();
  const [unidade, setUnidade] = useState<string>("");
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1);
  const [ano, setAno] = useState<number>(hoje.getFullYear());

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
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Boletim Operacional"
        description="Indicadores mensais por unidade — preenchimento e histórico."
      />

      <Tabs defaultValue="lancamento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lancamento">
            <ClipboardList className="mr-2 h-4 w-4" />Lançamento Mensal
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Filter className="mr-2 h-4 w-4" />Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-4">
          <Card>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
              <CardTitle className="text-sm font-semibold">
                Indicadores — {MESES[mes - 1]}/{ano}
              </CardTitle>
              <Button onClick={onSalvar} disabled={upsert.isPending || !unidade}>
                <Save className="mr-1.5 h-4 w-4" />
                {upsert.isPending ? "Salvando..." : "Salvar Boletim Mensal"}
              </Button>
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
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoTab unidades={unidades} comarcas={comarcas} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function HistoricoTab({
  unidades, comarcas,
}: {
  unidades: { id: string; nome: string; comarca_id: string | null }[];
  comarcas: { id: string; nome: string }[];
}) {
  const itens = ITENS;
  const [fAno, setFAno] = useState<string>("all");
  const [fMes, setFMes] = useState<string>("all");
  const [fUnidade, setFUnidade] = useState<string>("all");
  const [fComarca, setFComarca] = useState<string>("all");
  const [fItem, setFItem] = useState<string>("all");

  const filtros = useMemo(() => ({
    ano: fAno === "all" ? null : Number(fAno),
    mes: fMes === "all" ? null : Number(fMes),
    unidadeId: fUnidade === "all" ? null : fUnidade,
    comarcaId: fComarca === "all" ? null : fComarca,
    itemNumber: fItem === "all" ? null : Number(fItem),
  }), [fAno, fMes, fUnidade, fComarca, fItem]);

  const { data: rows = [], isLoading } = useBoletimList(filtros);

  const itemMap = useMemo(
    () => Object.fromEntries(itens.map((i) => [i.item_number, i.descricao])),
    [itens],
  );

  const exportarCSV = () => {
    if (rows.length === 0) {
      toast({ title: "Sem dados para exportar" });
      return;
    }
    const header = ["Ano", "Mês", "Comarca", "Unidade", "Item", "Descrição", "Quantidade", "Observações"];
    const csv = [
      header.join(";"),
      ...rows.map((r) => [
        r.ano,
        String(r.mes).padStart(2, "0"),
        r.comarca_nome,
        r.unidade_nome,
        r.item_number,
        `"${(itemMap[r.item_number] ?? "").replace(/"/g, '""')}"`,
        r.quantidade,
        `"${(r.observacoes ?? "").replace(/"/g, '""')}"`,
      ].join(";")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boletim_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold">Lançamentos registrados</CardTitle>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="mr-1.5 h-4 w-4" />Exportar CSV
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Select value={fAno} onValueChange={setFAno}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fMes} onValueChange={setFMes}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MESES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fComarca} onValueChange={(v) => { setFComarca(v); setFUnidade("all"); }}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Comarca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as comarcas</SelectItem>
              {comarcas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fUnidade} onValueChange={setFUnidade}>
            <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {unidades
                .filter((u) => fComarca === "all" || u.comarca_id === fComarca)
                .map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fItem} onValueChange={setFItem}>
            <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue placeholder="Item" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os itens</SelectItem>
              {itens.map((i) => (
                <SelectItem key={i.item_number} value={String(i.item_number)}>
                  {String(i.item_number).padStart(2, "0")} — {i.descricao.slice(0, 50)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum lançamento encontrado"
            description="Ajuste os filtros ou registre um novo boletim mensal."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Período</TableHead>
                <TableHead>Unidade / Comarca</TableHead>
                <TableHead className="w-12">Item</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24 text-right">Qtd.</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    {String(r.mes).padStart(2, "0")}/{r.ano}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{r.unidade_nome}</div>
                    <div className="text-muted-foreground">{r.comarca_nome}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {String(r.item_number).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="text-xs leading-snug">
                    {itemMap[r.item_number] ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{r.quantidade}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.observacoes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
