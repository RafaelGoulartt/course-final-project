import { createElement } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Clock3, ShieldAlert } from "lucide-react";
import { useTheme } from "../context/useTheme";

const highlights = [
  { label: "Nosso foco", value: "Conscientizar", icon: Clock3 },
  { label: "Com quem", value: "Famílias e escolas", icon: ShieldAlert },
  { label: "Resultado esperado", value: "Escolhas melhores", icon: BarChart3 },
];

export default function Hero() {
  const { isDark } = useTheme();

  const badgeClass = isDark
    ? "border-neutral-800 text-neutral-400"
    : "border-neutral-300 text-neutral-600";
  const titleClass = isDark ? "text-white" : "text-black";
  const textClass = isDark ? "text-neutral-400" : "text-neutral-600";
  const primaryButtonClass = isDark
    ? "bg-white text-black hover:bg-neutral-200"
    : "bg-black text-white hover:bg-neutral-800";
  const secondaryButtonClass = isDark
    ? "border-neutral-700 text-neutral-100 hover:border-white"
    : "border-neutral-300 text-neutral-800 hover:border-black";
  const cardClass = isDark ? "border-neutral-800" : "border-neutral-200";
  const highlightValueClass = isDark ? "text-white" : "text-black";
  const highlightLabelClass = isDark ? "text-neutral-500" : "text-neutral-500";
  const iconClass = isDark
    ? "border-neutral-700 text-neutral-300"
    : "border-neutral-300 text-neutral-700";

  return (
    <section className="relative overflow-hidden pt-28 md:pt-36">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-20 md:px-6">
        <div className="max-w-3xl">
          <p
            className={`inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            Projeto de conscientização digital
          </p>
          <h1 className={`mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl ${titleClass}`}>
            Este site existe para explicar, de forma simples, o impacto das telas na infância
          </h1>
          <p className={`mt-5 text-base md:text-lg ${textClass}`}>
            Nosso objetivo é ajudar famílias, educadores e a comunidade escolar a entender o
            problema, conversar sobre ele e construir hábitos digitais mais saudáveis para
            crianças e adolescentes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#sobre"
              className={`px-6 py-3 font-semibold transition ${primaryButtonClass}`}
            >
              Entender a proposta
            </a>
            <Link
              to="/dashboard"
              className={`border px-6 py-3 font-semibold transition ${secondaryButtonClass}`}
            >
              Ver dados detalhados
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className={`border p-6 ${cardClass}`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center border ${iconClass}`}>
                {createElement(Icon, { size: 18 })}
              </span>
              <p className={`mt-4 text-3xl font-bold ${highlightValueClass}`}>{value}</p>
              <p className={`mt-1 text-sm uppercase tracking-wide ${highlightLabelClass}`}>{label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
