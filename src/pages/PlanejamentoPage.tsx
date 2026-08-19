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
import { PlanejamentoPainel } from "@/components/planejamento/PlanejamentoPainel";
import { PlanejamentoSetor } from "@/components/planejamento/PlanejamentoSetor";
import { FioAcento } from "@/components/admin/FioAcento";
import {
  SETORES,
  useAnosPlanejamento,
  usePlanejamentoAcoes,
  useCriarAno,
} from "@/data/planejamento";

const SEM_CLONE = "__vazio__";

export default function PlanejamentoPage() {
  const { isAdmin } = useAuth();
  useEffect(() => { document.title = "Planejamento | SIG-COSEPH"; }, []);

  const { data: anos = [] } = useAnosPlanejamento();
  const [ano, setAno] = useState<number>(new Date().getFullYear());

  // Garante um ano válido selecionado assim que a lista de anos chega.
  useEffect(() => {
    if (anos.length > 0 && !anos.includes(ano)) {
      setAno(anos.includes(2026) ? 2026 : anos[0]);
    }
  }, [anos]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: acoes = [], isLoading } = usePlanejamentoAcoes(ano);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Planejamento" title="Planejamento" description="Plano Anual de Atividades COSEPH." />
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <FioAcento />
          <CardContent className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Apenas administradores podem acessar o módulo de Planejamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Planejamento"
        title="Planejamento"
        description="Plano Anual de Atividades COSEPH — acompanhamento de ações por setor."
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
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando planejamento...
        </div>
      ) : (
        <Tabs defaultValue="painel" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="painel">Painel Geral</TabsTrigger>
            {SETORES.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="painel">
            <PlanejamentoPainel acoes={acoes} />
          </TabsContent>

          {SETORES.map((s) => (
            <TabsContent key={s.key} value={s.key}>
              <div className="mb-3 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-foreground">Objetivo — {s.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.objetivo}</p>
              </div>
              <PlanejamentoSetor
                ano={ano}
                setor={s.key}
                acoes={acoes.filter((a) => a.setor === s.key)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function NovoAnoDialog({
  anos, anoAtual, onCriado,
}: { anos: number[]; anoAtual: number; onCriado: (ano: number) => void }) {
  const criarAno = useCriarAno();
  const [open, setOpen] = useState(false);
  const sugestao = useMemo(() => (anos.length ? Math.max(...anos) + 1 : anoAtual + 1), [anos, anoAtual]);
  const [novoAno, setNovoAno] = useState<number>(sugestao);
  const [clonarDe, setClonarDe] = useState<string>(SEM_CLONE);

  useEffect(() => { if (open) { setNovoAno(sugestao); setClonarDe(anos.includes(2026) ? "2026" : SEM_CLONE); } }, [open, sugestao, anos]);

  async function handleCriar() {
    try {
      await criarAno.mutateAsync({
        ano: novoAno,
        clonarDeAno: clonarDe === SEM_CLONE ? null : Number(clonarDe),
      });
      toast({ title: "Ano criado", description: `Planejamento ${novoAno} disponível.` });
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
          <DialogTitle>Abrir novo ano de planejamento</DialogTitle>
          <DialogDescription>
            Crie o planejamento de um novo ano, em branco ou duplicando a estrutura de ações de um
            ano existente (status e percentuais são zerados).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="novo-ano">Ano</Label>
            <Input
              id="novo-ano"
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
