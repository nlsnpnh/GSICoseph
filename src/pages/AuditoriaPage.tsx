import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Download, History, X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CrudTableLayout } from "@/components/CrudTableLayout";
import { EmptyState } from "@/components/EmptyState";
import { FioAcento } from "@/components/admin/FioAcento";
import { SUB } from "@/components/admin/estilos";
import { DiffCampos, SeloOperacao } from "@/components/auditoria/DiffCampos";
import { usePainelHistorico } from "@/components/auditoria/usePainelHistorico";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FILTROS_VAZIOS, TAMANHO_PAGINA_AUDITORIA, buscarParaExportar,
  useAuditoria, useResolverNomes, useTabelasDescobertas, useUsuariosAuditoria,
  type FiltrosAuditoria,
} from "@/data/auditoria";
import {
  OPERACOES, ROTULO_OPERACAO, ROTULO_ORIGEM, ROTULO_TABELA,
  autor, linhaExportacao, resumo, rotuloTabela, type Operacao,
} from "@/lib/auditoria";
import { formatarDataHora } from "@/lib/dates";
import { exportExcel } from "@/lib/exporters";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Radix não aceita SelectItem com valor vazio: "todas" é o sentinela da tela,
// traduzido para "" no filtro.
const TODAS = "todas";

const TABELAS = Object.entries(ROTULO_TABELA).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));

