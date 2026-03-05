import { createElement } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Clock3, ShieldAlert } from "lucide-react";
import { useTheme } from "../context/useTheme";

const highlights = [
  { label: "Nosso foco", value: "Conscientizar", icon: Clock3 },
  { label: "Com quem", value: "Familias e escolas", icon: ShieldAlert },
  { label: "Resultado esperado", value: "Escolhas melhores", icon: BarChart3 },
];

export default function Hero() {
  const { isDark } = useTheme();

  const badgeClass = isDark
    ? "bg-sky-500/15 text-sky-200"
    : "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
  const titleClass = isDark ? "text-white" : "text-slate-900";
  const textClass = isDark ? "text-slate-300" : "text-slate-700";
  const secondaryButtonClass = isDark
    ? "border-slate-700 text-slate-100 hover:bg-slate-900"
    : "border-slate-300 text-slate-800 hover:bg-slate-100";
  const cardClass = isDark
    ? "border-slate-800 bg-slate-900/70 shadow-black/20"
    : "border-slate-200 bg-white/90 shadow-slate-300/40";
  const highlightValueClass = isDark ? "text-white" : "text-slate-900";
  const highlightLabelClass = isDark ? "text-slate-400" : "text-slate-600";
  const iconClass = isDark
    ? "bg-sky-500/20 text-sky-300 ring-sky-400/30"
    : "bg-sky-100 text-sky-700 ring-sky-300";

  return (
    <section className="relative overflow-hidden pt-28 md:pt-36">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-20 md:px-6">
        <div className="max-w-3xl">
          <p
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            Projeto de conscientizacao digital
          </p>
          <h1 className={`mt-5 text-4xl font-bold leading-tight md:text-6xl ${titleClass}`}>
            Este site existe para explicar, de forma simples, o impacto das telas na infancia
          </h1>
          <p className={`mt-5 text-base md:text-lg ${textClass}`}>
            Nosso objetivo e ajudar familias, educadores e a comunidade escolar a entender o
            problema, conversar sobre ele e construir habitos digitais mais saudaveis para
            criancas e adolescentes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#sobre"
              className="rounded-xl bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Entender proposta
            </a>
            <Link
              to="/dashboard"
              className={`rounded-xl border px-6 py-3 font-semibold transition ${secondaryButtonClass}`}
            >
              Ver dados detalhados
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className={`rounded-2xl border p-5 shadow-lg ${cardClass}`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${iconClass}`}>
                {createElement(Icon, { size: 18 })}
              </span>
              <p className={`mt-4 text-3xl font-bold ${highlightValueClass}`}>{value}</p>
              <p className={`mt-1 text-sm ${highlightLabelClass}`}>{label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
