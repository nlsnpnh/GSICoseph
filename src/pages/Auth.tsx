import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

// Acesso ao Supabase sem tipagem estrita para colunas fora do types.ts gerado.
const sb = supabase as unknown as { from: (t: string) => any };

const MSG_BLOQUEIO =
  "Aguardando liberação administrativa. Seu usuário ainda não possui perfil operacional ou unidade vinculada.";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string | null>(null);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup
  const [sNome, setSNome] = useState("");
  const [sMatricula, setSMatricula] = useState("");
  const [sCargo, setSCargo] = useState("");
  const [sLotacao, setSLotacao] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");

  useEffect(() => {
    document.title = "Acessar | SIG-COSEPH";
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  /** Verifica se o usuário possui perfil e (quando operador) unidade vinculada. */
  const usuarioLiberado = async (uid: string) => {
    const { data: roleRows } = await sb.from("user_roles").select("role").eq("user_id", uid);
    const roles: string[] = (roleRows ?? []).map((r: any) => r.role);
    const isAdmin = roles.includes("admin");
    const isGestor = roles.includes("gestor");
    const isOperador = roles.includes("operador");
    if (isAdmin || isGestor) return true;
    if (!isOperador) return false;
    const { data: prof } = await sb.from("profiles").select("unidade_id").eq("user_id", uid).maybeSingle();
    return !!prof?.unidade_id;
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLoginMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      toast({ title: "Falha no acesso", description: error.message, variant: "destructive" });
      return;
    }
    // Bloqueia o acesso até que haja perfil + unidade vinculada.
    const liberado = data.user ? await usuarioLiberado(data.user.id) : false;
    setBusy(false);
    if (!liberado) {
      await supabase.auth.signOut();
      setLoginMsg(MSG_BLOQUEIO);
      return;
    }
    navigate("/", { replace: true });
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome_completo: sNome, matricula: sMatricula, cargo: sCargo, lotacao: sLotacao },
      },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Falha no cadastro", description: error.message, variant: "destructive" });
      return;
    }
    // Não acessar o sistema imediatamente — encerra sessão e leva à confirmação.
    if (data.session) await supabase.auth.signOut();
    navigate("/aguardando-aprovacao", { replace: true });
  };

  const onForgot = async () => {
    if (!email) {
      toast({ title: "Informe seu e-mail no campo acima", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "E-mail enviado", description: "Confira sua caixa de entrada." });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/GSI.png" alt="SIG-COSEPH" className="h-16 w-16 object-contain" />
          <h1 className="mt-3 text-xl font-semibold text-foreground">SIG-COSEPH</h1>
          <p className="text-xs text-muted-foreground">
            Sistema Integrado de Gestão da Segurança Patrimonial e Humana — TJRO
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso ao sistema</CardTitle>
            <CardDescription>Entre com suas credenciais institucionais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" onValueChange={() => setLoginMsg(null)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={onLogin} className="space-y-4">
                  {loginMsg && (
                    <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{loginMsg}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={onForgot}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={onSignup} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input required value={sNome} onChange={(e) => setSNome(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Matrícula</Label>
                      <Input value={sMatricula} onChange={(e) => setSMatricula(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Input value={sCargo} onChange={(e) => setSCargo(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lotação</Label>
                    <Input value={sLotacao} onChange={(e) => setSLotacao(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail institucional</Label>
                    <Input type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={sPassword}
                      onChange={(e) => setSPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Enviando..." : "Cadastrar"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Após o cadastro, um administrador precisa liberar seu acesso.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
