import { Fragment, useEffect, useMemo } from "react";
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
import { useUnidades } from "@/data/unidades";
import { useTerceirizados } from "@/data/terceirizados";
import { useAuth } from "@/contexts/AuthContext";

/** Porto Velho abre a listagem. A comparação com sensitivity "base" ignora
 *  caixa e acento, então "PORTO VELHO" e "Pôrto Velho" também casam. */
const ehCapital = (comarca: string) =>
  comarca.trim().localeCompare("Porto Velho", "pt-BR", { sensitivity: "base" }) === 0;

export default function AfsPorUnidadePage() {
  const { isOperador } = useAuth();
  const navigate = useNavigate();
  const items = useTerceirizados();
  const unidades = useUnidades();

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
      .sort((a, b) => {
        // Porto Velho abre a lista (sede da capital); as demais comarcas vêm
        // em ordem alfabética, e dentro de cada uma as unidades por nome.
        const pa = ehCapital(a.comarca);
        const pb = ehCapital(b.comarca);
        if (pa !== pb) return pa ? -1 : 1;
        const porComarca = a.comarca.localeCompare(b.comarca, "pt-BR");
        return porComarca !== 0 ? porComarca : a.nome.localeCompare(b.nome, "pt-BR");
      });
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
        eyebrow="Pessoal · Distribuição"
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
              {resumoPorUnidade.map((r, i) => {
                // A lista sai agrupada por comarca: marca onde o grupo troca e
                // fecha o subtotal de AFS da comarca na própria faixa.
                const abreGrupo = i === 0 || resumoPorUnidade[i - 1].comarca !== r.comarca;
                const totalComarca = resumoPorUnidade
                  .filter((x) => x.comarca === r.comarca)
                  .reduce((soma, x) => soma + x.qtd, 0);
                return (
                  <Fragment key={r.unidadeId}>
                    {abreGrupo && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={2} className="border-y border-border bg-muted/40 py-1">
                          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
                            {r.comarca}
                          </span>
                        </TableCell>
                        <TableCell className="border-y border-border bg-muted/40 py-1 text-right">
                          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            {totalComarca} AFS
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{r.comarca}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{r.qtd}</TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
