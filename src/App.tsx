import { Suspense, lazy } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PeriodProvider } from "@/contexts/PeriodContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

// Auth fica no bundle inicial: e a primeira tela de quem nao esta logado,
// entao carregar sob demanda custaria um round-trip a mais no acesso mais comum.
import AuthPage from "./pages/Auth";

// Demais rotas sao carregadas sob demanda. Sem isso, abrir /auth baixava
// recharts + o geojson do mapa + o sistema inteiro antes de mostrar o campo de senha.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UnidadesPage = lazy(() => import("./pages/UnidadesPage"));
const ComarcasPage = lazy(() => import("./pages/ComarcasPage"));
const ServidoresPage = lazy(() => import("./pages/ServidoresPage"));
const ServidoresPorUnidadePage = lazy(() => import("./pages/ServidoresPorUnidadePage"));
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage"));
const OcorrenciasPage = lazy(() => import("./pages/OcorrenciasPage"));
const BoletimPage = lazy(() => import("./pages/BoletimPage"));
const RelatoriosPage = lazy(() => import("./pages/RelatoriosPage"));
const EquipamentosPage = lazy(() => import("./pages/EquipamentosPage"));
const TerceirizadosPage = lazy(() => import("./pages/TerceirizadosPage"));
const AfsPorUnidadePage = lazy(() => import("./pages/AfsPorUnidadePage"));
const PortoesPage = lazy(() => import("./pages/PortoesPage"));
const ContratosPage = lazy(() => import("./pages/ContratosPage"));
const PlanejamentoPage = lazy(() => import("./pages/PlanejamentoPage"));
const OrcamentoPage = lazy(() => import("./pages/OrcamentoPage"));
const ConsultasPage = lazy(() => import("./pages/ConsultasPage"));
const AjudaPage = lazy(() => import("./pages/AjudaPage"));
const CadastroPendentePage = lazy(() => import("./pages/CadastroPendentePage"));
const BootstrapAdminPage = lazy(() => import("./pages/BootstrapAdminPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
    Carregando...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PeriodProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/aguardando-aprovacao" element={<CadastroPendentePage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/unidades" element={<UnidadesPage />} />
                <Route path="/comarcas" element={<ComarcasPage />} />
                <Route path="/servidores" element={<ServidoresPage />} />
                <Route path="/servidores/por-unidade" element={<ServidoresPorUnidadePage />} />
                <Route path="/terceirizados" element={<TerceirizadosPage />} />
                <Route path="/terceirizados/afs-por-unidade" element={<AfsPorUnidadePage />} />
                <Route path="/equipamentos" element={<EquipamentosPage />} />
                <Route path="/portoes" element={<PortoesPage />} />
                <Route path="/contratos" element={<ContratosPage />} />
                <Route element={<ProtectedRoute requireRole="admin" />}>
                  <Route path="/planejamento" element={<PlanejamentoPage />} />
                  <Route path="/orcamento" element={<OrcamentoPage />} />
                </Route>
                <Route path="/ocorrencias" element={<OcorrenciasPage />} />
                <Route path="/boletim" element={<BoletimPage />} />
                <Route path="/consultas" element={<ConsultasPage />} />
                <Route path="/relatorios" element={<RelatoriosPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                <Route path="/bootstrap-admin" element={<BootstrapAdminPage />} />
                <Route path="/ajuda" element={<AjudaPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </PeriodProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
