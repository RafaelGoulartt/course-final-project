import { createElement } from "react";
import { Gauge, TrendingUp, Users } from "lucide-react";
import { useTheme } from "../context/useTheme";

const stats = [
  {
    title: "Contexto",
    value: "Cenário real",
    description: "Apresentamos o tema com linguagem simples e próxima do dia a dia.",
    icon: Gauge,
  },
  {
    title: "Impactos",
    value: "Olhar humano",
    description: "Mostramos como o uso excessivo de telas pode afetar a rotina e o bem-estar.",
    icon: TrendingUp,
  },
  {
    title: "Caminhos",
    value: "Ação prática",
    description: "Indicamos formas de iniciar conversas e construir hábitos mais equilibrados.",
    icon: Users,
  },
];

export default function StatsSection() {
  const { isDark } = useTheme();
  const titleClass = isDark ? "text-slate-50" : "text-slate-900";
  const textClass = isDark ? "text-slate-500" : "text-slate-600";
  const cardClass = isDark ? "rounded-lg border-slate-800" : "rounded-lg border-slate-200";
  const itemTitleClass = isDark ? "text-slate-500" : "text-slate-500";
  const itemValueClass = isDark ? "text-slate-50" : "text-slate-900";
  const itemDescriptionClass = isDark ? "text-slate-500" : "text-slate-600";
  const iconClass = isDark
    ? "rounded-md border-slate-700 text-blue-400"
    : "rounded-md border-slate-300 text-blue-600";

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className={`text-3xl font-bold tracking-tight md:text-4xl ${titleClass}`}>
            O que você encontra nesta página
          </h2>
          <p className={`mx-auto mt-3 max-w-2xl ${textClass}`}>
            Esta tela foi pensada para explicar o projeto, o motivo de ele existir e como pode
            ajudar pessoas reais.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(({ title, value, description, icon: Icon }) => (
            <article
              key={title}
              className={`border p-6 ${cardClass}`}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center border ${iconClass}`}>
                {createElement(Icon, { size: 18 })}
              </div>
              <p className={`mt-5 text-sm uppercase tracking-wide ${itemTitleClass}`}>{title}</p>
              <p className={`mt-1 text-4xl font-bold ${itemValueClass}`}>{value}</p>
              <p className={`mt-2 text-sm ${itemDescriptionClass}`}>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
