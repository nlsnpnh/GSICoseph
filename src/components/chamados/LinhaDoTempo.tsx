import { formatarDataHora } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import type { ChamadoEvento } from "@/data/chamadoEventos";
import { eventoTone, statusTone } from "./formatacao";

// =====================================================================
// Historico do chamado. So cresce: nenhum evento e editado ou apagado,
// nem quando o chamado muda de status ou e reaberto.
// =====================================================================

export function LinhaDoTempo({ eventos }: { eventos: ChamadoEvento[] }) {
  if (eventos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 pl-6">
      {/* Fio vertical que costura os marcadores. */}
      <span className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden />

      {eventos.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-background ${eventoTone[e.tipo]}`}
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <time className="text-xs tabular-nums text-muted-foreground">
              {formatarDataHora(e.criado_em)}
            </time>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {e.tipo}
            </Badge>
            {e.status_novo && (
              <span className="flex items-center gap-1 text-xs">
                {e.status_anterior && (
                  <>
                    <Badge variant="outline" className={`${statusTone[e.status_anterior]} text-[10px]`}>
                      {e.status_anterior}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                  </>
                )}
                <Badge variant="outline" className={`${statusTone[e.status_novo]} text-[10px]`}>
                  {e.status_novo}
                </Badge>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{e.autor_nome}</p>
          {e.mensagem && (
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{e.mensagem}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
