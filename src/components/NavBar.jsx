import { useState } from "react";
import { Menu, Moon, Sun, X, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/useTheme";
import { authService } from "../services/authService";

const navItems = [
  { label: "Início", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  function handleLogout() {
    authService.logout();
    setOpen(false);
    navigate("/");
  }

  const themeButtonClass = isDark
    ? "border-neutral-800 text-neutral-200 hover:border-neutral-600"
    : "border-neutral-300 text-neutral-700 hover:border-neutral-500";

  const headerClass = isDark
    ? "border-neutral-900 bg-black"
    : "border-neutral-200 bg-white";

  const navTextClass = isDark ? "text-neutral-400" : "text-neutral-600";
  const titleClass = isDark ? "text-white" : "text-black";
  const authButtonClass = isDark
    ? "bg-white text-black hover:bg-neutral-200"
    : "bg-black text-white hover:bg-neutral-800";
  const mobilePanelClass = isDark ? "border-neutral-900 bg-black" : "border-neutral-200 bg-white";
  const mobileHoverClass = isDark ? "hover:bg-neutral-900" : "hover:bg-neutral-100";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b ${headerClass}`}>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className={`inline-flex h-9 w-9 items-center justify-center text-sm font-bold ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
            TCC
          </span>
          <span className={`text-sm font-medium uppercase tracking-wide md:text-base ${titleClass}`}>
            Trabalho de Conclusão de Curso
          </span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <ul className={`flex items-center gap-8 text-sm ${navTextClass}`}>
            {navItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link className={`transition ${isDark ? "hover:text-white" : "hover:text-black"}`} to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <a className={`transition ${isDark ? "hover:text-white" : "hover:text-black"}`} href={item.href}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          {currentUser ? (
            <>
              <Link
                to="/dashboard-pais"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${authButtonClass}`}
              >
                <LayoutDashboard size={15} />
                Meu Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold transition ${themeButtonClass}`}
              >
                <LogOut size={15} />
                Sair
              </button>
            </>
          ) : (
            <Link to="/auth" className={`px-4 py-2 text-sm font-semibold transition ${authButtonClass}`}>
              Login / Cadastro
            </Link>
          )}
          <button type="button" onClick={toggleTheme} className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition ${themeButtonClass}`} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? "Claro" : "Escuro"}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" onClick={toggleTheme} className={`border p-2 transition ${themeButtonClass}`} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={`border p-2 transition ${themeButtonClass}`} onClick={() => setOpen(!open)} aria-label="Abrir menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className={`border-t px-4 py-4 md:hidden ${mobilePanelClass}`}>
          <ul className={`space-y-3 text-sm ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
            {navItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link to={item.to} onClick={() => setOpen(false)} className={`block px-3 py-2 transition ${mobileHoverClass}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a href={item.href} onClick={() => setOpen(false)} className={`block px-3 py-2 transition ${mobileHoverClass}`}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
            <li>
              {currentUser ? (
                <div className="space-y-2">
                  <Link
                    to="/dashboard-pais"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 font-semibold ${authButtonClass}`}
                  >
                    <LayoutDashboard size={15} />
                    Meu Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-2 border px-3 py-2 font-semibold transition ${themeButtonClass}`}
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className={`block px-3 py-2 font-semibold ${authButtonClass}`}>
                  Login / Cadastro
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
