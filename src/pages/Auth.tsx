import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast({ title: "Falha no acesso", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
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
    toast({
      title: "Cadastro enviado",
      description: "Verifique seu e-mail para confirmar a conta. Após confirmar, aguarde liberação de papel pelo administrador.",
    });
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
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
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
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={onLogin} className="space-y-4">
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
                    Após confirmar o e-mail, um administrador precisa liberar seu acesso.
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
