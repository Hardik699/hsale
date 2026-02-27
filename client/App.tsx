import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Debug component to log route changes
function RouteDebugger() {
  const location = useLocation();
  console.log("📍 Route changed to:", location.pathname);
  return null;
}
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import ItemEdit from "./pages/ItemEdit";
import WhiteScreen from "./pages/WhiteScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Debug routing issues
  console.log("🚀 App component rendering");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteDebugger />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            {/* More specific routes must come BEFORE less specific ones */}
            <Route
              path="/items/:itemId/edit"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <ItemEdit />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/:itemId"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <ItemDetail />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/items"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Items />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
