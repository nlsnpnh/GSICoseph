import { useEffect, useMemo } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { useUnidades } from "@/data/unidades";
import { useServidores } from "@/data/servidores";
import { useAuth } from "@/contexts/AuthContext";
import { FioAcento } from "@/components/admin/FioAcento";

export default function ServidoresPorUnidadePage() {
  const { isOperador } = useAuth();
  const navigate = useNavigate();
  const items = useServidores();
  const unidades = useUnidades();

  useEffect(() => { document.title = "Servidores por unidade | COSEPH TJRO"; }, []);

  const unidadeMap = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u])),
    [unidades],
  );

  // Apenas servidores ativos, agrupados por unidade predial
  const resumoPorUnidade = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of items) {
      if (s.situacao !== "Ativo" || !s.unidade_id) continue;
      map.set(s.unidade_id, (map.get(s.unidade_id) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([unidadeId, qtd]) => {
        const u = unidadeMap[unidadeId];
        return { unidadeId, nome: u?.nome ?? "—", comarca: u?.comarca_nome ?? "—", qtd };
      })
      .sort((a, b) => b.qtd - a.qtd || a.nome.localeCompare(b.nome));
  }, [items, unidadeMap]);

  const totalAtivos = useMemo(
    () => resumoPorUnidade.reduce((s, r) => s + r.qtd, 0),
    [resumoPorUnidade],
  );

  // Restrito a administrador e gestor
  if (isOperador) return <Navigate to="/servidores" replace />;

  return (
    <div>
      <PageHeader
        eyebrow="Pessoal · Distribuição"
        title="Servidores por unidade predial"
        description="Unidades com servidores ativos lotados e a respectiva quantidade."
        actions={
          <Button variant="outline" onClick={() => navigate("/servidores")}>
            <ArrowLeft className="mr-1 h-4 w-4" />Voltar
          </Button>
        }
      />

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Resumo</h2>
          <Badge variant="outline" className="text-xs">
            {resumoPorUnidade.length} unidade(s) • {totalAtivos} servidor(es) ativo(s)
          </Badge>
        </div>

        {resumoPorUnidade.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum servidor ativo lotado"
            description="Cadastre servidores com situação Ativo vinculados a uma unidade."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade predial</TableHead>
                <TableHead>Comarca</TableHead>
                <TableHead className="w-[160px] text-right">Servidores ativos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoPorUnidade.map((r) => (
                <TableRow key={r.unidadeId}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{r.comarca}</TableCell>
                  <TableCell className="text-right font-semibold">{r.qtd}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
