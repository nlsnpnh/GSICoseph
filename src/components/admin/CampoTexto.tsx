import { useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

/**
 * Campo de texto de célula que cresce com o conteúdo.
 *
 * Um <textarea> comum exibe a alça de redimensionamento no canto — dentro de
 * uma tabela ela vira uma "caixinha" pendurada em cada linha. Aqui a alça sai
 * e a altura acompanha o texto, então o campo mostra tudo sem barra de rolagem
 * e sem nada para arrastar.
 */
export function CampoTexto({ value, onChange, placeholder, className, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const ajustarAltura = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // useLayoutEffect: ajusta antes da pintura, senão a linha "pula" a cada tecla.
  useLayoutEffect(ajustarAltura, [value, ajustarAltura]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex min-h-[28px] w-full resize-none overflow-hidden rounded border border-input bg-background",
        "px-2 py-1 text-[12px] leading-[1.35] ring-offset-background",
        "placeholder:text-muted-foreground/60",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      {...rest}
    />
  );
}
