import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HistoricoRegistro, type AlvoHistorico } from "./HistoricoRegistro";

/**
 * Liga o histórico de auditoria a uma tela de cadastro.
 *
 *   const historico = usePainelHistorico();
 *   <AcoesLinha onHistorico={historico.acao("unidades", u.id, u.nome)} />
 *   {historico.painel}
 *
 * `acao` devolve `undefined` para quem não é admin — o botão nem aparece,
 * como manda a RLS da tabela de auditoria.
 */
export function usePainelHistorico() {
  const { isAdmin } = useAuth();
  const [alvo, setAlvo] = useState<AlvoHistorico | null>(null);

  const acao = (tabela: string, registroId: string, rotulo: string) =>
    isAdmin ? () => setAlvo({ tabela, registroId, rotulo }) : undefined;

  // Montado só quando aberto: fechado, não dispara as consultas do painel.
  const painel = alvo ? <HistoricoRegistro alvo={alvo} onFechar={() => setAlvo(null)} /> : null;

  return { acao, painel };
}
