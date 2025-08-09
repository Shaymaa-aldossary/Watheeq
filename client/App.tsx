import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import CVESearch from "./pages/CVESearch";
import ToolManagement from "./pages/ToolManagement";
import UserReports from "./pages/UserReports";
import UserRequests from "./pages/UserRequests";

// User Pages
import UserDashboard from "./pages/UserDashboard";
import UsageReport from "./pages/UsageReport";
import ToolRequest from "./pages/ToolRequest";
import AvailableTools from "./pages/AvailableTools";
import PreviousReports from "./pages/PreviousReports";

// Placeholder Pages
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'user' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root redirect */}
      <Route path="/" element={
        isAuthenticated ?
          <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace /> :
          <Navigate to="/login" replace />
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <Layout userRole="admin">
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/tools" element={
        <ProtectedRoute requiredRole="admin">
          <Layout userRole="admin">
            <ToolManagement />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/requests" element={
        <ProtectedRoute requiredRole="admin">
          <Layout userRole="admin">
            <UserRequests />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute requiredRole="admin">
          <Layout userRole="admin">
            <UserReports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/cve-search" element={
        <ProtectedRoute requiredRole="admin">
          <Layout userRole="admin">
            <CVESearch />
          </Layout>
        </ProtectedRoute>
      } />

      {/* User Routes */}
      <Route path="/user" element={
        <ProtectedRoute requiredRole="user">
          <Layout userRole="user">
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/user/tools" element={
        <ProtectedRoute requiredRole="user">
          <Layout userRole="user">
            <AvailableTools />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/user/request" element={
        <ProtectedRoute requiredRole="user">
          <Layout userRole="user">
            <ToolRequest />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/user/report" element={
        <ProtectedRoute requiredRole="user">
          <Layout userRole="user">
            <UsageReport />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/user/previous-reports" element={
        <ProtectedRoute requiredRole="user">
          <Layout userRole="user">
            <PreviousReports />
          </Layout>
        </ProtectedRoute>
      } />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
