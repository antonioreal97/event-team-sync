
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EventsList from "./pages/Events/EventsList";
import EventDetail from "./pages/Events/EventDetail";
import CreateEvent from "./pages/Events/CreateEvent";
import EditEvent from "./pages/Events/EditEvent";
import NotificationsList from "./pages/Notifications/NotificationsList";
import TeamScheduling from "./pages/TeamManagement/TeamScheduling";
import PaymentManagement from "./pages/TeamManagement/PaymentManagement";
import TeamManagement from "./pages/TeamManagement/TeamManagement";
import EventInterestManagement from "./pages/TeamManagement/EventInterestManagement";
import { TeamEscalation } from "./pages/TeamManagement/TeamEscalation";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import EquipmentManagement from "./pages/Equipment/EquipmentManagement";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // You could show a loading spinner here
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <img 
            src="/logo-s4u.png" 
            alt="Equipe S4U Logo" 
            className="h-14 w-14 object-contain animate-pulse"
          />
        </div>
        <p className="text-foreground">Carregando...</p>
      </div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      
      {/* Protected routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsList /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsList /></ProtectedRoute>} />
      <Route path="/team-management" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
      <Route path="/team-scheduling" element={<ProtectedRoute><TeamScheduling /></ProtectedRoute>} />
      <Route path="/payment-management" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
      <Route path="/pending-allocations" element={<ProtectedRoute><EventInterestManagement /></ProtectedRoute>} />
      <Route path="/event-interest-management" element={<Navigate to="/pending-allocations" replace />} />
      <Route path="/team-escalation" element={<ProtectedRoute><TeamEscalation /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      {/* Equipment management */}
      <Route path="/equipment" element={<ProtectedRoute><EquipmentManagement /></ProtectedRoute>} />
      
      {/* 404 catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Aplicar tema escuro por padrão
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
