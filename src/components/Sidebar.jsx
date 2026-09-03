import { createElement, useState } from "react";
import {
  BarChart3,
  CircleHelp,
  Download,
  LayoutDashboard,
  MapPinned,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "../context/useTheme";

export default function Sidebar({
  items,
  activeItem,
  onItemClick,
  onExport,
  onHelp,
}) {
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const defaultItems = [
    { id: "visao-geral", label: "Visao geral", icon: LayoutDashboard },
    { id: "regioes", label: "Regioes", icon: MapPinned },
    { id: "classes-sociais", label: "Classes sociais", icon: Users },
    { id: "analises", label: "Analises", icon: BarChart3 },
  ];

  const menuItems = items && items.length > 0 ? items : defaultItems;

  return (
    <>
      <button
        className={`fixed left-4 top-4 z-50 rounded-md border p-2 md:hidden ${
          isDark
            ? "border-slate-700 bg-slate-900 text-slate-100"
            : "border-slate-300 bg-slate-50 text-slate-700"
        }`}
        onClick={() => setOpen(!open)}
        aria-label="Abrir menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className={`fixed inset-0 md:hidden ${isDark ? "bg-slate-950/40" : "bg-slate-900/20"}`}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-72 flex-col border-r transition-transform duration-300 md:static
        ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className={`border-b p-6 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <p className={`text-xs uppercase tracking-[0.24em] ${isDark ? "text-blue-400" : "text-blue-600"}`}>
            Dashboard
          </p>
          <h2 className={`mt-2 text-2xl font-bold tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"}`}>
            ScreenTime BI
          </h2>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Inteligencia de uso digital no Brasil
          </p>
          <button type="button" onClick={toggleTheme} className={`mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
              isDark
                ? "border-slate-700 text-slate-200 hover:border-slate-500"
                : "border-slate-300 text-slate-700 hover:border-slate-400"
            }`}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? "Tema claro" : "Tema escuro"}
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <li key={label}>
                <button type="button"
                  onClick={() => {
                    if (onItemClick) onItemClick(id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition
                    ${
                      activeItem === id
                        ? "border-blue-500 bg-blue-500 text-white"
                        : isDark
                          ? "border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-50"
                          : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                >
                  {createElement(Icon, { size: 17 })}
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4">
          <div
            className={`rounded-lg border p-4 ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <p className={`text-sm font-semibold ${isDark ? "text-slate-50" : "text-slate-900"}`}>
              Relatorio mensal
            </p>
            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Exporte uma versao em PDF com os principais indicadores.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
              >
                <Download size={14} />
                Exportar
              </button>
              <button type="button" onClick={onHelp} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border-slate-700 text-slate-200 hover:border-slate-500"
                    : "border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                <CircleHelp size={14} />
                Ajuda
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
