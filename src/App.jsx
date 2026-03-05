import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/home";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import { useTheme } from "./context/useTheme";

function AppRoutes() {
  const location = useLocation();
  const { isDark } = useTheme();

  return (
    <>
      <div
        key={location.key}
        className={`route-loading-overlay fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm ${
          isDark ? "bg-slate-950/85" : "bg-slate-100/90"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={`h-12 w-12 animate-spin rounded-full border-4 border-t-sky-400 ${
              isDark ? "border-slate-700" : "border-slate-300"
            }`}
          />
          <p className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            Carregando...
          </p>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
