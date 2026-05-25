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
import Dashboard from "./pages/Dashboard";

import UnidadesPage from "./pages/UnidadesPage";
import ComarcasPage from "./pages/ComarcasPage";
import ServidoresPage from "./pages/ServidoresPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import OcorrenciasPage from "./pages/OcorrenciasPage";
import BoletimPage from "./pages/BoletimPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import EquipamentosPage from "./pages/EquipamentosPage";
import TerceirizadosPage from "./pages/TerceirizadosPage";
import PortoesPage from "./pages/PortoesPage";
import ContratosPage from "./pages/ContratosPage";
import ConsultasPage from "./pages/ConsultasPage";
import AjudaPage from "./pages/AjudaPage";
import AuthPage from "./pages/Auth";
import CadastroPendentePage from "./pages/CadastroPendentePage";
import BootstrapAdminPage from "./pages/BootstrapAdminPage";
import ResetPasswordPage from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PeriodProvider>
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
                <Route path="/terceirizados" element={<TerceirizadosPage />} />
                <Route path="/equipamentos" element={<EquipamentosPage />} />
                <Route path="/portoes" element={<PortoesPage />} />
                <Route path="/contratos" element={<ContratosPage />} />
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
          </PeriodProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
