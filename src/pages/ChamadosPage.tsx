import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, CheckCircle2, Inbox, LayoutGrid, Plus, SlidersHorizontal, Ticket,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FioAcento } from "@/components/admin/FioAcento";
import { TYPO } from "@/lib/design-tokens";
import { useAuth } from "@/contexts/AuthContext";
import { useUnidades } from "@/data/unidades";
import { useContratos } from "@/data/contratos";
import {
  useChamados, empresaCurta, isPendente, STATUS_ENCERRADOS, type Chamado,
} from "@/data/chamados";
import { FiltrosChamados } from "@/components/chamados/FiltrosChamados";
import { TabelaChamados, type ColunaId } from "@/components/chamados/TabelaChamados";
import { PainelTab } from "@/components/chamados/PainelTab";
import { RelatoriosTab } from "@/components/chamados/RelatoriosTab";
import { aplicarFiltros, FILTROS_VAZIOS, type FiltrosChamado } from "@/components/chamados/filtros";

// Colunas de cada visualizacao (itens 3, 8 e 9 da especificacao do modulo).
const COLUNAS_PENDENTES: ColunaId[] = [
  "numero", "unidade", "assunto", "contrato", "categoria", "aberto_em", "status", "prazo",
];
const COLUNAS_FECHADOS: ColunaId[] = [
  "numero", "unidade", "assunto", "responsavel", "contrato", "categoria",
  "ultima_movimentacao", "resolvido_em", "fechado_em",
];
const COLUNAS_TODOS: ColunaId[] = [
  "numero", "unidade", "contrato", "assunto", "responsavel", "categoria",
  "ultima_movimentacao", "status",
];

const COLUNAS_ESCOLHIVEIS: { id: ColunaId; rotulo: string }[] = [
  { id: "numero", rotulo: "Número" },
  { id: "unidade", rotulo: "Unidade" },
  { id: "assunto", rotulo: "Assunto" },
  { id: "contrato", rotulo: "Contrato" },
  { id: "categoria", rotulo: "Categoria" },
  { id: "servico", rotulo: "Serviço" },
  { id: "solicitante", rotulo: "Solicitante" },
  { id: "responsavel", rotulo: "Responsável" },
  { id: "prioridade", rotulo: "Prioridade" },
  { id: "aberto_em", rotulo: "Abertura" },
  { id: "ultima_movimentacao", rotulo: "Última ação" },
  { id: "prazo", rotulo: "Prazo" },
  { id: "status", rotulo: "Status" },
  { id: "resolvido_em", rotulo: "Resolvido em" },
  { id: "fechado_em", rotulo: "Fechado em" },
];

