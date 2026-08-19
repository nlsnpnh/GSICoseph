import { useEffect } from "react";
import { FileText, Wrench } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnidades } from "@/data/unidades";
import { useAuth } from "@/contexts/AuthContext";
import { useOcorrencias } from "@/data/ocorrencias";
import { ChamadosTab } from "@/components/ocorrencias/ChamadosTab";
import { RelatoriosTab } from "@/components/ocorrencias/RelatoriosTab";

export default function OcorrenciasPage() {
  const { isOperador, unidadeId, unidadeNome: authUnidadeNome, podeEditar } = useAuth();
  const podeGerenciar = podeEditar("ocorrencias");

  const itemsAll = useOcorrencias();
  const unidadesAll = useUnidades();
  const items = isOperador && unidadeId
    ? itemsAll.filter((o) => o.unidade_id === unidadeId)
    : itemsAll;
  const unidades = isOperador && unidadeId
    ? unidadesAll.filter((u) => u.id === unidadeId)
    : unidadesAll;
  const unidadeNome = (id: string) => unidadesAll.find((u) => u.id === id)?.nome ?? "—";

  useEffect(() => { document.title = "Manutenção | COSEPH TJRO"; }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Manutenção"
        description="Controle de chamados técnicos e manutenção predial, com acompanhamento de SLA por unidade."
      />

      <Tabs defaultValue="chamados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chamados" className="gap-1.5">
            <Wrench className="h-4 w-4" />Chamados
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1.5">
            <FileText className="h-4 w-4" />Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chamados">
          <ChamadosTab
            items={items}
            unidades={unidades}
            unidadeNome={unidadeNome}
            podeGerenciar={podeGerenciar}
            operadorUnidadeId={unidadeId}
            operadorUnidadeNome={authUnidadeNome}
          />
        </TabsContent>

        <TabsContent value="relatorios">
          <RelatoriosTab items={items} unidades={unidades} unidadeNome={unidadeNome} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
