import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Dossiers from "./pages/Dossiers";
import Analytics from "./pages/Analytics";
import LegalTracking from "./pages/LegalTracking";
import RegulatoryWatch from "./pages/RegulatoryWatch";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import Scoring from "./pages/Scoring";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dossiers" element={<Dossiers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/legal" element={<LegalTracking />} />
            <Route path="/regulatory" element={<RegulatoryWatch />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/scoring" element={<Scoring />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