export default function ChamadosPage() {
  const navigate = useNavigate();
  const { isOperador, unidadeId, podeEditar } = useAuth();
  const podeAbrir = podeEditar("chamados", unidadeId);

  const todosChamados = useChamados();
  const todasUnidades = useUnidades();
  const todosContratos = useContratos();

  // A RLS ja restringe o operador a propria unidade; o filtro aqui e para a
  // interface nao oferecer opcoes que voltariam vazias.
  const unidades = isOperador && unidadeId
    ? todasUnidades.filter((u) => u.id === unidadeId)
    : todasUnidades;

  const nomeUnidade = useMemo(() => {
    const mapa = new Map(todasUnidades.map((u) => [u.id, u.nome]));
    return (id: string) => mapa.get(id) ?? "—";
  }, [todasUnidades]);

  const rotuloContrato = useMemo(() => {
    const mapa = new Map(todosContratos.map((c) => [c.id, `${c.numero} — ${empresaCurta(c.empresa)}`]));
    return (id: string) => mapa.get(id) ?? "—";
  }, [todosContratos]);

  const responsaveis = useMemo(() => {
    const nomes = new Set(todosChamados.map((c) => c.responsavel_nome || "—"));
    return Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [todosChamados]);

  const [filtros, setFiltros] = useState<FiltrosChamado>(FILTROS_VAZIOS);
  const [colunasCustom, setColunasCustom] = useState<ColunaId[]>(COLUNAS_TODOS);

  const filtrados = useMemo(
    () => aplicarFiltros(todosChamados, filtros, nomeUnidade, rotuloContrato),
    [todosChamados, filtros, nomeUnidade, rotuloContrato],
  );

  const pendentes = useMemo(() => filtrados.filter((c) => isPendente(c.status)), [filtrados]);
  const fechados = useMemo(
    () => filtrados.filter((c) => STATUS_ENCERRADOS.includes(c.status)),
    [filtrados],
  );

  useEffect(() => { document.title = "Chamados | COSEPH TJRO"; }, []);

  const botaoNovo = (
    <Button onClick={() => navigate("/chamados/novo")}>
      <Plus className="mr-1 h-4 w-4" />Novo chamado
    </Button>
  );

  /** Uma visualizacao de lista: busca + filtros + tabela, ou estado vazio. */
  const Lista = ({
    dados, colunas, ordemInicial, mostrarStatus = true,
  }: {
    dados: Chamado[];
    colunas: ColunaId[];
    ordemInicial?: ColunaId;
    mostrarStatus?: boolean;
  }) => (
    <div className="space-y-4">
      <FiltrosChamados
        filtros={filtros} onChange={setFiltros}
        unidades={unidades} contratos={todosContratos}
        responsaveis={responsaveis} mostrarStatus={mostrarStatus}
      />

      {dados.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Nenhum chamado encontrado."
          description={
            todosChamados.length === 0
              ? "Ainda não há chamados registrados. Abra o primeiro para começar o acompanhamento."
              : "Nenhum chamado atende aos filtros selecionados."
          }
          action={podeAbrir ? botaoNovo : undefined}
        />
      ) : (
        <CrudTableLayout
          search={filtros.busca}
          onSearchChange={(v) => setFiltros({ ...filtros, busca: v })}
          placeholder="Buscar por número, assunto, unidade, contrato, solicitante..."
          count={dados.length}
        >
          <TabelaChamados
            chamados={dados} colunas={colunas}
            nomeUnidade={nomeUnidade} rotuloContrato={rotuloContrato}
            ordemInicial={ordemInicial}
          />
        </CrudTableLayout>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Central de Chamados"
        description="Ciclo completo da prestação de serviços: solicitação, encaminhamento, atendimento, acompanhamento e resolução — sempre vinculado a uma unidade predial e a um contrato."
        actions={podeAbrir ? botaoNovo : undefined}
      />

      <Tabs defaultValue="pendentes" className="space-y-4">
        {/* Em telas estreitas as abas rolam em vez de quebrar em duas linhas. */}
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="pendentes" className="gap-1.5">
              <Inbox className="h-4 w-4" />Pendentes
              <span className="ml-0.5 tabular-nums opacity-70">{pendentes.length}</span>
            </TabsTrigger>
            <TabsTrigger value="fechados" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />Fechados
              <span className="ml-0.5 tabular-nums opacity-70">{fechados.length}</span>
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />Todos
              <span className="ml-0.5 tabular-nums opacity-70">{filtrados.length}</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />Personalizado
            </TabsTrigger>
            <TabsTrigger value="painel" className="gap-1.5">
              <Ticket className="h-4 w-4" />Painel
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pendentes">
          {/* Pendentes nao filtra por status: a propria aba ja e o recorte. */}
          <Lista dados={pendentes} colunas={COLUNAS_PENDENTES} ordemInicial="prazo" mostrarStatus={false} />
        </TabsContent>

        <TabsContent value="fechados">
          <Lista dados={fechados} colunas={COLUNAS_FECHADOS} ordemInicial="fechado_em" mostrarStatus={false} />
        </TabsContent>

        <TabsContent value="todos">
          <Lista dados={filtrados} colunas={COLUNAS_TODOS} ordemInicial="ultima_movimentacao" />
        </TabsContent>

        <TabsContent value="custom">
          <div className="space-y-4">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <FioAcento />
              <CardContent className="p-3">
              <Label className={`${TYPO.eyebrow} text-muted-foreground`}>
                Colunas exibidas
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLUNAS_ESCOLHIVEIS.map((c) => {
                  const ativa = colunasCustom.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColunasCustom((atual) =>
                        ativa
                          // Nunca deixa a tabela sem nenhuma coluna.
                          ? (atual.length > 1 ? atual.filter((x) => x !== c.id) : atual)
                          : [...atual, c.id],
                      )}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        ativa
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.rotulo}
                    </button>
                  );
                })}
              </div>
              </CardContent>
            </Card>
            <Lista dados={filtrados} colunas={colunasCustom} />
          </div>
        </TabsContent>

        <TabsContent value="painel">
          <PainelTab
            chamados={filtrados} unidades={unidades}
            contratos={todosContratos} filtros={filtros} onFiltrosChange={setFiltros}
            responsaveis={responsaveis} nomeUnidade={nomeUnidade}
          />
        </TabsContent>

        <TabsContent value="relatorios">
          <RelatoriosTab
            chamados={filtrados} unidades={unidades}
            contratos={todosContratos} filtros={filtros} onFiltrosChange={setFiltros}
            responsaveis={responsaveis}
            nomeUnidade={nomeUnidade} rotuloContrato={rotuloContrato}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
