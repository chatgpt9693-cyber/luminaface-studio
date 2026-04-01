import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TelegramProvider } from "@/components/TelegramProvider";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MasterDashboard from "@/pages/MasterDashboard";
import CalendarPage from "@/pages/CalendarPage";
import ClientsPage from "@/pages/ClientsPage";
import ServicesPage from "@/pages/ServicesPage";
import IncomePage from "@/pages/IncomePage";
import NotificationsPage from "@/pages/NotificationsPage";
import ClientDashboard from "@/pages/ClientDashboard";
import BookingPage from "@/pages/BookingPage";
import HistoryPage from "@/pages/HistoryPage";
import AboutServicePage from "@/pages/AboutServicePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('MASTER' | 'CLIENT')[] }) {
  const { isAuthenticated, currentRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TelegramProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Master routes */}
            <Route element={<ProtectedRoute allowedRoles={['MASTER']}><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<MasterDashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/income" element={<IncomePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
            
            {/* Client routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLIENT']}><AppLayout /></ProtectedRoute>}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/about" element={<AboutServicePage />} />
              <Route path="/client/booking" element={<BookingPage />} />
              <Route path="/client/history" element={<HistoryPage />} />
              <Route path="/client/notifications" element={<NotificationsPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TelegramProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
