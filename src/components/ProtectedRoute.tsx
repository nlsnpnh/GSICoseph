import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  requireRole?: "admin" | "gestor";
  /**
   * Exige que o usuario ja tenha sido liberado (papel atribuido e, para
   * operador, unidade vinculada). Desligue apenas em telas que existem
   * justamente para quem ainda nao foi liberado — ex.: bootstrap do primeiro
   * admin, que de outro modo so seria alcancavel quando ja e desnecessario.
   */
  exigeLiberacao?: boolean;
};

export default function ProtectedRoute({ requireRole, exigeLiberacao = true }: Props) {
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
  if (exigeLiberacao) {
    const liberado = isAdmin || isGestor || (isOperador && !!unidadeId);
    if (!liberado) {
      return <Navigate to="/aguardando-aprovacao" replace />;
    }
  }

  if (requireRole === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (requireRole === "gestor" && !isAdmin && !isGestor) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
