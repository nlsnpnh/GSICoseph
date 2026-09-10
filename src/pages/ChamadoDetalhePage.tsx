import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RotateCcw, Send } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { AnexosSection } from "@/components/chamados/AnexosSection";
import { LinhaDoTempo } from "@/components/chamados/LinhaDoTempo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FioAcento } from "@/components/admin/FioAcento";
import { TYPO } from "@/lib/design-tokens";
import { formatarDataHora } from "@/lib/dates";
import { useAuth } from "@/contexts/AuthContext";
import { useUnidades } from "@/data/unidades";
import { useContratos } from "@/data/contratos";
import { useChamadoEventos } from "@/data/chamadoEventos";
import {
  TRANSICOES, calcVencimento, comentarChamado, empresaCurta, encerrarChamado,
  mudarStatus, reabrirChamado, updateChamado, useChamado, type StatusChamado,
} from "@/data/chamados";
import { fmtData, statusTone, prioridadeTone, vencimentoTone } from "@/components/chamados/formatacao";
import { toast } from "@/hooks/use-toast";

const STATUS_FINAIS: StatusChamado[] = ["Resolvido", "Fechado", "Cancelado"];

/** Uma linha rótulo/valor da barra lateral. */
function Info({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <p className={`${TYPO.eyebrow} text-muted-foreground`}>{rotulo}</p>
      <div className={TYPO.cell}>{children}</div>
    </div>
  );
}

