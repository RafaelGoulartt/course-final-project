import { useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/useTheme";

const navItems = [
  { label: "Inicio", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const themeButtonClass = isDark
    ? "border-slate-700 text-slate-200 hover:bg-slate-900"
    : "border-slate-300 text-slate-700 hover:bg-slate-100";

  const headerClass = isDark
    ? "border-slate-800/70 bg-slate-950/80"
    : "border-slate-300/80 bg-white/85";

  const navTextClass = isDark ? "text-slate-300" : "text-slate-700";
  const titleClass = isDark ? "text-slate-100" : "text-slate-900";
  const mobilePanelClass = isDark ? "border-slate-800 bg-slate-950" : "border-slate-300 bg-white";
  const mobileHoverClass = isDark ? "hover:bg-slate-900" : "hover:bg-slate-100";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl ${headerClass}`}>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-300 text-sm font-bold text-slate-950">
            TCC
          </span>
          <span className={`text-sm font-semibold md:text-base ${titleClass}`}>
            Trabalho de Conclusao de Curso
          </span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <ul className={`flex items-center gap-8 text-sm ${navTextClass}`}>
            {navItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link className={`transition ${isDark ? "hover:text-white" : "hover:text-slate-950"}`} to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <a className={`transition ${isDark ? "hover:text-white" : "hover:text-slate-950"}`} href={item.href}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${themeButtonClass}`}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Tema claro" : "Tema escuro"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? "Claro" : "Escuro"}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-lg border p-2 transition ${themeButtonClass}`}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Tema claro" : "Tema escuro"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className={`rounded-lg border p-2 transition ${themeButtonClass}`}
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className={`border-t px-4 py-4 md:hidden ${mobilePanelClass}`}>
          <ul className={`space-y-3 text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {navItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 transition ${mobileHoverClass}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 transition ${mobileHoverClass}`}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
