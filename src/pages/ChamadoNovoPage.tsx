import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Info } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FioAcento } from "@/components/admin/FioAcento";
import { SecaoFormulario as Section } from "@/components/admin/SecaoFormulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUnidades } from "@/data/unidades";
import { useContratos } from "@/data/contratos";
import { useServidores } from "@/data/servidores";
import {
  CATEGORIAS, PRIORIDADES, SERVICOS, addChamado, calcPrazo,
  contratosDaUnidade, empresaCurta,
} from "@/data/chamados";
import { fmtData } from "@/components/chamados/formatacao";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  numero: z.string().trim().max(40).optional().or(z.literal("")),
  unidade_id: z.string().min(1, "Selecione a unidade predial"),
  contrato_id: z.string().min(1, "Selecione o contrato"),
  solicitante_id: z.string().min(1, "Selecione o solicitante"),
  servico: z.string().min(1, "Selecione o serviço"),
  categoria: z.string().min(1, "Selecione a categoria"),
  assunto: z.string().trim().min(3, "Descreva o assunto (mín. 3 caracteres)").max(200),
  descricao: z.string().trim().min(10, "Detalhe a solicitação (mín. 10 caracteres)").max(4000),
  prioridade: z.enum(PRIORIDADES),
  responsavel_nome: z.string().trim().max(160).optional().or(z.literal("")),
  tags: z.string().trim().max(200).optional().or(z.literal("")),
  cc: z.string().trim().max(400).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Lista separada por vírgula -> array, sem entradas vazias. */
