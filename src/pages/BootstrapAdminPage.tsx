import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function BootstrapAdminPage() {
  const [loading, setLoading] = useState(false);

  const promote = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success((data as any)?.message ?? "Você agora é admin.");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao promover");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Promover meu usuário a admin</CardTitle>
          </div>
          <CardDescription>
            Disponível apenas enquanto não houver nenhum admin no sistema. Após o primeiro admin
            ser criado, novas promoções devem ser feitas por ele.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={promote} disabled={loading}>
            {loading ? "Promovendo…" : "Tornar-me admin"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
