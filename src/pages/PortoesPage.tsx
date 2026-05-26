import { useEffect, useMemo, useState } from "react";
import { DoorOpen, KeyRound } from "lucide-react";
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
import { useUnidadeEquipamentos } from "@/data/equipamentos";

const KIT_RFID_ITEM_NUM = 27;

export default function PortoesPage() {
  const distribuicao = useUnidadeEquipamentos();
  const [search, setSearch] = useState("");
  const [comarcaFilter, setComarcaFilter] = useState<string>("all");

  useEffect(() => { document.title = "Portões e Acessos | COSEPH TJRO"; }, []);

  const unidadesComKit = useMemo(
    () =>
      distribuicao
        .filter((d) => d.item_num === KIT_RFID_ITEM_NUM && d.quantidade > 0)
        .sort(
          (a, b) =>
            a.comarca_nome.localeCompare(b.comarca_nome, "pt-BR") ||
            a.unidade_nome.localeCompare(b.unidade_nome, "pt-BR"),
        ),
    [distribuicao],
  );

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

  const totalKits = useMemo(
    () => unidadesComKit.reduce((s, d) => s + d.quantidade, 0),
    [unidadesComKit],
  );

  return (
    <div>
      <PageHeader
        title="Portões e Acessos"
        description="Unidades prediais que possuem o Kit Abertura de Portão por RFID (item #27 do contrato)."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Unidades com Kit RFID" value={unidadesComKit.length} icon={KeyRound} />
        <SummaryCard label="Total de kits instalados" value={totalKits} icon={DoorOpen} />
        <SummaryCard label="Comarcas atendidas" value={comarcas.length} icon={DoorOpen} />
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
            title="Nenhuma unidade com Kit RFID"
            description="Nenhuma unidade predial possui o Kit Abertura de Portão por RFID com os filtros aplicados."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade predial</TableHead>
                <TableHead>Comarca</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.unidade_nome}</TableCell>
                  <TableCell className="text-muted-foreground">{d.comarca_nome || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-adequate/10 text-adequate border-adequate/30">
                      {d.quantidade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.observacoes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CrudTableLayout>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof DoorOpen }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />{label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
