import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ClipboardList, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FioAcento } from "@/components/admin/FioAcento";
import { TYPO } from "@/lib/design-tokens";
import { useUnidades } from "@/data/unidades";
import { calcCobertura, respondidos, semResposta } from "@/lib/seguranca";

// =====================================================================
// O que pinta o mapa, e onde falta cadastro para pintar direito.
//
// A cor de cada comarca vem de tres campos por unidade (DERSO, controle de
// acesso, vigilancia eletronica), hoje em tri-estado: sim / nao / nao
// informado. O mapa so considera unidades que responderam — comarca sem
// nenhuma resposta aparece em cinza, nao em vermelho. Este card mostra onde
// esta a lacuna, para que o cinza vire uma resposta de verdade.
// =====================================================================

export function CoberturaSegurancaCard() {
  const unidades = useUnidades();
  const [aberto, setAberto] = useState(false);

  const resumo = useMemo(() => {
    const { percentual } = calcCobertura(unidades);
    return {
      semNenhum: unidades.filter(semResposta),
      incompleto: unidades.filter((u) => respondidos(u) > 0 && respondidos(u) < 3).length,
      completo: unidades.filter((u) => respondidos(u) === 3).length,
      total: unidades.length,
      // Sem nenhuma resposta o percentual é null; exibir "—" e não "0%",
      // que afirmaria ausência de segurança em vez de ausência de dado.
      cobertura: percentual == null ? "—" : `${percentual}%`,
    };
  }, [unidades]);

  if (resumo.total === 0) return null;

  const temLacuna = resumo.semNenhum.length > 0;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <FioAcento />
      <CardHeader className="border-b border-border bg-muted/30 px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          <Info className="h-3.5 w-3.5" />O que define a cor do mapa
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 p-3">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          A cor de cada comarca vem de três campos preenchidos por unidade em{" "}
          <Link to="/unidades" className="font-medium text-foreground underline underline-offset-2">
            Unidades Prediais
          </Link>{" "}
          → seção <span className="font-medium text-foreground">Segurança</span>:{" "}
          <span className="font-medium text-foreground">DERSO</span>,{" "}
          <span className="font-medium text-foreground">controle de acesso</span> e{" "}
          <span className="font-medium text-foreground">vigilância eletrônica</span>.
          Cada campo aceita <span className="font-medium text-foreground">sim</span>,{" "}
          <span className="font-medium text-foreground">não</span> ou{" "}
          <span className="font-medium text-foreground">não informado</span> — e o
          mapa só considera as unidades que responderam. Comarca sem nenhuma
          resposta aparece em cinza, não em vermelho.
        </p>

        <div className="grid gap-2 sm:grid-cols-4">
          {[
            { rotulo: "Cobertura (do respondido)", valor: resumo.cobertura },
            { rotulo: "Totalmente respondidas", valor: resumo.completo },
            { rotulo: "Respondidas em parte", valor: resumo.incompleto },
            { rotulo: "Sem resposta", valor: resumo.semNenhum.length, alerta: temLacuna },
          ].map((i) => (
            <div key={i.rotulo} className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <p className={`${TYPO.eyebrow} text-muted-foreground`}>{i.rotulo}</p>
              <p className={`mt-1 text-[20px] font-light tabular-nums leading-none tracking-[-0.03em] ${i.alerta ? "text-partial" : ""}`}>
                {i.valor}
              </p>
            </div>
          ))}
        </div>

        {temLacuna && (
          <div className="space-y-2 rounded-md border border-partial/40 bg-partial/5 p-3">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-partial" />
              <span>
                <span className="font-medium">
                  {resumo.semNenhum.length} unidade(s) ainda não responderam nenhum
                  dos três indicadores.
                </span>{" "}
                As comarcas delas aparecem em cinza no mapa — o sistema não
                afirma que estão bem nem que estão mal, apenas que não sabe.
                Preencher o cadastro é o que transforma esse cinza numa leitura
                real de segurança.
              </span>
            </p>

            <Button
              variant="outline" size="sm" className="h-7 gap-1 text-xs"
              onClick={() => setAberto((v) => !v)}
            >
              {aberto ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {aberto ? "Ocultar" : "Ver quais unidades"}
            </Button>

            {aberto && (
              <ul className="space-y-1 pt-1">
                {resumo.semNenhum.map((u) => (
                  <li key={u.id} className="text-[13px]">
                    <Link
                      to="/unidades"
                      className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      {u.nome}
                    </Link>
                    {u.comarca_nome && (
                      <span className="text-muted-foreground"> · {u.comarca_nome}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
