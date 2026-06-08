import { useEffect, useMemo, useState } from "react";
import { DoorOpen, KeyRound, Cog } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUnidadeEquipamentos, useEquipamentosCatalogo } from "@/data/equipamentos";

const KIT_RFID_ITEM_NUM = 27;
const KIT_AUTOMATIZADOR_ITEM_NUM = 24;

type LinhaUnidade = {
  unidade_id: string;
  unidade_nome: string;
  comarca_nome: string;
  automatizador: number;
  rfid: number;
};

export default function PortoesPage() {
  const distribuicao = useUnidadeEquipamentos();
  const catalogo = useEquipamentosCatalogo();
  const [search, setSearch] = useState("");
  const [comarcaFilter, setComarcaFilter] = useState<string>("all");

  useEffect(() => { document.title = "Portões e Acessos | COSEPH TJRO"; }, []);

  // Agrupa por unidade predial somando os dois tipos de kit
  const unidadesComKit = useMemo(() => {
    const map = new Map<string, LinhaUnidade>();
    for (const d of distribuicao) {
      const isRfid = d.item_num === KIT_RFID_ITEM_NUM;
      const isAuto = d.item_num === KIT_AUTOMATIZADOR_ITEM_NUM;
      if (!isRfid && !isAuto) continue;
      let row = map.get(d.unidade_id);
      if (!row) {
        row = {
          unidade_id: d.unidade_id,
          unidade_nome: d.unidade_nome,
          comarca_nome: d.comarca_nome,
          automatizador: 0,
          rfid: 0,
        };
        map.set(d.unidade_id, row);
      }
      if (isRfid) row.rfid += d.quantidade;
      if (isAuto) row.automatizador += d.quantidade;
    }
    return [...map.values()]
      .filter((r) => r.automatizador > 0 || r.rfid > 0)
      .sort(
        (a, b) =>
          a.comarca_nome.localeCompare(b.comarca_nome, "pt-BR") ||
          a.unidade_nome.localeCompare(b.unidade_nome, "pt-BR"),
      );
  }, [distribuicao]);

  const comarcas = useMemo(() => {
    const set = new Set(unidadesComKit.map((d) => d.comarca_nome).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [unidadesComKit]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unidadesComKit.filter((d) => {
      if (comarcaFilter !== "all" && d.comarca_nome !== comarcaFilter) return false;
      if (!q) return true;
      return (
        d.unidade_nome.toLowerCase().includes(q) ||
        d.comarca_nome.toLowerCase().includes(q)
      );
    });
  }, [unidadesComKit, search, comarcaFilter]);

  const totalAutomatizador = useMemo(
    () => unidadesComKit.reduce((s, d) => s + d.automatizador, 0),
    [unidadesComKit],
  );
  const totalRfid = useMemo(
    () => unidadesComKit.reduce((s, d) => s + d.rfid, 0),
    [unidadesComKit],
  );

  // Quantidades contratadas (catálogo) para comparar com o instalado
  const { contratadoAuto, contratadoRfid } = useMemo(() => {
    const qtd = (n: number) => catalogo.find((c) => c.item_num === n)?.qtd_contrato ?? 0;
    return {
      contratadoAuto: qtd(KIT_AUTOMATIZADOR_ITEM_NUM),
      contratadoRfid: qtd(KIT_RFID_ITEM_NUM),
    };
  }, [catalogo]);

  const aAlocarAuto = Math.max(0, contratadoAuto - totalAutomatizador);
  const aAlocarRfid = Math.max(0, contratadoRfid - totalRfid);

  return (
    <div>
      <PageHeader
        title="Portões e Acessos"
        description="Unidades prediais com Kit Automatizador de Portão e/ou Kit Abertura de Portão por RFID (item #27 do contrato)."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Unidades atendidas" value={unidadesComKit.length} icon={DoorOpen} />
        <SummaryCard
          label="Kit Automatizador de Portão"
          value={totalAutomatizador}
          icon={Cog}
          contratado={contratadoAuto}
          aAlocar={aAlocarAuto}
        />
        <SummaryCard
          label="Kit Abertura por RFID"
          value={totalRfid}
          icon={KeyRound}
          contratado={contratadoRfid}
          aAlocar={aAlocarRfid}
        />
      </div>

      <CrudTableLayout
        search={search} onSearchChange={setSearch}
        placeholder="Buscar por unidade ou comarca..."
        count={filtered.length}
        filters={
          <Select value={comarcaFilter} onValueChange={setComarcaFilter}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Comarca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as comarcas</SelectItem>
              {comarcas.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="Nenhuma unidade encontrada"
            description="Nenhuma unidade predial possui os kits de portão com os filtros aplicados."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade predial</TableHead>
                <TableHead>Comarca</TableHead>
                <TableHead className="text-center">Kit Automatizador de Portão</TableHead>
                <TableHead className="text-center">Kit Abertura de Portão por RFID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.unidade_id}>
                  <TableCell className="font-medium">{d.unidade_nome}</TableCell>
                  <TableCell className="text-muted-foreground">{d.comarca_nome || "—"}</TableCell>
                  <TableCell className="text-center">
                    {d.automatizador > 0 ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                        {d.automatizador}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {d.rfid > 0 ? (
                      <Badge variant="outline" className="bg-adequate/10 text-adequate border-adequate/30">
                        {d.rfid}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CrudTableLayout>
    </div>
  );
}

function SummaryCard({
  label, value, icon: Icon, contratado, aAlocar,
}: {
  label: string;
  value: number;
  icon: typeof DoorOpen;
  contratado?: number;
  aAlocar?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />{label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        {contratado != null && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">/ {contratado}</span>
        )}
      </p>
      {contratado != null && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          instalados de {contratado} contratados
          {aAlocar != null && aAlocar > 0 && (
            <span className="ml-1 font-medium text-partial">· {aAlocar} a alocar</span>
          )}
        </p>
      )}
    </div>
  );
}