export default function AuditoriaPage() {
  useEffect(() => { document.title = "Trilha de Auditoria | COSEPH TJRO"; }, []);

  const [filtros, setFiltros] = useState<Omit<FiltrosAuditoria, "busca">>(FILTROS_VAZIOS);
  const [busca, setBusca] = useState("");
  const [buscaAdiada, setBuscaAdiada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [aberta, setAberta] = useState<number | null>(null);
  const [exportando, setExportando] = useState(false);

  // A busca vai ao banco: espera o usuário parar de digitar.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAdiada(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const f: FiltrosAuditoria = useMemo(() => ({ ...filtros, busca: buscaAdiada }), [filtros, buscaAdiada]);
  // Filtro novo, lista nova: volta à primeira página e fecha o detalhe aberto.
  useEffect(() => { setPagina(1); setAberta(null); }, [f]);

  const { entradas, total, carregando, erro } = useAuditoria(f, pagina);
  const usuarios = useUsuariosAuditoria();
  const resolver = useResolverNomes();
  const descobertas = useTabelasDescobertas();
  const historico = usePainelHistorico();

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA_AUDITORIA));
  const filtrando = Object.values(filtros).some(Boolean) || busca !== "";

  const setFiltro = <K extends keyof typeof filtros>(k: K, v: (typeof filtros)[K]) =>
    setFiltros((atual) => ({ ...atual, [k]: v }));

  const exportar = async () => {
    setExportando(true);
    try {
      const { entradas: todas, truncado } = await buscarParaExportar(f);
      await exportExcel(todas.map((e) => linhaExportacao(e, resolver)), "trilha-auditoria", "Auditoria");
      if (truncado) {
        toast({
          title: "Planilha parcial",
          description: `Saíram as ${todas.length.toLocaleString("pt-BR")} entradas mais recentes. Estreite o período para exportar o restante.`,
        });
      }
    } catch (e) {
      toast({ title: "Erro ao exportar", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sistema"
        title="Trilha de Auditoria"
        description="Toda inclusão, alteração e exclusão feita no sistema, com autor, data e valores anteriores. Os registros não podem ser alterados nem apagados."
        actions={
          <Button size="sm" variant="outline" onClick={exportar} disabled={exportando || total === 0}>
            <Download className="mr-1 h-4 w-4" />
            {exportando ? "Exportando..." : "Exportar planilha"}
          </Button>
        }
      />

      {descobertas.length > 0 && (
        <Card className="mb-3 overflow-hidden border-partial/50 shadow-sm">
          <CardContent className="flex gap-3 p-3 text-[13px]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-partial" />
            <div>
              <p className="font-medium">
                {descobertas.length === 1 ? "1 tabela está" : `${descobertas.length} tabelas estão`} fora da trilha:{" "}
                <span className="font-mono text-xs">{descobertas.join(", ")}</span>
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Mudanças nelas não ficam registradas. Para incluir, rode no SQL Editor:{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">SELECT public.auditoria_ativar('nome_da_tabela');</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <CrudTableLayout
        search={busca}
        onSearchChange={setBusca}
        placeholder="Buscar por registro ou usuário..."
        count={total}
        filters={
          <>
            <Select value={filtros.tabela || TODAS} onValueChange={(v) => setFiltro("tabela", v === TODAS ? "" : v)}>
              <SelectTrigger className="h-8 w-[190px] text-[13px]"><SelectValue placeholder="Tabela" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todas as tabelas</SelectItem>
                {TABELAS.map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filtros.usuarioId || TODAS} onValueChange={(v) => setFiltro("usuarioId", v === TODAS ? "" : v)}>
              <SelectTrigger className="h-8 w-[190px] text-[13px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todos os usuários</SelectItem>
                {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={filtros.operacao || TODAS}
              onValueChange={(v) => setFiltro("operacao", v === TODAS ? "" : (v as Operacao))}
            >
              <SelectTrigger className="h-8 w-[170px] text-[13px]"><SelectValue placeholder="Operação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todas as mudanças</SelectItem>
                {OPERACOES.map((o) => <SelectItem key={o} value={o}>{ROTULO_OPERACAO[o]}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Input
                type="date" aria-label="De" value={filtros.de} max={filtros.ate || undefined}
                onChange={(e) => setFiltro("de", e.target.value)}
                className="h-8 w-[138px] text-[13px]"
              />
              <span>até</span>
              <Input
                type="date" aria-label="Até" value={filtros.ate} min={filtros.de || undefined}
                onChange={(e) => setFiltro("ate", e.target.value)}
                className="h-8 w-[138px] text-[13px]"
              />
            </div>

            {filtrando && (
              <Button
                variant="ghost" size="sm" className="h-8 text-muted-foreground"
                onClick={() => { setFiltros(FILTROS_VAZIOS); setBusca(""); }}
              >
                <X className="mr-1 h-3.5 w-3.5" />Limpar
              </Button>
            )}
          </>
        }
      >
        {erro ? (
          <div className="p-8 text-center text-sm">
            <p className="font-medium">Não foi possível ler a trilha de auditoria.</p>
            <p className="mt-1 text-muted-foreground">
              Se a trilha ainda não foi ativada, aplique a migration{" "}
              <code className="font-mono text-xs">20260914120000_trilha_auditoria.sql</code> pelo SQL Editor.
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{erro.message}</p>
          </div>
        ) : carregando ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : entradas.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nenhum registro na trilha"
            description={filtrando ? "Nada corresponde aos filtros aplicados." : "As mudanças feitas a partir da ativação aparecem aqui."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-[128px]">Quando</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="w-[120px]">Operação</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>O que mudou</TableHead>
                  <TableHead className="w-[36px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.map((e) => {
                  const expandida = aberta === e.id;
                  const origem = e.origem !== "app" ? ROTULO_ORIGEM[e.origem] : null;
                  return (
                    <Fragment key={e.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setAberta(expandida ? null : e.id)}
                        aria-expanded={expandida}
                      >
                        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                          {formatarDataHora(e.ocorrido_em)}
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{autor(e)}</span>
                          {(e.usuario_papel || origem) && (
                            <p className={SUB}>{[e.usuario_papel, origem].filter(Boolean).join(" · ")}</p>
                          )}
                        </TableCell>
                        <TableCell><SeloOperacao operacao={e.operacao} /></TableCell>
                        <TableCell>
                          <span className="text-foreground">{e.registro_rotulo || e.registro_id || "—"}</span>
                          <p className={SUB}>{rotuloTabela(e.tabela)}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{resumo(e)}</TableCell>
                        <TableCell className="text-right">
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expandida ? "rotate-180" : ""}`}
                          />
                        </TableCell>
                      </TableRow>
                      {expandida && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={6} className="bg-muted/20 px-4 py-3">
                            <DiffCampos entrada={e} resolver={resolver} />
                            {e.registro_id && (
                              <Button
                                variant="link" size="sm" className="mt-1 h-auto px-0 text-xs"
                                onClick={historico.acao(e.tabela, e.registro_id, e.registro_rotulo || e.registro_id)}
                              >
                                <History className="mr-1 h-3.5 w-3.5" />
                                Histórico completo deste registro
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPaginas > 1 && !erro && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {((pagina - 1) * TAMANHO_PAGINA_AUDITORIA + 1).toLocaleString("pt-BR")}–
              {Math.min(pagina * TAMANHO_PAGINA_AUDITORIA, total).toLocaleString("pt-BR")} de{" "}
              {total.toLocaleString("pt-BR")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-7 w-7" aria-label="Página anterior"
                disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 tabular-nums">{pagina} / {totalPaginas}</span>
              <Button
                variant="outline" size="icon" className="h-7 w-7" aria-label="Próxima página"
                disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CrudTableLayout>

      <Card className="mt-4 overflow-hidden border-border/80 shadow-sm">
        <FioAcento />
        <CardContent className="space-y-1 p-4 text-[12px] text-muted-foreground">
          <p>
            <strong className="font-medium text-foreground">Retrato inicial</strong>: na ativação da trilha, o
            estado de cada registro foi gravado como ponto de partida. Ele não diz quem criou o dado, só como
            ele estava naquele momento — o que aconteceu antes da ativação não foi registrado.
          </p>
          <p>
            <strong className="font-medium text-foreground">Origem</strong>: "Sistema" é uma ação pela tela;
            "Função administrativa", uma operação feita pelo servidor em nome de um admin (ex.: exclusão de
            usuário); "Direto no banco", uma alteração feita pelo SQL Editor do Supabase.
          </p>
        </CardContent>
      </Card>

      {historico.painel}
    </div>
  );
}
