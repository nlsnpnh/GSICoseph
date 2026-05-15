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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUnidadesMock, type UnidadePredial } from "@/data/unidadesMock";
import { useUnidadeEquipamentos, type UnidadeEquipamento } from "@/data/equipamentos";
import { useServidoresMock, type ServidorSeg } from "@/data/servidoresMock";
import { useTerceirizadosMock, type Terceirizado } from "@/data/terceirizadosMock";
import { usePortoesMock } from "@/data/portoesMock";
import type { MapaComarcaResumo } from "@/data/mapa";
import type { Criticidade } from "@/data/mockDashboard";
import { useAuth } from "@/contexts/AuthContext";

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

// Categorias do contrato 115/2023 (mutuamente exclusivas), usadas para
// agrupar equipamentos da unidade em "Câmeras", "Controle de acesso" etc.
const CATEGORIAS_EQUIP: { nome: string; itens: number[] }[] = [
  { nome: "Câmeras CFTV",         itens: [1, 2, 3, 4] },
  { nome: "Gravadores IP",        itens: [31, 32, 33, 34] },
  { nome: "Controle de acesso",   itens: [21, 22, 23, 24, 25, 27] },
  { nome: "Estações e monitores", itens: [7, 8, 9, 10, 15] },
  { nome: "Alarmes e emergência", itens: [19, 20] },
  { nome: "Comunicação",          itens: [5, 6, 13, 14, 26] },
  { nome: "Rede e infra",         itens: [11, 12, 44, 45] },
  { nome: "Servidores e storage", itens: [29, 30, 35, 39, 40, 41] },
  { nome: "Software e licenças",  itens: [28, 36, 37, 38, 42, 43] },
  { nome: "Acessórios câmera",    itens: [16, 17, 18] },
];

const fmtMoney = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface Props {
  comarca: MapaComarcaResumo | null;
  onOpenChange: (open: boolean) => void;
}

