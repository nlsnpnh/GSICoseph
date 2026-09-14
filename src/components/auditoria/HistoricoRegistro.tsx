import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { formatarDataHora } from "@/lib/dates";
import { autor, ROTULO_ORIGEM, rotuloTabela, mudancas } from "@/lib/auditoria";
import { useHistoricoRegistro, useResolverNomes } from "@/data/auditoria";
import { DiffCampos, SeloOperacao } from "./DiffCampos";

export type AlvoHistorico = { tabela: string; registroId: string; rotulo: string };

// =====================================================================
// Tudo que aconteceu com um registro, do mais recente ao retrato inicial.
// Abre por cima da listagem para o admin não perder o lugar onde estava.
// =====================================================================

export function HistoricoRegistro({ alvo, onFechar }: { alvo: AlvoHistorico; onFechar: () => void }) {
  const { entradas, carregando } = useHistoricoRegistro(alvo.tabela, alvo.registroId);
  const resolver = useResolverNomes();

  return (
    <Sheet open onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-light tracking-tight">Histórico do registro</SheetTitle>
          <SheetDescription>
            {alvo.rotulo} · {rotuloTabela(alvo.tabela)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5">
          {carregando ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : entradas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro na trilha. Se a trilha acabou de ser ativada, rode a
              migration de auditoria no banco.
            </p>
          ) : (
            <ol className="relative space-y-5 pl-6">
              {/* Fio vertical que costura os marcadores, como na linha do tempo dos chamados. */}
              <span className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden />
              {entradas.map((e) => {
                // Inclusão, exclusão e retrato trazem a ficha inteira: ficam
                // recolhidos para a sequência de alterações continuar legível.
                const recolhido = e.operacao !== "UPDATE";
                const qtd = mudancas(e).length;
                return (
                  <li key={e.id} className="relative">
                    <span
                      className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-primary/60 ring-4 ring-background"
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <time className="text-xs tabular-nums text-muted-foreground">
                        {formatarDataHora(e.ocorrido_em)}
                      </time>
                      <SeloOperacao operacao={e.operacao} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {autor(e)}
                      {e.usuario_papel && ` · ${e.usuario_papel}`}
                      {e.origem !== "app" && e.origem !== "sistema" && ` · ${ROTULO_ORIGEM[e.origem]}`}
                    </p>
                    <div className="mt-2">
                      {recolhido ? (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-primary hover:underline">
                            Ver {qtd} {qtd === 1 ? "campo" : "campos"}
                          </summary>
                          <div className="mt-2">
                            <DiffCampos entrada={e} resolver={resolver} />
                          </div>
                        </details>
                      ) : (
                        <DiffCampos entrada={e} resolver={resolver} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
