import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, ShieldCheck, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CadastroPendentePage() {
  const navigate = useNavigate();

  useEffect(() => { document.title = "Cadastro realizado | SIG-COSEPH"; }, []);

  const voltarLogin = async () => {
    // Garante que nenhuma sessão pendente permaneça ativa.
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
        {/* Identidade visual — mesma logo da tela principal */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/GSI.png" alt="SIG-COSEPH" className="h-16 w-16 object-contain" />
          <h1 className="mt-3 text-xl font-semibold text-foreground">SIG-COSEPH</h1>
          <p className="text-xs text-muted-foreground">
            Sistema Integrado de Gestão da Segurança Patrimonial e Humana — TJRO
          </p>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-success" />
          <CardContent className="p-8 text-center">
            {/* Ícone de verificação animado */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-in zoom-in duration-700">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <BadgeCheck className="h-9 w-9 text-success" />
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Cadastro realizado com sucesso
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua solicitação de acesso foi enviada para análise administrativa.
            </p>

            {/* Indicador "Aguardando aprovação" */}
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-4 py-1.5 text-xs font-medium text-warning">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
              </span>
              Aguardando aprovação
            </div>

            {/* Mensagem principal */}
            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-5 text-left">
              <p className="text-sm text-foreground">
                Seu cadastro foi registrado no <strong>SIG-COSEPH</strong>.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Antes de acessar o sistema, será necessário que um administrador realize:
              </p>
              <ul className="mt-3 space-y-2.5">
                <Step icon={UserCog}    text="Atribuição de papel/perfil de acesso" />
                <Step icon={Building2}  text="Vinculação da unidade" />
                <Step icon={ShieldCheck} text="Liberação operacional do usuário" />
              </ul>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Somente após essa configuração seu acesso será autorizado.
              </p>
            </div>

            <Button className="mt-6 w-full" onClick={voltarLogin}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar para login
            </Button>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          COSEPH · Coordenadoria de Segurança Patrimonial e Humana — Tribunal de Justiça de Rondônia
        </p>
      </div>
    </div>
  );
}

function Step({ icon: Icon, text }: { icon: typeof UserCog; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm text-foreground">{text}</span>
    </li>
  );
}