export function ComarcaDetailDrawer({ comarca, onOpenChange }: Props) {
  const { isOperador } = useAuth();
  const unidades      = useUnidadesMock();
  const distribuicao  = useUnidadeEquipamentos();
  const servidores    = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const portoes       = usePortoesMock();

  const dados = useMemo(() => {
    if (!comarca) return null;

    const unidadesComarca = unidades.filter((u) => u.comarca_id === comarca.comarcaId);
    const unidadeIds = new Set(unidadesComarca.map((u) => u.id));

    const distComarca         = distribuicao.filter((d) => unidadeIds.has(d.unidade_id));
    const portoesComarca      = portoes.filter((p) => unidadeIds.has(p.unidade_id));
    const servAtivos          = servidores.filter((s) => s.situacao === "Ativo" && s.unidade_id != null && unidadeIds.has(s.unidade_id));
    const tercAtivos          = terceirizados.filter((t) => t.situacao === "Ativo" && t.unidade_id != null && unidadeIds.has(t.unidade_id));

    const totalEquip    = distComarca.reduce((s, d) => s + d.quantidade, 0);
    const valorEstimado = distComarca.reduce((s, d) => s + d.quantidade * d.valor_unitario, 0);

    const semDerso        = unidadesComarca.filter((u) => !u.possui_derso);
    const portoesUrgentes = portoesComarca.filter((p) => p.necessidade_manutencao === "Alta" || p.necessidade_manutencao === "Urgente");

    // Pré-agrupa por unidade para ficar O(1) na render do accordion
    const porUnidade = new Map<string, {
      equip: UnidadeEquipamento[];
      serv: ServidorSeg[];
      terc: Terceirizado[];
      portoes: number;
    }>();
    for (const u of unidadesComarca) porUnidade.set(u.id, { equip: [], serv: [], terc: [], portoes: 0 });
    for (const d of distComarca)    porUnidade.get(d.unidade_id)?.equip.push(d);
    for (const s of servAtivos)     porUnidade.get(s.unidade_id!)?.serv.push(s);
    for (const t of tercAtivos)     porUnidade.get(t.unidade_id!)?.terc.push(t);
    for (const p of portoesComarca) {
      const cur = porUnidade.get(p.unidade_id);
      if (cur) cur.portoes++;
    }

    return {
      unidadesComarca,
      totalEquip,
      valorEstimado,
      itensVinculados: distComarca.length,
      servidoresTotal:    servAtivos.length,
      terceirizadosTotal: tercAtivos.length,
      portoesTotal:       portoesComarca.length,
      semDerso,
      portoesUrgentes,
      porUnidade,
    };
  }, [comarca, unidades, distribuicao, servidores, terceirizados, portoes]);

  if (!comarca || !dados) {
    return <Sheet open={false} onOpenChange={onOpenChange}><SheetContent /></Sheet>;
  }

  const totalPendencias = dados.semDerso.length + dados.portoesUrgentes.length;

  return (
    <Sheet open={!!comarca} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-x-hidden p-0 sm:max-w-[560px] lg:max-w-[640px]">
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
          <div className="space-y-6 px-5 py-6">

            {/* Resumo geral da comarca (consolidado) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Building2} label="Unidades"      value={dados.unidadesComarca.length} />
              <Kpi icon={Users}     label="Servidores"    value={dados.servidoresTotal} />
              <Kpi icon={UserCog}   label="Terceirizados" value={dados.terceirizadosTotal} />
              <Kpi icon={DoorOpen}  label="Portões"       value={dados.portoesTotal} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={comarca.possuiDerso ? "border-adequate/40 bg-adequate/10 text-adequate" : "bg-muted text-muted-foreground"}>
                <ShieldCheck className="mr-1 h-3 w-3" />
                DERSO: {comarca.possuiDerso ? "Sim" : "Não"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <RadioTower className="mr-1 h-3 w-3" />
                {dados.totalEquip} equip. ({dados.itensVinculados} itens)
              </Badge>
              {!isOperador && (
                <Badge variant="outline" className="text-xs">
                  <ScanLine className="mr-1 h-3 w-3" />
                  Valor: {fmtMoney(dados.valorEstimado)}/mês
                </Badge>
              )}
            </div>

            {/* Pendências consolidadas */}
            {totalPendencias > 0 && (
              <Section title="Pendências operacionais" icon={AlertTriangle}>
                <ul className="space-y-2 text-sm">
                  {dados.semDerso.length > 0 && (
                    <PendItem label={`${dados.semDerso.length} unidade(s) sem DERSO`} />
                  )}
                  {dados.portoesUrgentes.length > 0 && (
                    <PendItem label={`${dados.portoesUrgentes.length} portão(ões) com manutenção urgente`} />
                  )}
                </ul>
              </Section>
            )}

            <Separator />

            {/* Unidades prediais — accordion expansível com dados por unidade */}
            <Section title="Unidades prediais" icon={Building2}>
              {dados.unidadesComarca.length === 0 ? (
                <Empty text="Nenhuma unidade cadastrada nesta comarca." />
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {dados.unidadesComarca.map((u) => {
                    const det = dados.porUnidade.get(u.id);
                    return (
                      <UnidadeAccordionItem
                        key={u.id}
                        unidade={u}
                        equipamentos={det?.equip ?? []}
                        servidores={det?.serv ?? []}
                        terceirizados={det?.terc ?? []}
                        portoes={det?.portoes ?? 0}
                      />
                    );
                  })}
                </Accordion>
              )}
            </Section>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function UnidadeAccordionItem({
  unidade, equipamentos, servidores, terceirizados, portoes,
}: {
  unidade: UnidadePredial;
  equipamentos: UnidadeEquipamento[];
  servidores: ServidorSeg[];
  terceirizados: Terceirizado[];
  portoes: number;
}) {
  const totalEquip = equipamentos.reduce((s, d) => s + d.quantidade, 0);
  const semDados = totalEquip === 0 && servidores.length === 0 && terceirizados.length === 0;

  const categorias = useMemo(() => {
    return CATEGORIAS_EQUIP
      .map((cat) => {
        const itens = equipamentos
          .filter((e) => cat.itens.includes(e.item_num))
          .map((e) => ({ item_num: e.item_num, descricao: e.descricao, quantidade: e.quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade);
        const qtd = itens.reduce((s, e) => s + e.quantidade, 0);
        return { nome: cat.nome, qtd, itens };
      })
      .filter((c) => c.qtd > 0);
  }, [equipamentos]);

  return (
    <AccordionItem value={unidade.id} className="overflow-hidden rounded-md border border-border bg-card">
      <AccordionTrigger className="px-3 py-2 hover:no-underline">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <p className="break-words text-sm font-medium leading-tight">{unidade.nome}</p>
          {unidade.endereco && (
            <p className="break-words text-xs leading-snug text-muted-foreground">{unidade.endereco}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {unidade.possui_derso && (
              <Badge variant="outline" className="border-adequate/40 text-[10px] text-adequate">DERSO</Badge>
            )}
            {unidade.controle_acesso && (
              <Badge variant="outline" className="text-[10px]">Controle acesso</Badge>
            )}
            {unidade.vigilancia_eletronica && (
              <Badge variant="outline" className="text-[10px]">CFTV</Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-border bg-muted/20 px-3 pt-3">
        {semDados ? (
          <Empty text="Nenhum item cadastrado para esta unidade." />
        ) : (
          <div className="space-y-4">
            {/* Mini KPIs da unidade */}
            <div className="grid grid-cols-4 gap-2">
              <KpiMini icon={Cpu}      label="Equip."   value={totalEquip} />
              <KpiMini icon={Users}    label="Serv."    value={servidores.length} />
              <KpiMini icon={UserCog}  label="Terc."    value={terceirizados.length} />
              <KpiMini icon={DoorOpen} label="Portões"  value={portoes} />
            </div>

            {/* Equipamentos por categoria, com itens individuais e quantidades */}
            <SubSection title={`Equipamentos (${totalEquip})`} icon={Cpu}>
              {categorias.length === 0 ? (
                <Empty text="Sem equipamentos cadastrados." />
              ) : (
                <div className="space-y-2">
                  {categorias.map((c) => (
                    <div key={c.nome} className="overflow-hidden rounded-md border border-border bg-card">
                      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5 text-xs">
                        <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{c.nome}</span>
                        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{c.qtd}</span>
                      </div>
                      <ul className="divide-y divide-border">
                        {c.itens.map((it) => (
                          <li key={it.item_num} className="flex items-center gap-2 px-2 py-1 text-[11px]">
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              #{String(it.item_num).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-foreground" title={it.descricao}>
                              {it.descricao}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums">{it.quantidade}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </SubSection>

            {/* Servidores ativos da unidade */}
            <SubSection title={`Servidores ativos (${servidores.length})`} icon={Users}>
              {servidores.length === 0 ? (
                <Empty text="Nenhum servidor ativo vinculado." />
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {servidores.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" title={s.nome}>{s.nome}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{s.cargo} • Mat. {s.matricula}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SubSection>

            {/* Terceirizados ativos da unidade */}
            <SubSection title={`Terceirizados ativos (${terceirizados.length})`} icon={UserCog}>
              {terceirizados.length === 0 ? (
                <Empty text="Nenhum terceirizado ativo vinculado." />
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {terceirizados.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" title={t.nome}>{t.nome}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{t.empresa} • {t.funcao}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">{t.turno}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </SubSection>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
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

function KpiMini({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </div>
      <p className="mt-0.5 text-base font-semibold leading-none">{value}</p>
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

function SubSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3 w-3" />{title}
      </div>
      {children}
    </div>
  );
}

function PendItem({ label }: { label: string }) {
  return (
    <li className="rounded-md border bg-partial/15 px-3 py-2 text-sm text-partial border-partial/30">
      {label}
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}
