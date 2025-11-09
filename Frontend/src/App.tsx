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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/dashboard/report" element={<ReportIssue />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/heatmap" element={<Heatmap />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/issues" element={<AllIssues />} />
            <Route path="/auth/login" element={<Login />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