const separarLista = (v: string | undefined) =>
  (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export default function ChamadoNovoPage() {
  const navigate = useNavigate();
  const { user, isOperador, unidadeId, podeEditar } = useAuth();
  const [salvando, setSalvando] = useState(false);

  const todasUnidades = useUnidades();
  const contratos = useContratos();
  const servidores = useServidores();

  const unidades = isOperador && unidadeId
    ? todasUnidades.filter((u) => u.id === unidadeId)
    : todasUnidades;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero: "",
      // Operador só abre chamado na própria unidade: já vem preenchida.
      unidade_id: isOperador && unidadeId ? unidadeId : "",
      contrato_id: "", solicitante_id: "", servico: "", categoria: "",
      assunto: "", descricao: "", prioridade: "Média",
      responsavel_nome: "", tags: "", cc: "",
    },
  });

  const unidadeEscolhida = form.watch("unidade_id");
  const contratoEscolhido = form.watch("contrato_id");

  // O contrato depende da unidade: trocar de unidade invalida a escolha.
  const contratosDisponiveis = useMemo(
    () => contratosDaUnidade(contratos, unidadeEscolhida),
    [contratos, unidadeEscolhida],
  );

  useEffect(() => {
    if (contratoEscolhido && !contratosDisponiveis.some((c) => c.id === contratoEscolhido)) {
      form.setValue("contrato_id", "");
    }
  }, [contratosDisponiveis, contratoEscolhido, form]);

  const contrato = contratosDisponiveis.find((c) => c.id === contratoEscolhido) ?? null;

  // Solicitante é servidor lotado na unidade escolhida.
  const solicitantes = useMemo(
    () => servidores.filter((s) => s.unidade_id === unidadeEscolhida),
    [servidores, unidadeEscolhida],
  );

  const prazoPrevisto = contrato ? calcPrazo(new Date().toISOString(), contrato.sla_dias) : "";

  useEffect(() => { document.title = "Novo chamado | COSEPH TJRO"; }, []);

  if (!podeEditar("chamados", unidadeId)) {
    return (
      <div>
        <PageHeader eyebrow="Operação" title="Novo chamado" />
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <FioAcento />
          <CardContent className="p-6 text-[13px] text-muted-foreground">
            Seu perfil não tem permissão para abrir chamados.
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (d: FormData) => {
    setSalvando(true);
    try {
      const solicitante = servidores.find((s) => s.id === d.solicitante_id);
      const criado = await addChamado(
        {
          numero: d.numero,
          unidade_id: d.unidade_id,
          contrato_id: d.contrato_id,
          solicitante_id: d.solicitante_id,
          solicitante_nome: solicitante?.nome ?? "",
          responsavel_nome: d.responsavel_nome ?? "",
          servico: d.servico,
          categoria: d.categoria,
          assunto: d.assunto,
          descricao: d.descricao,
          prioridade: d.prioridade,
          prazo: prazoPrevisto,
          tags: separarLista(d.tags),
          cc: separarLista(d.cc),
        },
        { id: user?.id ?? null, nome: solicitante?.nome || user?.email || "Sistema" },
      );
      toast({ title: `Chamado ${criado.numero} aberto` });
      navigate(`/chamados/${criado.id}`);
    } catch (e) {
      toast({ title: "Erro ao abrir chamado", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  };

  const erros = form.formState.errors;

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Novo chamado"
        description="O chamado nasce vinculado a uma unidade predial e a um contrato — escolha a unidade primeiro para ver os contratos aplicáveis."
        actions={
          <Button variant="outline" onClick={() => navigate("/chamados")}>
            <ArrowLeft className="mr-1 h-4 w-4" />Voltar
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl space-y-4">
        <Section title="Vínculo obrigatório">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unidade predial *" error={erros.unidade_id?.message}>
              <Select
                value={form.watch("unidade_id")}
                onValueChange={(v) => form.setValue("unidade_id", v, { shouldValidate: true })}
                disabled={isOperador && Boolean(unidadeId)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Contrato *" error={erros.contrato_id?.message}>
              <Select
                value={form.watch("contrato_id")}
                onValueChange={(v) => form.setValue("contrato_id", v, { shouldValidate: true })}
                disabled={!unidadeEscolhida}
              >
                <SelectTrigger>
                  <SelectValue placeholder={unidadeEscolhida ? "Selecione o contrato" : "Escolha a unidade primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {contratosDisponiveis.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero} — {empresaCurta(c.empresa)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unidadeEscolhida && contratosDisponiveis.length === 0 && (
                <p className="text-xs text-destructive">
                  Nenhum contrato atende esta unidade. Cadastre o vínculo em Contratos.
                </p>
              )}
            </Field>
          </div>

          {contrato && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-border bg-card px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Info className="h-3.5 w-3.5" />Dados carregados do contrato
              </span>
              <span><span className="text-muted-foreground">Empresa:</span> {contrato.empresa}</span>
              {contrato.fiscal && <span><span className="text-muted-foreground">Fiscal:</span> {contrato.fiscal}</span>}
              <span>
                <span className="text-muted-foreground">Prazo de atendimento:</span>{" "}
                {contrato.sla_dias
                  ? `${contrato.sla_dias} dia(s) — vence em ${fmtData(prazoPrevisto)}`
                  : "não definido no contrato"}
              </span>
            </div>
          )}
        </Section>

        <Section title="Solicitação">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Solicitante *" error={erros.solicitante_id?.message}>
              <Select
                value={form.watch("solicitante_id")}
                onValueChange={(v) => form.setValue("solicitante_id", v, { shouldValidate: true })}
                disabled={!unidadeEscolhida}
              >
                <SelectTrigger>
                  <SelectValue placeholder={unidadeEscolhida ? "Selecione o servidor" : "Escolha a unidade primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {solicitantes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome} — {s.matricula}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unidadeEscolhida && solicitantes.length === 0 && (
                <p className="text-xs text-destructive">
                  Nenhum servidor lotado nesta unidade.
                </p>
              )}
            </Field>

            <Field label="Prioridade">
              <Select
                value={form.watch("prioridade")}
                onValueChange={(v) => form.setValue("prioridade", v as FormData["prioridade"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Serviço *" error={erros.servico?.message}>
              <Select
                value={form.watch("servico")}
                onValueChange={(v) => form.setValue("servico", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                <SelectContent>
                  {SERVICOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Categoria *" error={erros.categoria?.message}>
              <Select
                value={form.watch("categoria")}
                onValueChange={(v) => form.setValue("categoria", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Assunto *" error={erros.assunto?.message}>
            <Input {...form.register("assunto")} placeholder="Ex.: Porta da subestação não trava" />
          </Field>

          <Field label="Descrição / mensagem *" error={erros.descricao?.message}>
            <Textarea
              {...form.register("descricao")} rows={6}
              placeholder="Descreva a ocorrência com o detalhe que o prestador precisa para atender."
            />
          </Field>
        </Section>

        <Section title="Complementos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Responsável / prestador" error={erros.responsavel_nome?.message}>
              <Input {...form.register("responsavel_nome")} placeholder="Preenchido no encaminhamento, se ainda não definido" />
            </Field>
            <Field label="Número do chamado" error={erros.numero?.message}>
              <Input {...form.register("numero")} placeholder="Em branco: gerado pelo sistema" />
            </Field>
            <Field label="Tags" error={erros.tags?.message}>
              <Input {...form.register("tags")} placeholder="Separadas por vírgula" />
            </Field>
            <Field label="CC" error={erros.cc?.message}>
              <Input {...form.register("cc")} placeholder="E-mails separados por vírgula" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/chamados")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Abrindo..." : "Abrir chamado"}
          </Button>
        </div>
      </form>
    </div>
  );
}
