import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ requireRole }: { requireRole?: "admin" | "gestor" }) {
  const { user, loading, isAdmin, isGestor, isOperador, unidadeId } = useAuth();
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

  // Liberação obrigatória: papel atribuído e, para operador, unidade vinculada.
  // Admin/Gestor têm alcance sistêmico e não dependem de unidade.
  const liberado = isAdmin || isGestor || (isOperador && !!unidadeId);
  if (!liberado) {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  if (requireRole === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (requireRole === "gestor" && !isAdmin && !isGestor) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
