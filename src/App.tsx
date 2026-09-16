import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";

// Route-level code-splitting: heavy pages (recharts, pdf, xlsx, pdfjs)
// are only downloaded when the user actually visits them.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Dossiers = lazy(() => import("./pages/Dossiers"));
const DossierDetail = lazy(() => import("./pages/DossierDetail"));
const MaJournee = lazy(() => import("./pages/MaJournee"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Litigation = lazy(() => import("./pages/Litigation"));
const LitigationDetail = lazy(() => import("./pages/LitigationDetail"));
const Leasing = lazy(() => import("./pages/Leasing"));
const LeasingNew = lazy(() => import("./pages/LeasingNew"));
const LeasingDetail = lazy(() => import("./pages/LeasingDetail"));
const LeasingImport = lazy(() => import("./pages/LeasingImport"));
const RegulatoryWatch = lazy(() => import("./pages/RegulatoryWatch"));
const Reporting = lazy(() => import("./pages/Reporting"));
const Settings = lazy(() => import("./pages/Settings"));
const Scoring = lazy(() => import("./pages/Scoring"));
const Relances = lazy(() => import("./pages/Relances"));
const DecisionCredit = lazy(() => import("./pages/DecisionCredit"));
const Ifrs9Engine = lazy(() => import("./pages/Ifrs9Engine"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-soft">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" aria-hidden />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dossiers" element={<Dossiers />} />
            <Route path="/dossiers/:id" element={<DossierDetail />} />
            <Route path="/aujourdhui" element={<MaJournee />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/litigation" element={<Litigation />} />
                  <Route path="/litigation/:id" element={<LitigationDetail />} />
                  <Route path="/leasing" element={<Leasing />} />
                  <Route path="/leasing/new" element={<LeasingNew />} />
                  <Route path="/leasing/import" element={<LeasingImport />} />
                  <Route path="/leasing/:id" element={<LeasingDetail />} />
                  <Route path="/regulatory" element={<RegulatoryWatch />} />
                  <Route path="/regulatory/ifrs9-engine" element={<Ifrs9Engine />} />
                  <Route path="/reporting" element={<Reporting />} />
                  <Route path="/scoring" element={<Scoring />} />
                  <Route path="/relances" element={<Relances />} />
                  <Route path="/relances/decision-credit" element={<DecisionCredit />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
