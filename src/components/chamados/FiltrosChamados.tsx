import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FioAcento } from "@/components/admin/FioAcento";
import { TYPO } from "@/lib/design-tokens";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CATEGORIAS, PRIORIDADES, SERVICOS, STATUS_CHAMADO, empresaCurta } from "@/data/chamados";
import type { Contrato } from "@/data/contratos";
import type { UnidadePredial } from "@/data/unidades";
import { PERIODOS, type FiltrosChamado, FILTROS_VAZIOS } from "./filtros";

/** Um Select compacto e rotulado — o mesmo formato para todos os filtros. */
function Filtro({
  label, valor, onChange, opcoes, todosRotulo,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
  todosRotulo: string;
}) {
  return (
    <div className="space-y-1">
      <Label className={`${TYPO.eyebrow} text-muted-foreground`}>{label}</Label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{todosRotulo}</SelectItem>
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FiltrosChamados({
  filtros, onChange, unidades, contratos, responsaveis, mostrarStatus = true,
}: {
  filtros: FiltrosChamado;
  onChange: (f: FiltrosChamado) => void;
  unidades: UnidadePredial[];
  contratos: Contrato[];
  responsaveis: string[];
  mostrarStatus?: boolean;
}) {
  const set = <K extends keyof FiltrosChamado>(chave: K, valor: FiltrosChamado[K]) =>
    onChange({ ...filtros, [chave]: valor });

  const limpo = JSON.stringify({ ...filtros, busca: "" }) === JSON.stringify({ ...FILTROS_VAZIOS, busca: "" });

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      <CardContent className="space-y-3 p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Filtro
          label="Unidade predial" valor={filtros.unidade} todosRotulo="Todas as unidades"
          onChange={(v) => set("unidade", v)}
          opcoes={unidades.map((u) => ({ valor: u.id, rotulo: u.nome }))}
        />
        <Filtro
          label="Contrato" valor={filtros.contrato} todosRotulo="Todos os contratos"
          onChange={(v) => set("contrato", v)}
          opcoes={contratos.map((c) => ({ valor: c.id, rotulo: `${c.numero} — ${empresaCurta(c.empresa)}` }))}
        />
        <Filtro
          label="Categoria" valor={filtros.categoria} todosRotulo="Todas as categorias"
          onChange={(v) => set("categoria", v)}
          opcoes={CATEGORIAS.map((c) => ({ valor: c, rotulo: c }))}
        />
        <Filtro
          label="Serviço" valor={filtros.servico} todosRotulo="Todos os serviços"
          onChange={(v) => set("servico", v)}
          opcoes={SERVICOS.map((s) => ({ valor: s, rotulo: s }))}
        />

        {mostrarStatus && (
          <Filtro
            label="Status" valor={filtros.status} todosRotulo="Todos os status"
            onChange={(v) => set("status", v)}
            opcoes={STATUS_CHAMADO.map((s) => ({ valor: s, rotulo: s }))}
          />
        )}
        <Filtro
          label="Prioridade" valor={filtros.prioridade} todosRotulo="Todas as prioridades"
          onChange={(v) => set("prioridade", v)}
          opcoes={PRIORIDADES.map((p) => ({ valor: p, rotulo: p }))}
        />
        <Filtro
          label="Responsável" valor={filtros.responsavel} todosRotulo="Todos os responsáveis"
          onChange={(v) => set("responsavel", v)}
          opcoes={responsaveis.map((r) => ({ valor: r, rotulo: r }))}
        />

        <div className="space-y-1">
          <Label className={`${TYPO.eyebrow} text-muted-foreground`}>Período</Label>
          <Select value={filtros.periodo} onValueChange={(v) => set("periodo", v as FiltrosChamado["periodo"])}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.rotulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtros.periodo === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:w-1/2">
          <div className="space-y-1">
            <Label className={`${TYPO.eyebrow} text-muted-foreground`}>De</Label>
            <Input type="date" value={filtros.de} onChange={(e) => set("de", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className={`${TYPO.eyebrow} text-muted-foreground`}>Até</Label>
            <Input type="date" value={filtros.ate} onChange={(e) => set("ate", e.target.value)} className="h-9" />
          </div>
        </div>
      )}

      {!limpo && (
        <Button
          variant="ghost" size="sm" className="h-7 gap-1 text-xs"
          onClick={() => onChange({ ...FILTROS_VAZIOS, busca: filtros.busca })}
        >
          <X className="h-3.5 w-3.5" />Limpar filtros
        </Button>
      )}
      </CardContent>
    </Card>
  );
}
