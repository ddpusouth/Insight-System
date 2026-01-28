import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";

// Pages
import Index from "./pages/Index";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { CollegesPage } from "./pages/CollegesPage";
import { QueryPage } from "./pages/QueryPage";
import { ChatPage } from "./pages/ChatPage";
import { InfrastructurePage } from "./pages/InfrastructurePage";
import { SettingsPage } from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import CircularPage from "./pages/CircularPage";
import { CollegeViewPage } from './pages/CollegeViewPage';
import DdpoMessagesPage from './pages/DdpoMessagesPage';
import { AttendancePage } from './pages/AttendancePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReportPage } from './pages/ReportPage';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/colleges" element={<ProtectedRoute><CollegesPage /></ProtectedRoute>} />
        <Route path="/query" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />
        <Route path="/query/details/:id" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/infrastructure" element={<ProtectedRoute><InfrastructurePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/circular" element={<ProtectedRoute><CircularPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/colleges/:collegeCode/view" element={<ProtectedRoute><CollegeViewPage /></ProtectedRoute>} />
        <Route path="/ddpo-messages" element={<ProtectedRoute><DdpoMessagesPage /></ProtectedRoute>} />
        <Route path="/insight.html" element={!isAuthenticated ? <Index /> : <Navigate to="/dashboard" replace />} />
        <Route path="/" element={!isAuthenticated ? <Index /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
