import { useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { UserCog } from "lucide-react";
import { useUnidadesMock } from "@/data/unidadesMock";
import { useTerceirizadosMock } from "@/data/terceirizadosMock";
import { useAuth } from "@/contexts/AuthContext";

export default function AfsPorUnidadePage() {
  const { isOperador } = useAuth();
  const navigate = useNavigate();
  const items = useTerceirizadosMock();
  const unidades = useUnidadesMock();

  useEffect(() => { document.title = "AFS por unidade | COSEPH TJRO"; }, []);

  const unidadeMap = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u])),
    [unidades],
  );

  // Apenas terceirizados ativos, agrupados por unidade predial
  const resumoPorUnidade = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of items) {
      if (t.situacao !== "Ativo" || !t.unidade_id) continue;
      map.set(t.unidade_id, (map.get(t.unidade_id) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([unidadeId, qtd]) => {
        const u = unidadeMap[unidadeId];
        return { unidadeId, nome: u?.nome ?? "—", comarca: u?.comarca_nome ?? "—", qtd };
      })
      .sort((a, b) => b.qtd - a.qtd || a.nome.localeCompare(b.nome));
  }, [items, unidadeMap]);

  const totalAfsAtivos = useMemo(
    () => resumoPorUnidade.reduce((s, r) => s + r.qtd, 0),
    [resumoPorUnidade],
  );

  // Restrito a administrador e gestor
  if (isOperador) return <Navigate to="/terceirizados" replace />;

  return (
    <div>
      <PageHeader
        title="AFS por unidade predial"
        description="Unidades com terceirizados ativos lançados e a respectiva quantidade."
        actions={
          <Button variant="outline" onClick={() => navigate("/terceirizados")}>
            <ArrowLeft className="mr-1 h-4 w-4" />Voltar
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Resumo</h2>
          <Badge variant="outline" className="text-xs">
            {resumoPorUnidade.length} unidade(s) • {totalAfsAtivos} AFS ativo(s)
          </Badge>
        </div>

        {resumoPorUnidade.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="Nenhum terceirizado ativo lançado"
            description="Cadastre terceirizados com situação Ativo vinculados a uma unidade."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade predial</TableHead>
                <TableHead>Comarca</TableHead>
                <TableHead className="w-[140px] text-right">AFS ativos</TableHead>
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
