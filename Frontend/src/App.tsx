import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import Landing from "./pages/Landing";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import ReportIssue from "./pages/ReportIssue";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Heatmap from "./pages/admin/Heatmap";
import Categories from "./pages/admin/Categories";
import AllIssues from "./pages/admin/AllIssues";

import RequireAuth from "./routes/RequireAuth";
import RequireAdmin from "./routes/RequireAdmin";
import PublicRoute from "./routes/PublicRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* public */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            {/* student protected routes */}
            <Route path="/dashboard" element={
              <RequireAuth>
                <StudentDashboard />
              </RequireAuth>
            } />
            <Route path="/dashboard/report" element={
              <RequireAuth>
                <ReportIssue />
              </RequireAuth>
            } />
            <Route path="/dashboard/profile" element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            } />
            <Route path="/dashboard/leaderboard" element={
              <RequireAuth>
                <Leaderboard />
              </RequireAuth>
            } />

            {/* admin protected routes */}
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            } />
            <Route path="/admin/heatmap" element={
              <RequireAdmin>
                <Heatmap />
              </RequireAdmin>
            } />
            <Route path="/admin/categories" element={
              <RequireAdmin>
                <Categories />
              </RequireAdmin>
            } />
            <Route path="/admin/issues" element={
              <RequireAdmin>
                <AllIssues />
              </RequireAdmin>
            } />

            {/* catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
