import React, { useMemo } from "react";
import {
  Building2, Cpu, Users, UserCog, AlertTriangle, ShieldCheck,
  DoorOpen, MapPin, ScanLine, RadioTower,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useUnidadeEquipamentos } from "@/data/equipamentos";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { usePortoesMock } from "@/data/portoesMock";
import type { MapaComarcaResumo } from "@/data/mapa";
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
  comarca: MapaComarcaResumo | null;
  onOpenChange: (open: boolean) => void;
}

export function ComarcaDetailDrawer({ comarca, onOpenChange }: Props) {
  const unidades      = useUnidadesMock();
  const distribuicao  = useUnidadeEquipamentos();
  const servidores    = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const portoes       = usePortoesMock();

  const dados = useMemo(() => {
    if (!comarca) return null;

    const unidadesComarca = unidades.filter((u) => u.comarca_id === comarca.comarcaId);
    const unidadeIds = new Set(unidadesComarca.map((u) => u.id));

    const distComarca = distribuicao.filter((d) => unidadeIds.has(d.unidade_id));
    const portoesComarca = portoes.filter((p) => unidadeIds.has(p.unidade_id));
    const servidoresComarca = servidores.filter((s) => s.situacao === "Ativo" && s.unidade_id != null && unidadeIds.has(s.unidade_id));
    const terceirizadosComarca = terceirizados.filter((t) => t.situacao === "Ativo" && t.unidade_id != null && unidadeIds.has(t.unidade_id));

    // Agrupa por item do catálogo (descrição) — soma quantidades
    const equipPorItem = distComarca.reduce<Record<string, number>>((acc, d) => {
      acc[d.descricao] = (acc[d.descricao] ?? 0) + d.quantidade;
      return acc;
    }, {});

    // Helpers de categoria por item_num (do catálogo do contrato 115/2023)
    const qtdPorItens = (...itemNums: number[]) =>
      distComarca.filter((d) => itemNums.includes(d.item_num)).reduce((s, d) => s + d.quantidade, 0);

    const totalEquip = distComarca.reduce((s, d) => s + d.quantidade, 0);
    const valorEstimado = distComarca.reduce((s, d) => s + d.quantidade * d.valor_unitario, 0);

    // Pendências
    const semDerso = unidadesComarca.filter((u) => !u.possui_derso);
    const portoesUrgentes = portoesComarca.filter((p) => p.necessidade_manutencao === "Alta" || p.necessidade_manutencao === "Urgente");

    return {
      unidadesComarca,
      distComarca,
      equipPorItem,
      totalEquip,
      valorEstimado,
      cameras: qtdPorItens(1, 2, 3, 4),
      controleAcesso: qtdPorItens(21, 22, 23),
      gravadores: qtdPorItens(31, 32, 33, 34),
      botoesEmergencia: qtdPorItens(20),
      portoesComarca,
      servidoresComarca,
      terceirizadosComarca,
      semDerso,
      portoesUrgentes,
    };
  }, [comarca, unidades, distribuicao, servidores, terceirizados, portoes]);

  if (!comarca || !dados) {
    return <Sheet open={false} onOpenChange={onOpenChange}><SheetContent /></Sheet>;
  }

  const totalPendencias =
    dados.semDerso.length +
    dados.portoesUrgentes.length;

  const fmtMoney = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <Sheet open={!!comarca} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>Comarca de {comarca.nome}</SheetTitle>
              <SheetDescription className="mt-1">
                <span className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {dados.unidadesComarca.length} unidade(s) cadastrada(s)
                </span>
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

            {/* Equipamentos em destaque (contrato 115/2023) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Cpu} label="Câmeras"        value={dados.cameras} />
              <Kpi icon={Cpu} label="Controle acesso" value={dados.controleAcesso} />
              <Kpi icon={Cpu} label="Gravadores IP"   value={dados.gravadores} />
              <Kpi icon={Cpu} label="Botões emerg."   value={dados.botoesEmergencia} />
            </div>

            {/* Recursos especiais */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={comarca.possuiDerso ? "border-adequate/40 bg-adequate/10 text-adequate" : "bg-muted text-muted-foreground"}>
                <ShieldCheck className="mr-1 h-3 w-3" />
                DERSO: {comarca.possuiDerso ? "Sim" : "Não"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <RadioTower className="mr-1 h-3 w-3" />
                {dados.totalEquip} equip. ({dados.distComarca.length} itens)
              </Badge>
              <Badge variant="outline" className="text-xs">
                <ScanLine className="mr-1 h-3 w-3" />
                Valor: {fmtMoney(dados.valorEstimado)}/mês
              </Badge>
            </div>

            {/* Pendências */}
            {totalPendencias > 0 && (
              <Section title="Pendências operacionais" icon={AlertTriangle}>
                <ul className="space-y-2 text-sm">
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
                          <p className="text-xs text-muted-foreground">{u.endereco}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {u.possui_derso && <Badge variant="outline" className="text-[10px] border-adequate/40 text-adequate">DERSO</Badge>}
                            {u.controle_acesso && <Badge variant="outline" className="text-[10px]">Controle acesso</Badge>}
                            {u.vigilancia_eletronica && <Badge variant="outline" className="text-[10px]">CFTV</Badge>}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Equipamentos do contrato 115/2023 por item */}
            {dados.distComarca.length > 0 && (
              <Section title={`Equipamentos (${dados.totalEquip} total • ${dados.distComarca.length} itens distintos)`} icon={Cpu}>
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(dados.equipPorItem)
                    .sort((a, b) => b[1] - a[1])
                    .map(([descricao, qtd]) => (
                      <li key={descricao} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
                        <span className="truncate pr-2">{descricao}</span>
                        <span className="shrink-0 font-semibold">{qtd}</span>
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
