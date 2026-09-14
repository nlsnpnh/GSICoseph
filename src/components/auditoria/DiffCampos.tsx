import { Badge } from "@/components/ui/badge";
import {
  formatarValor, mudancas, ROTULO_OPERACAO,
  type EntradaAuditoria, type Operacao, type ResolverNome,
} from "@/lib/auditoria";
import { operacaoTone } from "./formatacao";

export function SeloOperacao({ operacao }: { operacao: Operacao }) {
  return (
    <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${operacaoTone[operacao]}`}>
      {ROTULO_OPERACAO[operacao]}
    </Badge>
  );
}

/**
 * Campo a campo de uma entrada. Na alteração, duas colunas — o valor antigo
 * riscado ao lado do novo; nas demais, uma só com o conteúdo do registro.
 */
export function DiffCampos({ entrada, resolver }: { entrada: EntradaAuditoria; resolver?: ResolverNome }) {
  const lista = mudancas(entrada);
  if (lista.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum campo preenchido.</p>;
  }

  const comparacao = entrada.operacao === "UPDATE";
  const fmt = (v: unknown, campo: string) => formatarValor(v, { campo, resolver });

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-muted/40 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th className="w-[30%] px-3 py-1.5 font-medium">Campo</th>
            {comparacao ? (
              <>
                <th className="px-3 py-1.5 font-medium">Antes</th>
                <th className="px-3 py-1.5 font-medium">Depois</th>
              </>
            ) : (
              <th className="px-3 py-1.5 font-medium">
                {entrada.operacao === "DELETE" ? "Valor no momento da exclusão" : "Valor"}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {lista.map((m) => (
            <tr key={m.campo} className="border-t border-border align-top">
              <td className="px-3 py-1.5 text-muted-foreground">{m.rotulo}</td>
              {comparacao ? (
                <>
                  <td className="whitespace-pre-wrap break-words px-3 py-1.5 text-muted-foreground line-through decoration-critical/50">
                    {fmt(m.antes, m.campo)}
                  </td>
                  <td className="whitespace-pre-wrap break-words px-3 py-1.5 text-foreground">
                    {fmt(m.depois, m.campo)}
                  </td>
                </>
              ) : (
                <td className="whitespace-pre-wrap break-words px-3 py-1.5 text-foreground">
                  {fmt(entrada.operacao === "DELETE" ? m.antes : m.depois, m.campo)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
