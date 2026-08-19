import { useEffect } from "react";
import { BarChart3, ClipboardList, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnidades } from "@/data/unidades";
import { useComarcas } from "@/data/api";
import { useAuth } from "@/contexts/AuthContext";
import { LancamentoTab } from "@/components/boletim/LancamentoTab";
import { AcompanhamentoTab } from "@/components/boletim/AcompanhamentoTab";
import { RelatorioGeralTab } from "@/components/boletim/RelatorioGeralTab";

export default function BoletimPage() {
  useEffect(() => { document.title = "Boletim Operacional | COSEPH TJRO"; }, []);
  const { isOperador, unidadeId } = useAuth();
  const unidades = useUnidades();
  const { data: comarcas = [] } = useComarcas();

  return (
    <div>
      <PageHeader
        title="Boletim Operacional"
        description="Indicadores mensais por unidade — preenchimento e histórico."
      />

      <Tabs defaultValue="lancamento" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lancamento">
            <ClipboardList className="mr-2 h-4 w-4" />Lançamento Mensal
          </TabsTrigger>
          {!isOperador && (
            <TabsTrigger value="acompanhamento">
              <ListChecks className="mr-2 h-4 w-4" />Acompanhamento
            </TabsTrigger>
          )}
          <TabsTrigger value="relatorio">
            <BarChart3 className="mr-2 h-4 w-4" />Relatório Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-4">
          <LancamentoTab unidades={unidades} />
        </TabsContent>

        {!isOperador && (
          <TabsContent value="acompanhamento">
            <AcompanhamentoTab unidades={unidades} comarcas={comarcas} />
          </TabsContent>
        )}

        <TabsContent value="relatorio">
          <RelatorioGeralTab
            unidades={unidades}
            comarcas={comarcas}
            isOperador={isOperador}
            operadorUnidadeId={unidadeId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
