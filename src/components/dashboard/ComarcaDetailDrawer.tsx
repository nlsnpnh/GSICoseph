import { Building2, Cpu, Users, UserCog, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { SERVIDORES_MOCK, TERCEIRIZADOS_MOCK, type ComarcaPin } from "@/data/mockDashboard";

const nivelTone: Record<ComarcaPin["nivel"], string> = {
  adequado:  "bg-adequate/10 text-adequate border-adequate/30",
  parcial:   "bg-partial/15 text-partial border-partial/30",
  critico:   "bg-critical/10 text-critical border-critical/30",
  sem_dados: "bg-muted text-muted-foreground border-border",
};

const nivelLabel: Record<ComarcaPin["nivel"], string> = {
  adequado: "Segurança adequada",
  parcial: "Segurança parcial",
  critico: "Situação crítica",
  sem_dados: "Sem dados",
};

interface Props {
  comarca: ComarcaPin | null;
  onOpenChange: (open: boolean) => void;
}

export function ComarcaDetailDrawer({ comarca, onOpenChange }: Props) {
  const unidades = useUnidadesMock();
  const equipamentos = useEquipamentosMock();

  if (!comarca) {
    return <Sheet open={false} onOpenChange={onOpenChange}><SheetContent /></Sheet>;
  }

  const unidadesComarca = unidades.filter((u) => u.comarca === comarca.nome);
  const unidadeIds = new Set(unidadesComarca.map((u) => u.id));
  const equipComarca = equipamentos.filter((e) => unidadeIds.has(e.unidade_id));
  const servidoresComarca = SERVIDORES_MOCK.filter((s) => s.comarca === comarca.nome);
  const terceirizadosComarca = TERCEIRIZADOS_MOCK.filter((t) =>
    unidadesComarca.some((u) => t.unidade.toLowerCase().includes(u.nome.split(" ")[0].toLowerCase())),
  );

  const equipInoperantes = equipComarca.filter((e) => e.status === "Inoperante" || e.status === "Em manutenção");
  const unidadesCriticas = unidadesComarca.filter((u) => u.criticidade === "Alto" || u.criticidade === "Crítico");
  const semDerso = unidadesComarca.filter((u) => !u.possui_derso);

  return (
    <Sheet open={!!comarca} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle>Comarca de {comarca.nome}</SheetTitle>
              <SheetDescription>Visão consolidada de unidades, equipamentos e pessoal.</SheetDescription>
            </div>
            <Badge variant="outline" className={nivelTone[comarca.nivel]}>
              <ShieldCheck className="mr-1 h-3 w-3" />
              {nivelLabel[comarca.nivel]}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="space-y-6 p-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi icon={Building2} label="Unidades" value={unidadesComarca.length} />
              <Kpi icon={Cpu} label="Equipamentos" value={equipComarca.length} />
              <Kpi icon={Users} label="Servidores" value={servidoresComarca.length} />
              <Kpi icon={UserCog} label="Terceirizados" value={terceirizadosComarca.length} />
            </div>

            {/* Pendências */}
            <Section title="Pendências e alertas" icon={AlertTriangle}>
              {equipInoperantes.length === 0 && unidadesCriticas.length === 0 && semDerso.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma pendência registrada.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {equipInoperantes.length > 0 && (
                    <PendItem tone="critical" label={`${equipInoperantes.length} equipamento(s) inoperante(s) ou em manutenção`} />
                  )}
                  {unidadesCriticas.length > 0 && (
                    <PendItem tone="partial" label={`${unidadesCriticas.length} unidade(s) com criticidade Alta/Crítica`} />
                  )}
                  {semDerso.length > 0 && (
                    <PendItem tone="partial" label={`${semDerso.length} unidade(s) sem DERSO`} />
                  )}
                </ul>
              )}
            </Section>

            <Separator />

            {/* Prédios */}
            <Section title="Prédios existentes" icon={Building2}>
              {unidadesComarca.length === 0 ? (
                <Empty text="Nenhuma unidade cadastrada nesta comarca." />
              ) : (
                <ul className="space-y-2">
                  {unidadesComarca.map((u) => (
                    <li key={u.id} className="rounded-md border border-border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{u.nome}</p>
                          <p className="text-xs text-muted-foreground">{u.tipo} • {u.endereco}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{u.criticidade}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Equipamentos */}
            <Section title="Equipamentos" icon={Cpu}>
              {equipComarca.length === 0 ? (
                <Empty text="Nenhum equipamento vinculado." />
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(
                    equipComarca.reduce<Record<string, number>>((acc, e) => {
                      acc[e.tipo] = (acc[e.tipo] ?? 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([tipo, qtd]) => (
                    <li key={tipo} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
                      <span>{tipo}</span>
                      <span className="font-medium">{qtd}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Servidores */}
            <Section title="Servidores" icon={Users}>
              {servidoresComarca.length === 0 ? (
                <Empty text="Nenhum servidor cadastrado." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {servidoresComarca.map((s) => (
                    <li key={s.matricula} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="font-medium">{s.nome}</p>
                        <p className="text-xs text-muted-foreground">{s.cargo} • Mat. {s.matricula}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Terceirizados */}
            <Section title="Terceirizados" icon={UserCog}>
              {terceirizadosComarca.length === 0 ? (
                <Empty text="Nenhum terceirizado vinculado." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {terceirizadosComarca.map((t) => (
                    <li key={t.nome} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">{t.empresa} • {t.funcao}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{t.unidade}</Badge>
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

function Kpi({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
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
  return (
    <li className={`rounded-md border px-3 py-2 ${cls}`}>{label}</li>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
