import Sidebar from "./Sidebar";
import { useTheme } from "../context/useTheme";

export default function DashboardLayout({ children, sidebarProps }) {
  const { isDark } = useTheme();

  return (
    <div className={`flex min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <Sidebar {...sidebarProps} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
