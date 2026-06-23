import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmtBRL } from "@/data/orcamento";

type Props = {
  value: number | null;
  onChange: (v: number) => void;
  className?: string;
};

/**
 * Campo de moeda em R$ (pt-BR). Exibe o valor formatado (ex.: "R$ 20.406.300,00")
 * e edita por dígitos no estilo "caixa": o número é preenchido da direita para a
 * esquerda (centavos). Mantém o valor numérico cru no estado do formulário.
 */
export function CurrencyInput({ value, onChange, className }: Props) {
  const display = value == null ? "" : fmtBRL(value);
  return (
    <Input
      inputMode="numeric"
      className={cn("text-right tabular-nums", className)}
      value={display}
      placeholder="R$ 0,00"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onChange(digits === "" ? 0 : Number(digits) / 100);
      }}
    />
  );
}
