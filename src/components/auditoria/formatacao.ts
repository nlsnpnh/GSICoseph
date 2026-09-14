import type { Operacao } from "@/lib/auditoria";

// Uma cor por natureza do ato: inclusão verde, alteração no azul
// institucional, exclusão vermelha. O retrato não é ato de ninguém — sai
// tracejado e sem cor, como os demais "não informado" do sistema.
export const operacaoTone: Record<Operacao, string> = {
  INSERT: "border-adequate/40 bg-adequate/10 text-adequate",
  UPDATE: "border-primary/30 bg-primary/5 text-primary",
  DELETE: "border-critical/40 bg-critical/10 text-critical",
  RETRATO: "border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground",
};
