import React, { useMemo } from "react";
import {
  Building2, Cpu, Users, UserCog, AlertTriangle, ShieldCheck,
  DoorOpen, MapPin, Phone, ScanLine, RadioTower,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { usePortoesMock } from "@/data/portoesMock";
import { useComarcas } from "@/data/api";
import type { ComarcaMetric } from "@/hooks/useComarcaMetrics";
import type { Criticidade } from "@/data/mockDashboard";

const nivelTone: Record<Criticidade, string> = {
  adequado:  "bg-adequate/10 text-adequate border-adequate/30",
  parcial:   "bg-partial/15 text-partial border-partial/30",
  critico:   "bg-critical/10 text-critical border-critical/30",
  sem_dados: "bg-muted text-muted-foreground border-border",
};

const nivelLabel: Record<Criticidade, string> = {
  adequado:  "Segurança adequada",
  parcial:   "Segurança parcial",
  critico:   "Situação crítica",
  sem_dados: "Sem dados",
};

interface Props {
  comarca: ComarcaMetric | null;
  onOpenChange: (open: boolean) => void;
}

export function ComarcaDetailDrawer({ comarca, onOpenChange }: Props) {
  const { data: comarcasDB = [] } = useComarcas();
  const unidades      = useUnidadesMock();
  const equipamentos  = useEquipamentosMock();
  const servidores    = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const portoes       = usePortoesMock();

  const dados = useMemo(() => {
    if (!comarca) return null;

    const comarcaDB = comarcasDB.find((c) => c.nome === comarca.nome);

    const unidadesComarca = unidades.filter((u) => u.comarca === comarca.nome);
    const unidadeIds = new Set(unidadesComarca.map((u) => u.id));

    const equipComarca = equipamentos.filter((e) => unidadeIds.has(e.unidade_id));
    const portoesComarca = portoes.filter((p) => unidadeIds.has(p.unidade_id));
    const servidoresComarca = servidores.filter((s) => s.comarca === comarca.nome && s.situacao === "Ativo");
    const terceirizadosComarca = terceirizados.filter((t) => t.comarca === comarca.nome && t.situacao === "Ativo");

    // Equipamentos por tipo
    const equipPorTipo = equipComarca.reduce<Record<string, number>>((acc, e) => {
      acc[e.tipo] = (acc[e.tipo] ?? 0) + 1;
      return acc;
    }, {});

    // Pendências
    const equipInoperantes = equipComarca.filter((e) => e.status === "Inoperante" || e.status === "Em manutenção");
    const unidadesCriticas = unidadesComarca.filter((u) => u.criticidade === "Alto" || u.criticidade === "Crítico");
    const semDerso = unidadesComarca.filter((u) => !u.possui_derso);
    const portoesUrgentes = portoesComarca.filter((p) => p.necessidade_manutencao === "Alta" || p.necessidade_manutencao === "Urgente");

    return {
      comarcaDB,
      unidadesComarca,
      equipComarca,
      equipPorTipo,
      portoesComarca,
      servidoresComarca,
      terceirizadosComarca,
      equipInoperantes,
      unidadesCriticas,
      semDerso,
      portoesUrgentes,
      temScanner: (equipPorTipo["Scanner Raio-X"] ?? 0) > 0,
      temDetector: (equipPorTipo["Detector de metais"] ?? 0) > 0,
    };
  }, [comarca, comarcasDB, unidades, equipamentos, servidores, terceirizados, portoes]);

  if (!comarca || !dados) {
    return <Sheet open={false} onOpenChange={onOpenChange}><SheetContent /></Sheet>;
  }

  const totalPendencias =
    dados.equipInoperantes.length +
    dados.unidadesCriticas.length +
    dados.semDerso.length +
    dados.portoesUrgentes.length;

  return (
    <Sheet open={!!comarca} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>Comarca de {comarca.nome}</SheetTitle>
              <SheetDescription className="mt-1 space-y-0.5">
                {dados.comarcaDB?.endereco && (
                  <span className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {dados.comarcaDB.endereco}
                  </span>
                )}
                {dados.comarcaDB?.telefone && (
                  <span className="flex items-center gap-1 text-xs">
                    <Phone className="h-3 w-3 shrink-0" />
                    {dados.comarcaDB.telefone}
                  </span>
                )}
              </SheetDescription>
            </div>
            <Badge variant="outline" className={`shrink-0 ${nivelTone[comarca.nivel]}`}>
              <ShieldCheck className="mr-1 h-3 w-3" />
              {nivelLabel[comarca.nivel]}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-110px)]">
          <div className="space-y-6 p-6">

            {/* KPIs principais */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Building2} label="Unidades"      value={dados.unidadesComarca.length} />
              <Kpi icon={Users}     label="Servidores"    value={dados.servidoresComarca.length} />
              <Kpi icon={UserCog}   label="Terceirizados" value={dados.terceirizadosComarca.length} />
              <Kpi icon={DoorOpen}  label="Portões"       value={dados.portoesComarca.length} />
            </div>

            {/* Equipamentos em destaque */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Cpu}       label="Câmeras"       value={dados.equipPorTipo["Câmera"] ?? 0} />
              <Kpi icon={Cpu}       label="Catracas"      value={dados.equipPorTipo["Catraca"] ?? 0} />
              <Kpi icon={Cpu}       label="P. Giratórias" value={dados.equipPorTipo["Porta giratória"] ?? 0} />
              <Kpi icon={Cpu}       label="Detectores"    value={dados.equipPorTipo["Detector de metais"] ?? 0} />
            </div>

            {/* Recursos especiais */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={dados.temScanner ? "border-adequate/40 bg-adequate/10 text-adequate" : "bg-muted text-muted-foreground"}>
                <ScanLine className="mr-1 h-3 w-3" />
                Scanner Raio-X: {dados.temScanner ? "Sim" : "Não"}
              </Badge>
              <Badge variant="outline" className={dados.temDetector ? "border-adequate/40 bg-adequate/10 text-adequate" : "bg-muted text-muted-foreground"}>
                <RadioTower className="mr-1 h-3 w-3" />
                Detector de metais: {dados.temDetector ? "Sim" : "Não"}
              </Badge>
              <Badge variant="outline" className={comarca.possuiDerso ? "border-adequate/40 bg-adequate/10 text-adequate" : "bg-muted text-muted-foreground"}>
                <ShieldCheck className="mr-1 h-3 w-3" />
                DERSO: {comarca.possuiDerso ? "Sim" : "Não"}
              </Badge>
            </div>

            {/* Pendências */}
            {totalPendencias > 0 && (
              <Section title="Pendências operacionais" icon={AlertTriangle}>
                <ul className="space-y-2 text-sm">
                  {dados.equipInoperantes.length > 0 && (
                    <PendItem tone="critical" label={`${dados.equipInoperantes.length} equipamento(s) inoperante(s) ou em manutenção`} />
                  )}
                  {dados.unidadesCriticas.length > 0 && (
                    <PendItem tone="partial" label={`${dados.unidadesCriticas.length} unidade(s) com criticidade Alta/Crítica`} />
                  )}
                  {dados.semDerso.length > 0 && (
                    <PendItem tone="partial" label={`${dados.semDerso.length} unidade(s) sem DERSO`} />
                  )}
                  {dados.portoesUrgentes.length > 0 && (
                    <PendItem tone="partial" label={`${dados.portoesUrgentes.length} portão(ões) com manutenção urgente`} />
                  )}
                </ul>
              </Section>
            )}

            <Separator />

            {/* Unidades prediais */}
            <Section title="Unidades prediais" icon={Building2}>
              {dados.unidadesComarca.length === 0 ? (
                <Empty text="Nenhuma unidade cadastrada nesta comarca." />
              ) : (
                <ul className="space-y-2">
                  {dados.unidadesComarca.map((u) => (
                    <li key={u.id} className="rounded-md border border-border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{u.nome}</p>
                          <p className="text-xs text-muted-foreground">{u.tipo} • {u.endereco}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {u.possui_derso && <Badge variant="outline" className="text-[10px] border-adequate/40 text-adequate">DERSO</Badge>}
                            {u.controle_acesso && <Badge variant="outline" className="text-[10px]">Controle acesso</Badge>}
                            {u.vigilancia_eletronica && <Badge variant="outline" className="text-[10px]">CFTV</Badge>}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">{u.criticidade}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Todos equipamentos por tipo */}
            {dados.equipComarca.length > 0 && (
              <Section title={`Equipamentos (${dados.equipComarca.length} total)`} icon={Cpu}>
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(dados.equipPorTipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, qtd]) => (
                      <li key={tipo} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
                        <span>{tipo}</span>
                        <span className="font-semibold">{qtd}</span>
                      </li>
                    ))}
                </ul>
              </Section>
            )}

            {/* Servidores */}
            <Section title={`Servidores ativos (${dados.servidoresComarca.length})`} icon={Users}>
              {dados.servidoresComarca.length === 0 ? (
                <Empty text="Nenhum servidor ativo cadastrado." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {dados.servidoresComarca.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="font-medium">{s.nome}</p>
                        <p className="text-xs text-muted-foreground">{s.cargo} • Mat. {s.matricula}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{s.faixa_etaria}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Terceirizados */}
            <Section title={`Terceirizados ativos (${dados.terceirizadosComarca.length})`} icon={UserCog}>
              {dados.terceirizadosComarca.length === 0 ? (
                <Empty text="Nenhum terceirizado ativo vinculado." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {dados.terceirizadosComarca.map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">{t.empresa} • {t.funcao}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{t.turno}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />{title}
      </div>
      {children}
    </div>
  );
}

function PendItem({ tone, label }: { tone: "critical" | "partial"; label: string }) {
  const cls = tone === "critical"
    ? "bg-critical/10 text-critical border-critical/30"
    : "bg-partial/15 text-partial border-partial/30";
  return <li className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{label}</li>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
