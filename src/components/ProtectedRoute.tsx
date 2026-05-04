import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function ProtectedRoute({ requireRole }: { requireRole?: "admin" | "gestor" }) {
  const { user, loading, isAdmin, isGestor, roles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-4 text-lg font-semibold">Acesso pendente</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta foi criada, mas ainda não possui um papel atribuído.
            Aguarde a liberação por um administrador do SIG-COSEPH.
          </p>
        </div>
      </div>
    );
  }

  if (requireRole === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (requireRole === "gestor" && !isAdmin && !isGestor) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
