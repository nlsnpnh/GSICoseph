import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { OrcamentoMacrodesafios } from "@/components/orcamento/OrcamentoMacrodesafios";
import { OrcamentoTabela } from "@/components/orcamento/OrcamentoTabela";
import { OrcamentoSuperavit } from "@/components/orcamento/OrcamentoSuperavit";
import {
  ACOES,
  useAnosOrcamento,
  useOrcamentoAcoes,
  useOrcamentoSuperavit,
  useCriarAnoOrcamento,
} from "@/data/orcamento";

const SEM_CLONE = "__vazio__";

export default function OrcamentoPage() {
  const { isAdmin } = useAuth();
  useEffect(() => { document.title = "Orçamento | SIG-COSEPH"; }, []);

  const { data: anos = [] } = useAnosOrcamento();
  const [ano, setAno] = useState<number>(2026);

  useEffect(() => {
    if (anos.length > 0 && !anos.includes(ano)) {
      setAno(anos.includes(2026) ? 2026 : anos[0]);
    }
  }, [anos]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: acoes = [], isLoading: loadingAcoes } = useOrcamentoAcoes(ano);
  const { data: superavit = [], isLoading: loadingSup } = useOrcamentoSuperavit(ano);
  const isLoading = loadingAcoes || loadingSup;

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Orçamento" description="Acompanhamento da Execução Orçamentária GSI." />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Apenas administradores podem acessar o módulo de Orçamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Orçamento"
        description="Acompanhamento da Execução Orçamentária GSI — por ação orçamentária."
        actions={
          <div className="flex items-center gap-2">
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="h-9 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NovoAnoDialog anos={anos} anoAtual={ano} onCriado={setAno} />
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando orçamento...
        </div>
      ) : (
        <Tabs defaultValue="macrodesafios" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="macrodesafios">Macrodesafios GSI</TabsTrigger>
            {ACOES.map((a) => (
              <TabsTrigger key={a.codigo} value={a.codigo}>{a.label}</TabsTrigger>
            ))}
            <TabsTrigger value="superavit">Superávit {ano}</TabsTrigger>
          </TabsList>

          <TabsContent value="macrodesafios">
            <OrcamentoMacrodesafios itens={acoes} />
          </TabsContent>

          {ACOES.map((a) => (
            <TabsContent key={a.codigo} value={a.codigo}>
              <div className="mb-3 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-foreground">{a.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.titulo}</p>
              </div>
              <OrcamentoTabela
                ano={ano}
                acao={a.codigo}
                itens={acoes.filter((i) => i.acao === a.codigo)}
              />
            </TabsContent>
          ))}

          <TabsContent value="superavit">
            <OrcamentoSuperavit ano={ano} itens={superavit} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function NovoAnoDialog({
  anos, anoAtual, onCriado,
}: { anos: number[]; anoAtual: number; onCriado: (ano: number) => void }) {
  const criarAno = useCriarAnoOrcamento();
  const [open, setOpen] = useState(false);
  const sugestao = useMemo(() => (anos.length ? Math.max(...anos) + 1 : anoAtual + 1), [anos, anoAtual]);
  const [novoAno, setNovoAno] = useState<number>(sugestao);
  const [clonarDe, setClonarDe] = useState<string>(SEM_CLONE);

  useEffect(() => {
    if (open) {
      setNovoAno(sugestao);
      setClonarDe(anos.includes(2026) ? "2026" : SEM_CLONE);
    }
  }, [open, sugestao, anos]);

  async function handleCriar() {
    try {
      await criarAno.mutateAsync({
        ano: novoAno,
        clonarDeAno: clonarDe === SEM_CLONE ? null : Number(clonarDe),
      });
      toast({ title: "Ano criado", description: `Orçamento ${novoAno} disponível.` });
      setOpen(false);
      onCriado(novoAno);
    } catch (e: unknown) {
      toast({ title: "Não foi possível criar", description: String((e as Error)?.message ?? e), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <CalendarPlus className="mr-1 h-4 w-4" /> Novo ano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir novo ano de orçamento</DialogTitle>
          <DialogDescription>
            Crie o orçamento de um novo ano, em branco ou duplicando a estrutura de despesas de um
            ano existente (apenas os textos são copiados; todos os valores em R$ começam zerados).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="novo-ano-orc">Ano</Label>
            <Input
              id="novo-ano-orc"
              type="number"
              min={2024}
              max={2100}
              value={String(novoAno)}
              onChange={(e) => setNovoAno(Number(e.target.value) || sugestao)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estrutura inicial</Label>
            <Select value={clonarDe} onValueChange={setClonarDe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_CLONE}>Começar em branco</SelectItem>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>Duplicar estrutura de {a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCriar} disabled={criarAno.isPending}>
            {criarAno.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Criar ano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
