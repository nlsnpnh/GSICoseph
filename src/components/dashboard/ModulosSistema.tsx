import { Search, Building2, CheckCircle2, XCircle } from "lucide-react";
import { ReactNode, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useServidoresMock } from "@/data/servidoresMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useEquipamentosMock } from "@/data/equipamentosMock";
import { useContratosMock, statusFromVigencia } from "@/data/contratosMock";

function ModuleCard({ title, children, footer, to }: { title: string; children: ReactNode; footer: string; to: string }) {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col shadow-sm">
      <CardHeader className="border-b border-border bg-muted/40 py-2 text-center">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-3 text-xs">{children}</CardContent>
      <div className="border-t border-border p-2">
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate(to)}>{footer}</Button>
      </div>
    </Card>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 pl-7 text-[11px]"
        placeholder={placeholder}
      />
    </div>
  );
}

function EmptyRow({ cols, label = "Nenhum resultado" }: { cols: number; label?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-2 text-center text-[10px] text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

function matches(query: string, ...fields: (string | number | undefined | null)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
}

function statusToneEquip(s: string) {
  if (s === "Operacional") return "bg-adequate/10 text-adequate border-adequate/30";
  if (s === "Em manutenção") return "bg-partial/15 text-partial border-partial/30";
  return "bg-critical/10 text-critical border-critical/30";
}

function statusToneSituacao(s: string) {
  if (s === "Ativo") return "bg-adequate/10 text-adequate border-adequate/30";
  if (s === "Férias" || s === "Licença") return "bg-partial/15 text-partial border-partial/30";
  return "bg-critical/10 text-critical border-critical/30";
}

function statusToneContrato(s: string) {
  if (s === "Vigente") return "bg-adequate/10 text-adequate border-adequate/30";
  if (s === "A vencer") return "bg-partial/15 text-partial border-partial/30";
  return "bg-critical/10 text-critical border-critical/30";
}

const MAX_ROWS = 6;

export function ModulosSistema() {
  const unidades = useUnidadesMock();
  const servidores = useServidoresMock();
  const terceirizados = useTerceirizadosMock();
  const equipamentos = useEquipamentosMock();
  const contratos = useContratosMock();

  const [qUni, setQUni] = useState("");
  const [qServ, setQServ] = useState("");
  const [qTerc, setQTerc] = useState("");
  const [qEqp, setQEqp] = useState("");
  const [qCont, setQCont] = useState("");

  const unidadesFiltered = useMemo(
    () => unidades.filter((u) => matches(qUni, u.nome, u.comarca, u.endereco, u.tipo, u.responsavel_local, u.criticidade)),
    [unidades, qUni],
  );
  const servidoresFiltered = useMemo(
    () => servidores.filter((s) => matches(qServ, s.nome, s.matricula, s.cargo, s.comarca, s.unidade, s.situacao, s.email)),
    [servidores, qServ],
  );
  const terceirizadosFiltered = useMemo(
    () => terceirizados.filter((t) => matches(qTerc, t.nome, t.cpf, t.empresa, t.funcao, t.unidade, t.comarca, t.situacao)),
    [terceirizados, qTerc],
  );

  const unidadeNomeById = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u.nome])),
    [unidades],
  );
  const equipamentosFiltered = useMemo(
    () => equipamentos.filter((e) => matches(
      qEqp, e.tipo, e.identificacao, e.fabricante, e.modelo, e.numero_serie, e.localizacao, e.status, unidadeNomeById[e.unidade_id],
    )),
    [equipamentos, qEqp, unidadeNomeById],
  );
  const contratosFiltered = useMemo(
    () => contratos.filter((c) => matches(qCont, c.numero, c.empresa, c.objeto, c.fiscal, c.gestor, statusFromVigencia(c.data_fim))),
    [contratos, qCont],
  );

  return (
    <div>
      <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-foreground">
        Módulos do Sistema
      </h3>
      <div className="grid gap-3 lg:grid-cols-5">
        {/* Unidades */}
        <ModuleCard title="Unidades Prediais" footer="Ver todas as unidades" to="/unidades">
          <SearchBar value={qUni} onChange={setQUni} placeholder="Buscar unidade..." />
          {unidadesFiltered.length === 0 ? (
            <p className="py-6 text-center text-[10px] text-muted-foreground">Nenhum resultado</p>
          ) : (
            <>
              {(() => {
                const u = unidadesFiltered[0];
                const critColor =
                  u.criticidade === "Crítico" ? "border-critical/30 bg-critical/10 text-critical"
                  : u.criticidade === "Alto"   ? "border-partial/30 bg-partial/10 text-partial"
                  : u.criticidade === "Médio"  ? "border-partial/30 bg-partial/10 text-partial"
                  : "border-adequate/30 bg-adequate/10 text-adequate";
                return (
                  <div className="overflow-hidden rounded-md border border-border">
                    {u.imagem_url ? (
                      <img
                        src={u.imagem_url}
                        alt={u.nome}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-muted/40">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="space-y-1 p-2 text-[11px]">
                      <p className="truncate font-semibold text-foreground">{u.nome}</p>
                      <p className="truncate text-muted-foreground">{u.comarca} · {u.tipo}</p>
                      <p className="truncate text-muted-foreground">{u.endereco}</p>
                      <p className="truncate text-muted-foreground">Resp.: {u.responsavel_local}</p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${critColor}`}>{u.criticidade}</Badge>
                        <span className="flex items-center gap-1 text-[10px]">
                          {u.possui_derso
                            ? <><CheckCircle2 className="h-3 w-3 text-adequate" /><span className="text-adequate">DERSO</span></>
                            : <><XCircle className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Sem DERSO</span></>
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {unidadesFiltered.length > 1 && (
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                  + {unidadesFiltered.length - 1} outra(s) unidade(s)
                </p>
              )}
            </>
          )}
        </ModuleCard>

        {/* Servidores */}
        <ModuleCard title="Servidores" footer="Ver todos os servidores" to="/servidores">
          <SearchBar value={qServ} onChange={setQServ} placeholder="Buscar servidor..." />
          <table className="w-full text-[11px]">
            <thead className="text-muted-foreground"><tr>
              <th className="text-left font-medium">Nome</th>
              <th className="text-left font-medium">Mat.</th>
              <th className="text-left font-medium">Comarca</th>
              <th className="text-left font-medium">Sit.</th>
            </tr></thead>
            <tbody>
              {servidoresFiltered.length === 0 ? <EmptyRow cols={4} /> : servidoresFiltered.slice(0, MAX_ROWS).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-1.5 font-medium">{s.nome}</td>
                  <td className="py-1.5 text-muted-foreground">{s.matricula}</td>
                  <td className="py-1.5 text-muted-foreground">{s.comarca}</td>
                  <td className="py-1.5">
                    <Badge variant="outline" className={`${statusToneSituacao(s.situacao)} text-[10px]`}>{s.situacao}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {servidoresFiltered.length > MAX_ROWS && (
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              + {servidoresFiltered.length - MAX_ROWS} resultado(s)
            </p>
          )}
        </ModuleCard>

        {/* Terceirizados */}
        <ModuleCard title="Terceirizados" footer="Ver todos os terceirizados" to="/terceirizados">
          <SearchBar value={qTerc} onChange={setQTerc} placeholder="Buscar terceirizado..." />
          <table className="w-full text-[11px]">
            <thead className="text-muted-foreground"><tr>
              <th className="text-left font-medium">Nome</th>
              <th className="text-left font-medium">Empresa</th>
              <th className="text-left font-medium">Função</th>
              <th className="text-left font-medium">Sit.</th>
            </tr></thead>
            <tbody>
              {terceirizadosFiltered.length === 0 ? <EmptyRow cols={4} /> : terceirizadosFiltered.slice(0, MAX_ROWS).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-1.5 font-medium">{t.nome}</td>
                  <td className="py-1.5 text-muted-foreground">{t.empresa}</td>
                  <td className="py-1.5 text-muted-foreground">{t.funcao}</td>
                  <td className="py-1.5">
                    <Badge variant="outline" className={`${statusToneSituacao(t.situacao)} text-[10px]`}>{t.situacao}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {terceirizadosFiltered.length > MAX_ROWS && (
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              + {terceirizadosFiltered.length - MAX_ROWS} resultado(s)
            </p>
          )}
        </ModuleCard>

        {/* Equipamentos */}
        <ModuleCard title="Equipamentos" footer="Ver todos os equipamentos" to="/equipamentos">
          <SearchBar value={qEqp} onChange={setQEqp} placeholder="Buscar equipamento..." />
          <table className="w-full text-[11px]">
            <thead className="text-muted-foreground"><tr>
              <th className="text-left font-medium">Identif.</th>
              <th className="text-left font-medium">Tipo</th>
              <th className="text-left font-medium">Sit.</th>
            </tr></thead>
            <tbody>
              {equipamentosFiltered.length === 0 ? <EmptyRow cols={3} /> : equipamentosFiltered.slice(0, MAX_ROWS).map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="py-1.5 font-medium">{e.identificacao}</td>
                  <td className="py-1.5 text-muted-foreground">{e.tipo}</td>
                  <td className="py-1.5">
                    <Badge variant="outline" className={`${statusToneEquip(e.status)} text-[10px]`}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {equipamentosFiltered.length > MAX_ROWS && (
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              + {equipamentosFiltered.length - MAX_ROWS} resultado(s)
            </p>
          )}
        </ModuleCard>

        {/* Contratos */}
        <ModuleCard title="Contratos" footer="Ver todos os contratos" to="/contratos">
          <SearchBar value={qCont} onChange={setQCont} placeholder="Buscar contrato..." />
          <table className="w-full text-[11px]">
            <thead className="text-muted-foreground"><tr>
              <th className="text-left font-medium">Contrato</th>
              <th className="text-left font-medium">Empresa</th>
              <th className="text-left font-medium">Vigência</th>
              <th className="text-left font-medium">Sit.</th>
            </tr></thead>
            <tbody>
              {contratosFiltered.length === 0 ? <EmptyRow cols={4} /> : contratosFiltered.slice(0, MAX_ROWS).map((c) => {
                const status = statusFromVigencia(c.data_fim);
                return (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-1.5 font-medium">{c.numero}</td>
                    <td className="py-1.5 text-muted-foreground">{c.empresa}</td>
                    <td className="py-1.5 text-[10px] text-muted-foreground">
                      {new Date(c.data_inicio).toLocaleDateString("pt-BR")}<br/>
                      {new Date(c.data_fim).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-1.5">
                      <Badge variant="outline" className={`${statusToneContrato(status)} text-[10px]`}>{status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contratosFiltered.length > MAX_ROWS && (
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              + {contratosFiltered.length - MAX_ROWS} resultado(s)
            </p>
          )}
        </ModuleCard>
      </div>
    </div>
  );
}
