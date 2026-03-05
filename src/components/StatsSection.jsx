import { createElement } from "react";
import { Gauge, TrendingUp, Users } from "lucide-react";
import { useTheme } from "../context/useTheme";

const stats = [
  {
    title: "Contexto",
    value: "Cenario real",
    description: "Apresentamos o tema com linguagem simples e proxima do dia a dia.",
    icon: Gauge,
  },
  {
    title: "Impactos",
    value: "Olhar humano",
    description: "Mostramos como o uso excessivo de telas pode afetar rotina e bem-estar.",
    icon: TrendingUp,
  },
  {
    title: "Caminhos",
    value: "Acao pratica",
    description: "Indicamos formas de iniciar conversas e construir habitos mais equilibrados.",
    icon: Users,
  },
];

export default function StatsSection() {
  const { isDark } = useTheme();
  const titleClass = isDark ? "text-white" : "text-slate-900";
  const textClass = isDark ? "text-slate-400" : "text-slate-600";
  const cardClass = isDark
    ? "border-slate-800 bg-slate-900/70 shadow-black/20"
    : "border-slate-200 bg-white/90 shadow-slate-300/40";
  const itemTitleClass = isDark ? "text-slate-400" : "text-slate-600";
  const itemValueClass = isDark ? "text-white" : "text-slate-900";
  const itemDescriptionClass = isDark ? "text-slate-500" : "text-slate-600";
  const iconClass = isDark
    ? "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30"
    : "bg-cyan-100 text-cyan-700 ring-cyan-300";

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className={`text-3xl font-bold md:text-4xl ${titleClass}`}>
            O que voce encontra nesta pagina
          </h2>
          <p className={`mx-auto mt-3 max-w-2xl ${textClass}`}>
            Esta tela foi pensada para explicar o projeto, o motivo dele existir e como ele pode
            ajudar pessoas reais.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(({ title, value, description, icon: Icon }) => (
            <article
              key={title}
              className={`rounded-2xl border p-6 shadow-lg ${cardClass}`}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${iconClass}`}>
                {createElement(Icon, { size: 18 })}
              </div>
              <p className={`mt-5 text-sm ${itemTitleClass}`}>{title}</p>
              <p className={`mt-1 text-4xl font-bold ${itemValueClass}`}>{value}</p>
              <p className={`mt-2 text-sm ${itemDescriptionClass}`}>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