export default function ChamadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, unidadeId, podeEditar, podeExcluir } = useAuth();

  const { chamado, carregando } = useChamado(id);
  const eventos = useChamadoEventos(id);
  const unidades = useUnidades();
  const contratos = useContratos();

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [responsavel, setResponsavel] = useState("");
  const [encerramento, setEncerramento] = useState<StatusChamado | null>(null);
  const [solucao, setSolucao] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [reabrindo, setReabrindo] = useState(false);

  const unidade = unidades.find((u) => u.id === chamado?.unidade_id);
  const contrato = contratos.find((c) => c.id === chamado?.contrato_id);

  const podeMovimentar = podeEditar("chamados", chamado?.unidade_id ?? unidadeId);
  const autor = useMemo(
    () => ({ id: user?.id ?? null, nome: user?.email ?? "Sistema" }),
    [user],
  );

  useEffect(() => {
    document.title = chamado ? `Chamado ${chamado.numero} | COSEPH TJRO` : "Chamado | COSEPH TJRO";
  }, [chamado]);

  useEffect(() => {
    if (chamado) setResponsavel(chamado.responsavel_nome);
  }, [chamado]);

  if (carregando) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando chamado...</p>;
  }
  if (!chamado) {
    return (
      <div>
        <PageHeader eyebrow="Operação" title="Chamado não encontrado" />
        <Button variant="outline" onClick={() => navigate("/chamados")}>
          <ArrowLeft className="mr-1 h-4 w-4" />Voltar para a central
        </Button>
      </div>
    );
  }

  const vencimento = calcVencimento(chamado);
  const proximosStatus = TRANSICOES[chamado.status];
  // Encerramento tem tela própria (pede solução); os demais são um clique.
  const transicoesSimples = proximosStatus.filter((s) => !STATUS_FINAIS.includes(s));
  const transicoesFinais = proximosStatus.filter((s) => STATUS_FINAIS.includes(s));
  const encerrado = chamado.status === "Fechado" || chamado.status === "Cancelado";

  const enviarMensagem = async () => {
    if (!mensagem.trim()) return;
    setEnviando(true);
    try {
      await comentarChamado(chamado.id, mensagem.trim(), autor);
      setMensagem("");
      toast({ title: "Mensagem registrada" });
    } catch (e) {
      toast({ title: "Erro ao registrar", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const aplicarStatus = async (novo: StatusChamado) => {
    try {
      await mudarStatus(chamado, novo, mensagem.trim(), autor);
      setMensagem("");
      toast({ title: `Status alterado para "${novo}"` });
    } catch (e) {
      toast({ title: "Erro ao alterar status", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const confirmarEncerramento = async () => {
    if (!encerramento) return;
    try {
      await encerrarChamado(
        chamado,
        { status: encerramento as "Resolvido" | "Fechado" | "Cancelado", solucao, justificativa },
        autor,
      );
      setEncerramento(null);
      setSolucao("");
      setJustificativa("");
      toast({ title: `Chamado ${encerramento.toLowerCase()}` });
    } catch (e) {
      toast({ title: "Erro ao encerrar", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const confirmarReabertura = async () => {
    try {
      await reabrirChamado(chamado, justificativa, autor);
      setReabrindo(false);
      setJustificativa("");
      toast({ title: "Chamado reaberto" });
    } catch (e) {
      toast({ title: "Erro ao reabrir", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const salvarResponsavel = async () => {
    try {
      await updateChamado(chamado.id, { responsavel_nome: responsavel });
      toast({ title: "Responsável atualizado" });
    } catch (e) {
      toast({ title: "Erro ao salvar", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`Chamado ${chamado.numero}`}
        title={chamado.assunto}
        description={`${unidade?.nome ?? "—"} · ${chamado.servico} · ${chamado.categoria}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/chamados")}>
            <ArrowLeft className="mr-1 h-4 w-4" />Voltar
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* ── Barra lateral: a ficha do chamado ── */}
        <aside className="space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
            <CardContent className="space-y-2.5 p-4">
              <Info rotulo="Número"><span className="font-medium tabular-nums">{chamado.numero}</span></Info>
              <Info rotulo="Status">
                <Badge variant="outline" className={statusTone[chamado.status]}>{chamado.status}</Badge>
              </Info>
              <Info rotulo="Unidade predial">{unidade?.nome ?? "—"}</Info>
              <Info rotulo="Contrato">
                {contrato ? (
                  <>
                    <span className="block">{contrato.numero}</span>
                    <span className="block text-muted-foreground">{empresaCurta(contrato.empresa)}</span>
                  </>
                ) : "—"}
              </Info>
              <Info rotulo="Solicitante">{chamado.solicitante_nome || "—"}</Info>
              <Info rotulo="Responsável">
                {podeMovimentar && !encerrado ? (
                  <div className="flex gap-1">
                    <Input
                      value={responsavel} onChange={(e) => setResponsavel(e.target.value)}
                      onBlur={salvarResponsavel} className="h-7 text-xs"
                      placeholder="Não definido"
                    />
                  </div>
                ) : (chamado.responsavel_nome || "—")}
              </Info>
              <Info rotulo="Serviço">{chamado.servico}</Info>
              <Info rotulo="Categoria">{chamado.categoria}</Info>
              <Info rotulo="Prioridade">
                <Badge variant="outline" className={prioridadeTone[chamado.prioridade]}>
                  {chamado.prioridade}
                </Badge>
              </Info>
              <Info rotulo="Vencimento">
                {chamado.prazo ? (
                  <span className="flex items-center gap-1.5">
                    <span className="tabular-nums">{fmtData(chamado.prazo)}</span>
                    <Badge variant="outline" className={`${vencimentoTone[vencimento.tone]} text-[10px]`}>
                      {vencimento.rotulo}
                    </Badge>
                  </span>
                ) : "Sem prazo definido no contrato"}
              </Info>
              <Info rotulo="Aberto em">
                <span className="tabular-nums">{formatarDataHora(chamado.aberto_em)}</span>
              </Info>
              {chamado.resolvido_em && (
                <Info rotulo="Resolvido em">
                  <span className="tabular-nums">{formatarDataHora(chamado.resolvido_em)}</span>
                </Info>
              )}
              {chamado.fechado_em && (
                <Info rotulo="Fechado em">
                  <span className="tabular-nums">{formatarDataHora(chamado.fechado_em)}</span>
                </Info>
              )}
              <Info rotulo="Tags">
                {chamado.tags.length ? (
                  <span className="flex flex-wrap gap-1">
                    {chamado.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </span>
                ) : "—"}
              </Info>
              <Info rotulo="CC">{chamado.cc.length ? chamado.cc.join(", ") : "—"}</Info>
            </CardContent>
          </Card>
        </aside>

        {/* ── Corpo: solicitação, ações e histórico ── */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
            <CardHeader className="border-b border-border bg-muted/30 px-3 py-2"><CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">Solicitação</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{chamado.descricao}</p>
            </CardContent>
          </Card>

          {chamado.solucao && (
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <FioAcento />
              <CardHeader className="border-b border-border bg-muted/30 px-3 py-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">Serviço executado / solução adotada</CardTitle>
                </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{chamado.solucao}</p>
              </CardContent>
            </Card>
          )}

          {podeMovimentar && (
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <FioAcento />
              <CardHeader className="border-b border-border bg-muted/30 px-3 py-2">
                <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">Nova mensagem / atualização</CardTitle>
                </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4}
                  placeholder="Registre o que foi feito, o encaminhamento ou o retorno do prestador."
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={enviarMensagem} disabled={enviando || !mensagem.trim()}>
                    <Send className="mr-1 h-3.5 w-3.5" />Enviar mensagem
                  </Button>

                  {transicoesSimples.map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => aplicarStatus(s)}>
                      {s}
                    </Button>
                  ))}

                  {transicoesFinais.map((s) => (
                    <Button
                      key={s} size="sm"
                      variant={s === "Cancelado" ? "outline" : "default"}
                      onClick={() => { setEncerramento(s); setSolucao(""); setJustificativa(""); }}
                    >
                      {s}
                    </Button>
                  ))}

                  {encerrado && (
                    <Button size="sm" variant="outline" onClick={() => setReabrindo(true)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />Reabrir
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  A mensagem digitada acima acompanha a mudança de status, se houver.
                </p>
              </CardContent>
            </Card>
          )}

          <AnexosSection chamadoId={chamado.id} podeRemover={podeExcluir("chamados", chamado.unidade_id)} />

          <Card className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
            <CardHeader className="border-b border-border bg-muted/30 px-3 py-2"><CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">Linha do tempo</CardTitle></CardHeader>
            <CardContent><LinhaDoTempo eventos={eventos} /></CardContent>
          </Card>
        </div>
      </div>

      {/* ── Encerramento ── */}
      <Dialog open={encerramento !== null} onOpenChange={(o) => !o && setEncerramento(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Encerrar chamado como "{encerramento}"</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Serviço executado / solução adotada *</Label>
              <Textarea
                value={solucao} onChange={(e) => setSolucao(e.target.value)} rows={5}
                placeholder="O que foi feito para resolver a solicitação."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Justificativa (opcional)</Label>
              <Textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">
              A data e a hora da conclusão são registradas automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncerramento(null)}>Cancelar</Button>
            <Button onClick={confirmarEncerramento} disabled={!solucao.trim()}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reabertura ── */}
      <Dialog open={reabrindo} onOpenChange={setReabrindo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reabrir chamado {chamado.numero}</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Justificativa da reabertura *</Label>
            <Textarea
              value={justificativa} onChange={(e) => setJustificativa(e.target.value)} rows={4}
              placeholder="Por que o chamado precisa voltar para atendimento."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReabrindo(false)}>Cancelar</Button>
            <Button onClick={confirmarReabertura} disabled={!justificativa.trim()}>Reabrir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
